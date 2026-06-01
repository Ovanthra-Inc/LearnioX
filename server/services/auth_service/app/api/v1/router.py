from fastapi import APIRouter

from app.api.v1.endpoints import auth, health, tokens

router = APIRouter()

router.include_router(health.router, prefix="/health", tags=["Health"])
router.include_router(auth.router, prefix="/auth", tags=["Auth"])
router.include_router(tokens.router, prefix="/token", tags=["Token"])
