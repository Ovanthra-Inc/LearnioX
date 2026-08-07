from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class SessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    device_name: Optional[str] = "Unknown Device"
    ip: Optional[str] = "Unknown IP"
    user_agent: Optional[str] = "Unknown Agent"
    created_at: datetime
    expires_at: datetime
    current: bool = False
