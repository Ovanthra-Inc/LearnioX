from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


# Membership Plan Schemas
class CreateMembershipPlanRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = None
    price: Decimal = Field(..., ge=0)
    billing_cycle: str = Field("MONTHLY", pattern="^(MONTHLY|YEARLY|LIFETIME)$")


class UpdateMembershipPlanRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0)
    billing_cycle: Optional[str] = Field(None, pattern="^(MONTHLY|YEARLY|LIFETIME)$")
    is_active: Optional[bool] = None


class AssignCoursesRequest(BaseModel):
    course_ids: List[UUID] = Field(..., min_length=1)


class MembershipPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    institution_id: UUID
    name: str
    description: Optional[str] = None
    price: Decimal
    billing_cycle: str
    is_active: bool
    course_ids: List[UUID] = Field(default_factory=list)
    created_at: datetime


# Subscription Schemas
class SubscribeRequest(BaseModel):
    coupon_code: Optional[str] = None


class SubscriptionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    subscription_id: UUID
    user_id: UUID
    plan_id: UUID
    status: str
    started_at: datetime
    expires_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None


# Purchase & Payment Schemas
class PurchaseCourseRequest(BaseModel):
    coupon_code: Optional[str] = None


class CoursePurchaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    purchase_id: UUID
    user_id: UUID
    course_id: UUID
    payment_id: Optional[UUID] = None
    amount: Decimal
    currency: str
    status: str
    created_at: datetime


class PaymentRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    currency: str = Field("INR", max_length=10)
    provider: str = Field("MOCK", max_length=50)
    payment_method: str = Field("CARD", max_length=50)


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    provider: str
    provider_payment_id: str
    amount: Decimal
    currency: str
    status: str
    payment_method: str
    created_at: datetime


# Coupon Schemas
class CouponRequest(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    discount_type: str = Field("PERCENTAGE", pattern="^(PERCENTAGE|FIXED)$")
    discount_value: Decimal = Field(..., gt=0)
    max_usage: int = Field(0, ge=0)
    expires_at: Optional[datetime] = None


class ValidateCouponRequest(BaseModel):
    code: str = Field(..., min_length=3, max_length=50)
    course_id: Optional[UUID] = None
    membership_plan_id: Optional[UUID] = None


class CouponValidationResponse(BaseModel):
    valid: bool
    discount: Decimal
    final_amount: Decimal
    code: str
    discount_type: Optional[str] = None
    message: Optional[str] = None


class CouponResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    institution_id: UUID
    code: str
    discount_type: str
    discount_value: Decimal
    max_usage: int
    used_count: int
    expires_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime


# Access Engine Schemas
class CourseAccessResponse(BaseModel):
    allowed: bool
    reason: str
    access_type: str


class LessonAccessResponse(BaseModel):
    allowed: bool
    reason: str


class UserAccessSummaryResponse(BaseModel):
    subscriptions: List[SubscriptionResponse] = Field(default_factory=list)
    purchases: List[CoursePurchaseResponse] = Field(default_factory=list)


# Statistics Schemas
class MembershipStatisticsResponse(BaseModel):
    active_subscriptions: int
    expired_subscriptions: int
    monthly_revenue: Decimal
    yearly_revenue: Decimal


class PaymentStatisticsResponse(BaseModel):
    successful: int
    failed: int
    refunded: int
    revenue: Decimal
