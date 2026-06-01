from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from learniox_common.db import Base, UUIDPrimaryKeyMixin, TimestampMixin


class Permission(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "permissions"

    code: Mapped[str] = mapped_column(String(120), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    module: Mapped[str] = mapped_column(String(80), nullable=False)
