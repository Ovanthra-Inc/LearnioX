'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';

export type SocketStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

interface UseClassroomSocketProps {
  sessionId: string;
  ticket?: string;
  onUserJoined?: (user: any) => void;
  onUserLeft?: (user: any) => void;
  onChatMessage?: (message: any) => void;
  onReactionBatch?: (counts: Record<string, number>) => void;
  onHandRaiseUpdate?: (data: { userId: string; displayName: string; raised: boolean }) => void;
  onPollLaunched?: (poll: any) => void;
  onPollClosed?: (data: any) => void;
  onPollVoteCast?: (data: any) => void;
  onQnANew?: (question: any) => void;
  onQnAUpvoted?: (data: any) => void;
  onQnAAnswered?: (data: any) => void;
  onWhiteboardSync?: (data: any) => void;
  onWhiteboardStroke?: (stroke: any) => void;
  onAdmissionUpdate?: (data: { userId: string; action: 'ADMIT' | 'DENY' }) => void;
  onSessionEnded?: () => void;
}

export function useClassroomSocket({
  sessionId,
  ticket,
  onUserJoined,
  onUserLeft,
  onChatMessage,
  onReactionBatch,
  onHandRaiseUpdate,
  onPollLaunched,
  onPollClosed,
  onPollVoteCast,
  onQnANew,
  onQnAUpvoted,
  onQnAAnswered,
  onWhiteboardSync,
  onWhiteboardStroke,
  onAdmissionUpdate,
  onSessionEnded,
}: UseClassroomSocketProps) {
  const [status, setStatus] = useState<SocketStatus>('DISCONNECTED');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const connect = useCallback(() => {
    if (!sessionId || typeof window === 'undefined') return;

    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    setStatus(retryCountRef.current > 0 ? 'RECONNECTING' : 'CONNECTING');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.port === '3000' ? `${window.location.hostname}:80` : window.location.host;
    const ticketParam = ticket ? `?ticket=${encodeURIComponent(ticket)}` : '';
    const wsUrl = `${protocol}//${host}/api/v1/live/ws/${sessionId}${ticketParam}`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('CONNECTED');
      retryCountRef.current = 0;

      // Start ping heartbeat (20s)
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 20000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const type = msg.type;

        if (type === 'PONG') return;

        switch (type) {
          case 'USER_JOINED':
            onUserJoined?.(msg);
            break;
          case 'USER_LEFT':
            onUserLeft?.(msg);
            break;
          case 'CHAT_MESSAGE':
            onChatMessage?.(msg.message);
            break;
          case 'REACTION_BATCH':
            onReactionBatch?.(msg.counts);
            break;
          case 'HAND_RAISE_UPDATE':
            onHandRaiseUpdate?.({
              userId: msg.user_id,
              displayName: msg.display_name,
              raised: msg.raised,
            });
            break;
          case 'POLL_LAUNCHED':
            onPollLaunched?.(msg.poll);
            toast.info(`New Poll Launched: ${msg.poll.question}`);
            break;
          case 'POLL_CLOSED':
            onPollClosed?.(msg);
            break;
          case 'POLL_VOTE_CAST':
            onPollVoteCast?.(msg);
            break;
          case 'QNA_NEW':
            onQnANew?.(msg.question);
            break;
          case 'QNA_UPVOTED':
            onQnAUpvoted?.(msg);
            break;
          case 'QNA_ANSWERED':
            onQnAAnswered?.(msg);
            break;
          case 'WHITEBOARD_SYNC':
            onWhiteboardSync?.(msg);
            break;
          case 'WHITEBOARD_STROKE':
            onWhiteboardStroke?.(msg.stroke);
            break;
          case 'ADMISSION_UPDATE':
            onAdmissionUpdate?.(msg);
            break;
          case 'SESSION_ENDED':
            onSessionEnded?.();
            toast.warning('The live class has been ended by the host.');
            break;
          default:
            break;
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = (event) => {
      setStatus('DISCONNECTED');
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

      if (event.code === 4003) {
        toast.error('Session authentication expired. Please re-enter the classroom.');
        return;
      }

      // Reconnect with exponential backoff (max 5 attempts, capped at 10s)
      if (retryCountRef.current < 5) {
        const delay = Math.min(1000 * Math.pow(1.5, retryCountRef.current), 10000);
        retryCountRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, delay);
      }
    };

    ws.onerror = () => {
      // ws.onclose handles retry
    };
  }, [
    sessionId,
    ticket,
    onUserJoined,
    onUserLeft,
    onChatMessage,
    onReactionBatch,
    onHandRaiseUpdate,
    onPollLaunched,
    onPollClosed,
    onPollVoteCast,
    onQnANew,
    onQnAUpvoted,
    onQnAAnswered,
    onWhiteboardSync,
    onWhiteboardStroke,
    onAdmissionUpdate,
    onSessionEnded,
  ]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendReaction = useCallback((reaction: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'REACTION', reaction }));
    }
  }, []);

  const toggleHandRaise = useCallback((raised: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'HAND_RAISE', raised }));
    }
  }, []);

  const sendWhiteboardStroke = useCallback((stroke: any, page: number = 1) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'WHITEBOARD_STROKE', stroke, page }));
    }
  }, []);

  return {
    status,
    sendReaction,
    toggleHandRaise,
    sendWhiteboardStroke,
  };
}
