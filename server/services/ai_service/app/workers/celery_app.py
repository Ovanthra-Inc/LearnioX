"""
Celery worker — processes AI jobs from the queue.

Run with:
  celery -A app.workers.celery_app worker --loglevel=info -Q ai_jobs

The worker picks up QUEUED jobs, executes them against OpenRouter,
and writes COMPLETED / FAILED status + output back to the DB.
"""
import asyncio
import logging
import uuid
from celery import Celery
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select

from app.core.config import get_settings
from app.models.ai_job import AIJob, AIJobStatus, AIJobType
from app.services.job_executor import execute_job

settings = get_settings()
logger = logging.getLogger(__name__)

# ── Celery App ────────────────────────────────────────────────────────────────

celery_app = Celery(
    "ai_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={"app.workers.celery_app.run_ai_job": {"queue": "ai_jobs"}},
)


# ── DB helpers (sync wrapper for async SQLAlchemy in Celery sync task) ────────

def _make_engine():
    return create_async_engine(settings.DATABASE_URL)


async def _fetch_job(engine, job_id: str) -> AIJob | None:
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as session:
        result = await session.execute(
            select(AIJob).where(AIJob.id == uuid.UUID(job_id))
        )
        return result.scalar_one_or_none()


async def _update_job(engine, job_id: str, status: AIJobStatus, output: dict | None = None, error: str | None = None):
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    async with async_session() as session:
        result = await session.execute(
            select(AIJob).where(AIJob.id == uuid.UUID(job_id))
        )
        job = result.scalar_one_or_none()
        if job:
            job.status = status
            if output is not None:
                job.output_payload = output
            if error:
                job.error_message = error
            await session.commit()


# ── Celery Task ───────────────────────────────────────────────────────────────

@celery_app.task(bind=True, max_retries=2, default_retry_delay=30)
def run_ai_job(self, job_id: str):
    """Celery task: fetch job from DB, run LLM, update result."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    engine = _make_engine()

    try:
        job = loop.run_until_complete(_fetch_job(engine, job_id))
        if not job:
            logger.error(f"AI job {job_id} not found in DB")
            return

        if job.status != AIJobStatus.QUEUED:
            logger.warning(f"AI job {job_id} already in state {job.status}, skipping")
            return

        # Mark running
        loop.run_until_complete(_update_job(engine, job_id, AIJobStatus.RUNNING))

        # Execute
        output = loop.run_until_complete(
            execute_job(job.job_type, job.input_payload, model=job.model_name)
        )

        # Mark completed
        loop.run_until_complete(_update_job(engine, job_id, AIJobStatus.COMPLETED, output=output))
        logger.info(f"AI job {job_id} completed successfully")

    except Exception as exc:
        logger.error(f"AI job {job_id} failed: {exc}")
        loop.run_until_complete(
            _update_job(engine, job_id, AIJobStatus.FAILED, error=str(exc))
        )
        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error(f"AI job {job_id} exhausted retries")
    finally:
        loop.run_until_complete(engine.dispose())
        loop.close()
