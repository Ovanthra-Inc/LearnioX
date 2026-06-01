import uuid
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, update
from app.dependencies.db import get_db
from app.models.review import Review, ReviewStatus, ReviewHelpfulVote
from app.schemas.schemas import CreateReviewRequest, UpdateReviewRequest, ReviewResponse, RatingSummaryResponse
from learniox_common.schemas import APIResponse, PaginatedResponse, PaginationMeta

router = APIRouter()


# ── Auth helper ───────────────────────────────────────────────────────────────

def get_current_user_id(x_user_id: str = Header(None, alias="x-user-id")) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="x-user-id header missing")
    return uuid.UUID(x_user_id)


# ── Serialiser ────────────────────────────────────────────────────────────────

def _rr(r) -> ReviewResponse:
    return ReviewResponse(
        id=r.id, user_id=r.user_id, course_id=r.course_id, institution_id=r.institution_id,
        rating=r.rating, title=r.title, body=r.body, status=r.status.value, created_at=r.created_at,
    )


# ── Course Reviews ────────────────────────────────────────────────────────────

@router.post("/reviews/courses/{course_id}", response_model=APIResponse[ReviewResponse], status_code=201)
async def create_course_review(
    course_id: uuid.UUID, request: CreateReviewRequest,
    user_id: uuid.UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db),
):
    review = Review(
        user_id=user_id, course_id=course_id,
        institution_id=request.institution_id,
        rating=request.rating, title=request.title, body=request.body,
        status=ReviewStatus.PENDING,   # Reviews require moderation
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return APIResponse(success=True, message="Review submitted and pending moderation", data=_rr(review))


@router.get("/reviews/courses/{course_id}", response_model=PaginatedResponse[ReviewResponse])
async def list_course_reviews(
    course_id: uuid.UUID, page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    total_result = await db.execute(
        select(func.count(Review.id)).where(and_(Review.course_id == course_id, Review.status == ReviewStatus.PUBLISHED))
    )
    total = total_result.scalar_one()
    result = await db.execute(
        select(Review).where(and_(Review.course_id == course_id, Review.status == ReviewStatus.PUBLISHED))
        .order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    reviews = result.scalars().all()
    return PaginatedResponse(
        success=True, message="Course reviews retrieved",
        data=[_rr(r) for r in reviews],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=(total + limit - 1) // limit),
    )


@router.get("/reviews/courses/{course_id}/summary", response_model=APIResponse[RatingSummaryResponse])
async def course_rating_summary(course_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(and_(Review.course_id == course_id, Review.status == ReviewStatus.PUBLISHED))
    )
    avg_rating, total = result.one()

    # Distribution per star
    dist: dict[str, int] = {}
    for star in range(1, 6):
        r = await db.execute(
            select(func.count(Review.id)).where(
                and_(Review.course_id == course_id, Review.status == ReviewStatus.PUBLISHED, Review.rating == star)
            )
        )
        dist[str(star)] = r.scalar_one()

    return APIResponse(
        success=True, message="Rating summary",
        data=RatingSummaryResponse(
            average_rating=round(float(avg_rating or 0), 2),
            total_reviews=total or 0,
            distribution=dist,
        ),
    )


# ── Institution Reviews ───────────────────────────────────────────────────────

@router.post("/reviews/institutions/{institution_id}", response_model=APIResponse[ReviewResponse], status_code=201)
async def create_institution_review(
    institution_id: uuid.UUID, request: CreateReviewRequest,
    user_id: uuid.UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db),
):
    review = Review(
        user_id=user_id, institution_id=institution_id, course_id=None,
        rating=request.rating, title=request.title, body=request.body,
        status=ReviewStatus.PENDING,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return APIResponse(success=True, message="Institution review submitted", data=_rr(review))


@router.get("/reviews/institutions/{institution_id}", response_model=PaginatedResponse[ReviewResponse])
async def list_institution_reviews(
    institution_id: uuid.UUID, page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    total_result = await db.execute(
        select(func.count(Review.id)).where(
            and_(Review.institution_id == institution_id, Review.course_id.is_(None), Review.status == ReviewStatus.PUBLISHED)
        )
    )
    total = total_result.scalar_one()
    result = await db.execute(
        select(Review).where(
            and_(Review.institution_id == institution_id, Review.course_id.is_(None), Review.status == ReviewStatus.PUBLISHED)
        ).order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    return PaginatedResponse(
        success=True, message="Institution reviews retrieved",
        data=[_rr(r) for r in result.scalars().all()],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=(total + limit - 1) // limit),
    )


@router.get("/reviews/institutions/{institution_id}/summary", response_model=APIResponse[RatingSummaryResponse])
async def institution_rating_summary(institution_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(func.avg(Review.rating), func.count(Review.id))
        .where(and_(Review.institution_id == institution_id, Review.course_id.is_(None), Review.status == ReviewStatus.PUBLISHED))
    )
    avg_rating, total = result.one()
    return APIResponse(
        success=True, message="Institution rating summary",
        data=RatingSummaryResponse(
            average_rating=round(float(avg_rating or 0), 2),
            total_reviews=total or 0,
            distribution={str(i): 0 for i in range(1, 6)},
        ),
    )


# ── Review CRUD ───────────────────────────────────────────────────────────────

@router.get("/reviews/{review_id}", response_model=APIResponse[ReviewResponse])
async def get_review(review_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return APIResponse(success=True, message="Review retrieved", data=_rr(review))


@router.patch("/reviews/{review_id}", response_model=APIResponse[ReviewResponse])
async def update_review(
    review_id: uuid.UUID, request: UpdateReviewRequest,
    user_id: uuid.UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if request.rating is not None:
        review.rating = request.rating
    if request.title is not None:
        review.title = request.title
    if request.body is not None:
        review.body = request.body
    # Re-queue for moderation on edit
    review.status = ReviewStatus.PENDING
    await db.commit()
    await db.refresh(review)
    return APIResponse(success=True, message="Review updated", data=_rr(review))


@router.delete("/reviews/{review_id}", response_model=APIResponse[dict])
async def delete_review(
    review_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    await db.delete(review)
    await db.commit()
    return APIResponse(success=True, message="Review deleted", data={})


# ── Social — Report & Helpful ─────────────────────────────────────────────────

@router.post("/reviews/{review_id}/report", response_model=APIResponse[dict])
async def report_review(
    review_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Review).where(Review.id == review_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Review not found")
    # Lightweight: flag for moderation queue
    await db.execute(
        update(Review).where(Review.id == review_id).values(status=ReviewStatus.PENDING)
    )
    await db.commit()
    return APIResponse(success=True, message="Review reported and queued for moderation", data={})


@router.post("/reviews/{review_id}/helpful", response_model=APIResponse[dict])
async def mark_helpful(
    review_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(ReviewHelpfulVote).where(
            and_(ReviewHelpfulVote.review_id == review_id, ReviewHelpfulVote.user_id == user_id)
        )
    )
    if existing.scalar_one_or_none():
        return APIResponse(success=True, message="Already marked as helpful", data={})
    vote = ReviewHelpfulVote(review_id=review_id, user_id=user_id)
    db.add(vote)
    await db.commit()
    return APIResponse(success=True, message="Marked as helpful", data={})


# ── Admin Moderation ──────────────────────────────────────────────────────────

@router.get("/admin/reviews/moderation", response_model=PaginatedResponse[ReviewResponse])
async def list_moderation_queue(
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    total_result = await db.execute(
        select(func.count(Review.id)).where(Review.status == ReviewStatus.PENDING)
    )
    total = total_result.scalar_one()
    result = await db.execute(
        select(Review).where(Review.status == ReviewStatus.PENDING)
        .order_by(Review.created_at.asc()).offset((page - 1) * limit).limit(limit)
    )
    return PaginatedResponse(
        success=True, message="Moderation queue retrieved",
        data=[_rr(r) for r in result.scalars().all()],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=(total + limit - 1) // limit),
    )


@router.post("/admin/reviews/{review_id}/approve", response_model=APIResponse[ReviewResponse])
async def approve_review(review_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.status = ReviewStatus.PUBLISHED
    await db.commit()
    await db.refresh(review)
    return APIResponse(success=True, message="Review approved", data=_rr(review))


@router.post("/admin/reviews/{review_id}/reject", response_model=APIResponse[ReviewResponse])
async def reject_review(review_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Review).where(Review.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    review.status = ReviewStatus.REJECTED
    await db.commit()
    await db.refresh(review)
    return APIResponse(success=True, message="Review rejected", data=_rr(review))


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy"})
