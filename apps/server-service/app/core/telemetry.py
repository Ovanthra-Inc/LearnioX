import os
import logging
from typing import Optional

logger = logging.getLogger("learniox.telemetry")


def setup_telemetry(app, service_name: str, engine=None):
    """
    Configures Azure Application Insights OpenTelemetry distribution
    and instruments FastAPI, HTTPX, SQLAlchemy, and Redis.
    """
    conn_str = os.getenv("APPLICATIONINSIGHTS_CONNECTION_STRING")
    if not conn_str:
        logger.info(f"[{service_name}] Azure App Insights disabled (no connection string).")
        return

    try:
        from azure.monitor.opentelemetry import configure_azure_monitor
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
        from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
        from opentelemetry.instrumentation.redis import RedisInstrumentor

        configure_azure_monitor(
            connection_string=conn_str,
            service_name=service_name,
        )

        FastAPIInstrumentor.instrument_app(app)
        HTTPXClientInstrumentor().instrument()

        if engine is not None:
            sync_engine = getattr(engine, "sync_engine", engine)
            SQLAlchemyInstrumentor().instrument(engine=sync_engine)
        else:
            try:
                SQLAlchemyInstrumentor().instrument()
            except Exception:
                pass

        try:
            RedisInstrumentor().instrument()
        except Exception:
            pass

        logger.info(f"[{service_name}] Azure App Insights telemetry active.")
    except Exception as exc:
        logger.warning(f"[{service_name}] Failed to initialize Azure App Insights telemetry: {exc}")
