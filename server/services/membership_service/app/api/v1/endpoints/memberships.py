import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.membership import Plan, Membership, MembershipStatus, BillingCycle
from app.dependencies.db import get_db
from learniox_common.schemas import APIResponse, PaginatedResponse, PaginationMeta

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreatePlanRequest(BaseModel):
    name: str
    description: str | None = None
    price: float
    currency: str = "INR"
    billing_cycle: BillingCycle
    features: dict | None = None
    max_courses: int | None = None
    trial_days: int = 0
    display_order: int = 0


class UpdatePlanRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    price: float | None = None
    features: dict | None = None
    max_courses: int | None = None
    trial_days: int | None = None
    is_active: bool | None = None
    display_order: int | None = None


class CreateMembershipRequest(BaseModel):
    user_id: uuid.UUID
    plan_id: uuid.UUID
    payment_id: uuid.UUID | None = None
    auto_renew: bool = True
    razorpay_subscription_id: str | None = None


class PlanResponse(BaseModel):
    id: uuid.UUID
    institution_id: uuid.UUID
    name: str
    description: str | None
    price: float
    currency: str
    billing_cycle: str
    features: dict | None
    max_courses: int | None
    is_active: bool
    trial_days: int
    display_order: int
    created_at: datetime


class MembershipResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    institution_id: uuid.UUID
    plan_id: uuid.UUID
    status: str
    starts_at: datetime
    expires_at: datetime | None
    auto_renew: bool
    created_at: datetime


def _plan_r(p) -> PlanResponse:
    return PlanResponse(
        id=p.id, institution_id=p.institution_id, name=p.name, description=p.description,
        price=float(p.price), currency=p.currency, billing_cycle=p.billing_cycle.value,
        features=p.features, max_courses=p.max_courses, is_active=p.is_active,
        trial_days=p.trial_days, display_order=p.display_order, created_at=p.created_at,
    )


def _mem_r(m) -> MembershipResponse:
    return MembershipResponse(
        id=m.id, user_id=m.user_id, institution_id=m.institution_id, plan_id=m.plan_id,
        status=m.status.value, starts_at=m.starts_at, expires_at=m.expires_at,
        auto_renew=m.auto_renew, created_at=m.created_at,
    )


def _compute_expires(billing_cycle: BillingCycle, trial_days: int) -> datetime:
    now = datetime.now(timezone.utc)
    if trial_days > 0:
        return now + timedelta(days=trial_days)
    cycle_days = {
        BillingCycle.MONTHLY: 30,
        BillingCycle.QUARTERLY: 90,
        BillingCycle.HALF_YEARLY: 180,
        BillingCycle.YEARLY: 365,
        BillingCycle.LIFETIME: None,
    }
    days = cycle_days.get(billing_cycle)
    return (now + timedelta(days=days)) if days else None


# ── Plans ─────────────────────────────────────────────────────────────────────

@router.post("/institutions/{institution_id}/plans", response_model=APIResponse[PlanResponse], status_code=201)
async def create_plan(institution_id: uuid.UUID, request: CreatePlanRequest, db: AsyncSession = Depends(get_db)):
    plan = Plan(
        institution_id=institution_id, name=request.name, description=request.description,
        price=Decimal(str(request.price)), currency=request.currency, billing_cycle=request.billing_cycle,
        features=request.features, max_courses=request.max_courses, trial_days=request.trial_days,
        display_order=request.display_order,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return APIResponse(success=True, message="Plan created", data=_plan_r(plan))


@router.get("/institutions/{institution_id}/plans", response_model=APIResponse[list[PlanResponse]])
async def list_institution_plans(institution_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Plan).where(and_(Plan.institution_id == institution_id, Plan.is_active == True))
        .order_by(Plan.display_order.asc(), Plan.price.asc())
    )
    return APIResponse(success=True, message="Plans retrieved", data=[_plan_r(p) for p in result.scalars().all()])


