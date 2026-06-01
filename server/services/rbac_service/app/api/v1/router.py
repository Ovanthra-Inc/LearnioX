from fastapi import APIRouter

from app.api.v1.endpoints import checks, members, health

router = APIRouter()

router.include_router(health.router, prefix="/health", tags=["Health"])
router.include_router(checks.router, prefix="/rbac", tags=["Checks"])
router.include_router(members.router, prefix="/members", tags=["Members"])
