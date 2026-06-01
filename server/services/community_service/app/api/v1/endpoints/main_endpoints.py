import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.db import get_db
from app.models.community import CommunitySpace, CommunityPost, CommunityComment
from learniox_common.schemas import APIResponse

router = APIRouter()


def get_uid(x_user_id: str = Header(None, alias="x-user-id")) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="x-user-id header missing")
    return uuid.UUID(x_user_id)


class CreateSpaceRequest(BaseModel):
    institution_id: UUID | None = None
    course_id: UUID | None = None
    name: str
    description: str | None = None
    visibility: str = "public"


class CreatePostRequest(BaseModel):
    title: str | None = None
    body: str
    post_type: str = "discussion"


class CreateCommentRequest(BaseModel):
    body: str


class SpaceResponse(BaseModel):
    id: UUID; name: str; description: str | None; visibility: str; created_at: datetime


class PostResponse(BaseModel):
    id: UUID; space_id: UUID; user_id: UUID; title: str | None; body: str; post_type: str; created_at: datetime


class CommentResponse(BaseModel):
    id: UUID; post_id: UUID; user_id: UUID; body: str; created_at: datetime


@router.post("/community/spaces", response_model=APIResponse[SpaceResponse])
async def create_space(request: CreateSpaceRequest, db: AsyncSession = Depends(get_db)):
    s = CommunitySpace(**request.model_dump())
    db.add(s)
    await db.commit()
    await db.refresh(s)
    return APIResponse(success=True, message="Space created", data=SpaceResponse(
        id=s.id, name=s.name, description=s.description, visibility=s.visibility, created_at=s.created_at))


@router.post("/community/spaces/{space_id}/posts", response_model=APIResponse[PostResponse])
async def create_post(space_id: uuid.UUID, request: CreatePostRequest,
                      user_id: uuid.UUID = Depends(get_uid), db: AsyncSession = Depends(get_db)):
    p = CommunityPost(space_id=space_id, user_id=user_id, **request.model_dump())
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return APIResponse(success=True, message="Post created", data=PostResponse(
        id=p.id, space_id=p.space_id, user_id=p.user_id, title=p.title, body=p.body, post_type=p.post_type, created_at=p.created_at))


@router.get("/community/spaces/{space_id}/posts", response_model=APIResponse[list[PostResponse]])
async def list_posts(space_id: uuid.UUID, page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
                     db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CommunityPost).where(CommunityPost.space_id == space_id)
        .order_by(CommunityPost.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    return APIResponse(success=True, message="Posts retrieved", data=[
        PostResponse(id=p.id, space_id=p.space_id, user_id=p.user_id, title=p.title,
                     body=p.body, post_type=p.post_type, created_at=p.created_at)
        for p in result.scalars().all()
    ])


@router.post("/community/posts/{post_id}/comments", response_model=APIResponse[CommentResponse])
async def create_comment(post_id: uuid.UUID, request: CreateCommentRequest,
                         user_id: uuid.UUID = Depends(get_uid), db: AsyncSession = Depends(get_db)):
    c = CommunityComment(post_id=post_id, user_id=user_id, body=request.body)
    db.add(c)
    await db.commit()
    await db.refresh(c)
    return APIResponse(success=True, message="Comment added", data=CommentResponse(
        id=c.id, post_id=c.post_id, user_id=c.user_id, body=c.body, created_at=c.created_at))


@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy"})
