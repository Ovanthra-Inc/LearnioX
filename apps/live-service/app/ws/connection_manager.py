import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set
from uuid import UUID
from fastapi import WebSocket
from redis.asyncio import Redis, ConnectionPool
from app.core.config import settings

logger = logging.getLogger("live-service.ws")


class ClassroomConnectionManager:
    """
    Horizontally scalable WebSocket Connection Hub.
    Maintains local WebSocket connections per session and fans out events
    across multiple service nodes using Redis Pub/Sub.
    """

    def __init__(self):
        # session_id (str) -> dict of connection_id -> (WebSocket, user_info dict)
        self.active_rooms: Dict[str, Dict[str, tuple[WebSocket, Dict[str, Any]]]] = {}
        # connection_id -> { "session_id": str, "last_seen": float }
        self.connection_meta: Dict[str, Dict[str, Any]] = {}
        # session_id -> background redis subscription task
        self.pubsub_tasks: Dict[str, asyncio.Task] = {}
        self.redis_pool: Optional[ConnectionPool] = None
        # Ephemeral reaction buffer for storm mitigation: session_id -> { reaction_type: count }
        self.reaction_buffer: Dict[str, Dict[str, int]] = {}
        self.reaction_batch_task: Optional[asyncio.Task] = None
        self.heartbeat_task: Optional[asyncio.Task] = None

    def _ensure_background_loops(self):
        """Ensures that the reaction flusher and heartbeat loops are running."""
        if self.reaction_batch_task is None or self.reaction_batch_task.done():
            self.reaction_batch_task = asyncio.create_task(self._reaction_flusher_loop())
        if self.heartbeat_task is None or self.heartbeat_task.done():
            self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())

    def initialize_redis(self, pool: ConnectionPool):
        self.redis_pool = pool
        self._ensure_background_loops()

    def update_activity(self, connection_id: str):
        """Updates last_seen heartbeat timestamp for active connection."""
        if connection_id in self.connection_meta:
            self.connection_meta[connection_id]["last_seen"] = asyncio.get_event_loop().time()

    def get_redis(self) -> Optional[Redis]:
        if self.redis_pool:
            return Redis(connection_pool=self.redis_pool)
        return None

    # ─── Room Connection Lifecycle ─────────────────────────────────────────────
    async def connect(
        self, session_id: str, connection_id: str, websocket: WebSocket, user_info: Dict[str, Any]
    ):
        await websocket.accept()
        self._ensure_background_loops()

        if session_id not in self.active_rooms:
            self.active_rooms[session_id] = {}
            # Start Redis subscriber task for this session channel
            if self.redis_pool:
                ready_event = asyncio.Event()
                self.pubsub_tasks[session_id] = asyncio.create_task(
                    self._redis_room_subscriber(session_id, ready_event)
                )
                try:
                    await asyncio.wait_for(ready_event.wait(), timeout=2.0)
                except asyncio.TimeoutError:
                    logger.warning(f"Redis subscription wait timed out for session {session_id}")

        self.active_rooms[session_id][connection_id] = (websocket, user_info)
        self.connection_meta[connection_id] = {
            "session_id": session_id,
            "last_seen": asyncio.get_event_loop().time(),
        }
        logger.info(
            f"WS Client connected: conn={connection_id} user={user_info.get('display_name')} "
            f"role={user_info.get('role')} session={session_id} (Local total: {len(self.active_rooms[session_id])})"
        )

        # Send direct confirmation to the connected websocket
        await websocket.send_text(
            json.dumps({
                "type": "CONNECTED",
                "session_id": session_id,
                "user_info": {
                    "user_id": str(user_info.get("user_id")),
                    "display_name": user_info.get("display_name"),
                    "role": user_info.get("role"),
                    "admission_status": user_info.get("admission_status"),
                },
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
        )

        # Broadcast participant join event to room
        await self.publish_event(
            session_id,
            {
                "type": "USER_JOINED",
                "user_id": str(user_info.get("user_id")),
                "display_name": user_info.get("display_name"),
                "role": user_info.get("role"),
                "avatar_url": user_info.get("avatar_url"),
                "admission_status": user_info.get("admission_status"),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

    async def disconnect(self, session_id: str, connection_id: str):
        self.connection_meta.pop(connection_id, None)
        if session_id in self.active_rooms and connection_id in self.active_rooms[session_id]:
            _, user_info = self.active_rooms[session_id].pop(connection_id)
            logger.info(f"WS Client disconnected: conn={connection_id} session={session_id}")

            # Notify room
            await self.publish_event(
                session_id,
                {
                    "type": "USER_LEFT",
                    "user_id": str(user_info.get("user_id")),
                    "display_name": user_info.get("display_name"),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            )

            # Cleanup room if empty on this node
            if not self.active_rooms[session_id]:
                del self.active_rooms[session_id]
                task = self.pubsub_tasks.pop(session_id, None)
                if task and not task.done():
                    task.cancel()

    # ─── Event Publishing & Redis Pub/Sub ──────────────────────────────────────
    async def publish_event(self, session_id: str, event: Dict[str, Any]):
        """Publish event to Redis for horizontal fanout across all cluster nodes."""
        redis = self.get_redis()
        channel = f"classroom:{session_id}:events"
        payload = json.dumps(event)

        if redis:
            try:
                await redis.publish(channel, payload)
            except Exception as e:
                logger.error(f"Redis publish failed, falling back to local broadcast: {e}")
                await self.broadcast_local(session_id, event)
            finally:
                await redis.aclose()
        else:
            await self.broadcast_local(session_id, event)

    async def broadcast_local(self, session_id: str, event: Dict[str, Any]):
        """Broadcast event to all WebSockets connected to this specific node."""
        if session_id not in self.active_rooms:
            return

        payload = json.dumps(event)
        stale_conns: List[str] = []

        for conn_id, (ws, _) in self.active_rooms[session_id].items():
            try:
                await ws.send_text(payload)
            except Exception:
                stale_conns.append(conn_id)

        for conn_id in stale_conns:
            self.active_rooms[session_id].pop(conn_id, None)

    async def send_to_user(self, session_id: str, user_id: str, event: Dict[str, Any]):
        """Send direct event to a specific user on this node."""
        if session_id not in self.active_rooms:
            return
        payload = json.dumps(event)
        for _, (ws, uinfo) in self.active_rooms[session_id].items():
            if str(uinfo.get("user_id")) == str(user_id):
                try:
                    await ws.send_text(payload)
                except Exception:
                    pass

    async def _redis_room_subscriber(self, session_id: str, ready_event: Optional[asyncio.Event] = None):
        """Background coroutine listening to room Redis channel."""
        redis = self.get_redis()
        if not redis:
            if ready_event:
                ready_event.set()
            return

        channel_name = f"classroom:{session_id}:events"
        pubsub = redis.pubsub()
        try:
            await pubsub.subscribe(channel_name)
            logger.info(f"Subscribed to Redis channel: {channel_name}")
            if ready_event:
                ready_event.set()

            async for message in pubsub.listen():
                if message and message["type"] == "message":
                    data = message["data"]
                    if isinstance(data, bytes):
                        data = data.decode("utf-8")
                    event = json.loads(data)
                    await self.broadcast_local(session_id, event)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error in Redis subscriber for {channel_name}: {e}")
        finally:
            await pubsub.unsubscribe(channel_name)
            await pubsub.aclose()
            await redis.aclose()

    # ─── Storm Mitigation for Ephemeral Reactions ─────────────────────────────
    def buffer_reaction(self, session_id: str, reaction_type: str):
        """Buffers reaction events in memory; flushed every 200ms as an aggregate."""
        if session_id not in self.reaction_buffer:
            self.reaction_buffer[session_id] = {}
        self.reaction_buffer[session_id][reaction_type] = (
            self.reaction_buffer[session_id].get(reaction_type, 0) + 1
        )

    async def _reaction_flusher_loop(self):
        """Periodically flushes aggregate reaction counts to Redis to prevent WS flood."""
        while True:
            await asyncio.sleep(settings.REACTION_BATCH_INTERVAL_MS / 1000.0)
            if not self.reaction_buffer:
                continue

            for session_id, counts in list(self.reaction_buffer.items()):
                if counts:
                    event = {
                        "type": "REACTION_BATCH",
                        "counts": counts,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                    await self.publish_event(session_id, event)
            self.reaction_buffer.clear()

    # ─── Heartbeats & Automated Stale Socket Pruning (20s interval) ───────────
    async def _heartbeat_loop(self):
        """
        Periodically pings all active WebSocket connections every 20s.
        Automated pruning of stale/disconnected sockets to prevent leakages
        and socket exhaustion under 1,000 concurrent learners.
        """
        while True:
            await asyncio.sleep(20.0)
            if not self.active_rooms:
                continue

            now = asyncio.get_event_loop().time()
            stale_entries: List[tuple[str, str]] = []  # (session_id, connection_id)
            ping_payload = json.dumps({
                "type": "PING",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })

            # 1. Iterate over active rooms and send Ping
            for session_id, conns in list(self.active_rooms.items()):
                for conn_id, (ws, _) in list(conns.items()):
                    meta = self.connection_meta.get(conn_id, {})
                    last_seen = meta.get("last_seen", now)

                    # Prune connection if completely inactive for > 45s
                    if now - last_seen > 45.0:
                        logger.warning(
                            f"WS socket inactive for {now - last_seen:.1f}s, marking for pruning: {conn_id} in {session_id}"
                        )
                        stale_entries.append((session_id, conn_id))
                        continue

                    try:
                        await ws.send_text(ping_payload)
                    except Exception:
                        logger.info(f"Ping delivery failed for socket {conn_id}, marking stale")
                        stale_entries.append((session_id, conn_id))

            # 2. Prune and clean up stale connections
            for session_id, conn_id in stale_entries:
                try:
                    await self.disconnect(session_id, conn_id)
                except Exception as exc:
                    logger.warning(f"Error disconnecting stale socket {conn_id}: {exc}")

    def stop(self):
        """Cancels background batch and heartbeat loops."""
        if self.reaction_batch_task and not self.reaction_batch_task.done():
            self.reaction_batch_task.cancel()
        if self.heartbeat_task and not self.heartbeat_task.done():
            self.heartbeat_task.cancel()


ws_manager = ClassroomConnectionManager()
