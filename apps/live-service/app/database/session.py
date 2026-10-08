from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool
from app.core.config import settings

db_url = settings.DATABASE_URL
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine_kwargs: dict = {
    "echo": False,
    "future": True,
}

if "sqlite" in db_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
    engine_kwargs["poolclass"] = StaticPool
else:
    engine_kwargs["pool_size"] = getattr(settings, "DB_POOL_SIZE", 25)
    engine_kwargs["max_overflow"] = getattr(settings, "DB_MAX_OVERFLOW", 15)
    engine_kwargs["pool_recycle"] = getattr(settings, "DB_POOL_RECYCLE", 1800)
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["connect_args"] = {
        "server_settings": {
            "statement_timeout": "15000",  # 15s query timeout to prevent pool starvation
        }
    }

engine = create_async_engine(db_url, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