@router.get("/plans/{plan_id}", response_model=APIResponse[PlanResponse])
async def get_plan(plan_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Plan not found")
    return APIResponse(success=True, message="Plan retrieved", data=_plan_r(p))


@router.patch("/plans/{plan_id}", response_model=APIResponse[PlanResponse])
async def update_plan(plan_id: uuid.UUID, request: UpdatePlanRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Plan not found")
    for field, val in request.model_dump(exclude_none=True).items():
        if field == "price":
            p.price = Decimal(str(val))
        else:
            setattr(p, field, val)
    await db.commit()
    await db.refresh(p)
    return APIResponse(success=True, message="Plan updated", data=_plan_r(p))


@router.delete("/plans/{plan_id}", response_model=APIResponse[dict])
async def deactivate_plan(plan_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    p = result.scalar_one_or_none()
    if not p:
        raise HTTPException(status_code=404, detail="Plan not found")
    p.is_active = False
    await db.commit()
    return APIResponse(success=True, message="Plan deactivated", data={})


# ── Memberships ───────────────────────────────────────────────────────────────

@router.post("/institutions/{institution_id}/memberships", response_model=APIResponse[MembershipResponse], status_code=201)
async def create_membership(
    institution_id: uuid.UUID, request: CreateMembershipRequest, db: AsyncSession = Depends(get_db),
):
    plan_result = await db.execute(select(Plan).where(Plan.id == request.plan_id))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    expires = _compute_expires(plan.billing_cycle, plan.trial_days)
    membership = Membership(
        user_id=request.user_id, institution_id=institution_id, plan_id=request.plan_id,
        payment_id=request.payment_id, status=MembershipStatus.ACTIVE,
        starts_at=datetime.now(timezone.utc), expires_at=expires,
        auto_renew=request.auto_renew, razorpay_subscription_id=request.razorpay_subscription_id,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    return APIResponse(success=True, message="Membership created", data=_mem_r(membership))


@router.get("/users/{user_id}/memberships", response_model=APIResponse[list[MembershipResponse]])
async def list_user_memberships(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Membership).where(Membership.user_id == user_id).order_by(Membership.created_at.desc())
    )
    return APIResponse(success=True, message="Memberships retrieved", data=[_mem_r(m) for m in result.scalars().all()])


@router.get("/users/{user_id}/memberships/active", response_model=APIResponse[MembershipResponse | None])
async def get_active_membership(user_id: uuid.UUID, institution_id: uuid.UUID = Query(...), db: AsyncSession = Depends(get_db)):
    """Check if user has an active membership for a given institution."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Membership).where(and_(
            Membership.user_id == user_id, Membership.institution_id == institution_id,
            Membership.status == MembershipStatus.ACTIVE,
        ))
    )
    m = result.scalar_one_or_none()
    # Expire if past expiry date
    if m and m.expires_at and m.expires_at < now:
        m.status = MembershipStatus.EXPIRED
        await db.commit()
        m = None
    return APIResponse(success=True, message="Active membership", data=_mem_r(m) if m else None)


@router.get("/memberships/{membership_id}", response_model=APIResponse[MembershipResponse])
async def get_membership(membership_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Membership).where(Membership.id == membership_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Membership not found")
    return APIResponse(success=True, message="Membership retrieved", data=_mem_r(m))


@router.post("/memberships/{membership_id}/cancel", response_model=APIResponse[MembershipResponse])
async def cancel_membership(membership_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Membership).where(Membership.id == membership_id))
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Membership not found")
    m.status = MembershipStatus.CANCELLED
    m.cancelled_at = datetime.now(timezone.utc)
    m.auto_renew = False
    await db.commit()
    await db.refresh(m)
    return APIResponse(success=True, message="Membership cancelled", data=_mem_r(m))


@router.post("/memberships/{membership_id}/renew", response_model=APIResponse[MembershipResponse])
async def renew_membership(membership_id: uuid.UUID, payment_id: uuid.UUID | None = None, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Membership).join(Plan, Membership.plan_id == Plan.id).where(Membership.id == membership_id)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise HTTPException(status_code=404, detail="Membership not found")
    plan_result = await db.execute(select(Plan).where(Plan.id == m.plan_id))
    plan = plan_result.scalar_one()
    new_expiry = _compute_expires(plan.billing_cycle, 0)
    m.expires_at = new_expiry
    m.status = MembershipStatus.ACTIVE
    if payment_id:
        m.payment_id = payment_id
    await db.commit()
    await db.refresh(m)
    return APIResponse(success=True, message="Membership renewed", data=_mem_r(m))


@router.get("/institutions/{institution_id}/memberships", response_model=PaginatedResponse[MembershipResponse])
async def list_institution_memberships(
    institution_id: uuid.UUID,
    page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    total_res = await db.execute(
        select(func.count(Membership.id)).where(Membership.institution_id == institution_id)
    )
    total = total_res.scalar_one()
    result = await db.execute(
        select(Membership).where(Membership.institution_id == institution_id)
        .order_by(Membership.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    return PaginatedResponse(
        success=True, message="Institution memberships retrieved",
        data=[_mem_r(m) for m in result.scalars().all()],
        meta=PaginationMeta(page=page, limit=limit, total=total, total_pages=(total + limit - 1) // limit),
    )


# ── Health ────────────────────────────────────────────────────────────────────

@router.get("/health", response_model=APIResponse[dict])
async def health(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    await db.execute(text("SELECT 1"))
    return APIResponse(success=True, message="OK", data={"status": "healthy"})
