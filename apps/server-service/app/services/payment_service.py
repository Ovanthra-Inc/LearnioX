from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictException,
    ForbiddenException,
    NotFoundException,
    ValidationException,
)
from app.models.course import CourseAccessType
from app.models.enrollment import EnrollmentAccessType
from app.models.payment import (
    BillingCycle,
    Coupon,
    DiscountType,
    MembershipPlan,
    PaymentStatus,
    SubscriptionStatus,
)
from app.repositories.course_repository import CourseRepository
from app.repositories.enrollment_repository import EnrollmentRepository
from app.repositories.payment_repository import PaymentRepository
from app.models.enrollment import EnrollmentStatus
from app.schemas.payment import (
    AssignCoursesRequest,
    CouponRequest,
    CouponResponse,
    CouponValidationResponse,
    CoursePurchaseResponse,
    CreateMembershipPlanRequest,
    MembershipPlanResponse,
    MembershipStatisticsResponse,
    PaymentRequest,
    PaymentResponse,
    PaymentStatisticsResponse,
    PurchaseCourseRequest,
    SubscribeRequest,
    SubscriptionResponse,
    UpdateMembershipPlanRequest,
    ValidateCouponRequest,
)
from app.services.payment_provider import MockPaymentProvider


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PaymentRepository(db)
        self.course_repo = CourseRepository(db)
        self.enrollment_repo = EnrollmentRepository(db)
        self.provider = MockPaymentProvider()

    async def _verify_institution_admin(
        self, institution_id: UUID, user_id: UUID, permission_code: str = "payment.manage"
    ) -> None:
        from app.repositories.institution_repository import InstitutionRepository
        from app.repositories.member_repository import MemberRepository
        from app.repositories.role_repository import RoleRepository
        from app.models.member import MemberStatus

        inst_repo = InstitutionRepository(self.db)
        inst = await inst_repo.get_by_id(institution_id)
        if not inst:
            raise NotFoundException(message="Institution not found", error_code="INSTITUTION_NOT_FOUND")
        if inst.owner_id == user_id:
            return

        member_repo = MemberRepository(self.db)
        member = await member_repo.get_member_by_user_and_inst(user_id, institution_id)
        if not member or member.status != MemberStatus.ACTIVE:
            raise ForbiddenException(message="Active membership required", error_code="FORBIDDEN")

        role_repo = RoleRepository(self.db)
        effective = await role_repo.get_member_effective_permissions(member.id, user_id, institution_id)
        if permission_code not in effective:
            raise ForbiddenException(
                message=f"Missing required permission: {permission_code}",
                error_code="PERMISSION_DENIED",
            )

    # Membership Plan Services
    async def create_membership_plan(
        self, institution_id: UUID, user_id: UUID, payload: CreateMembershipPlanRequest
    ) -> MembershipPlanResponse:
        await self._verify_institution_admin(institution_id, user_id, "membership.manage")
        bcycle = BillingCycle(payload.billing_cycle)
        plan = await self.repo.create_membership_plan(
            institution_id=institution_id,
            name=payload.name,
            description=payload.description,
            price=payload.price,
            billing_cycle=bcycle,
        )
        return await self._to_plan_response(plan)

    async def _to_plan_response(self, plan: MembershipPlan) -> MembershipPlanResponse:
        course_ids = await self.repo.get_plan_course_ids(plan.id)
        return MembershipPlanResponse(
            id=plan.id,
            institution_id=plan.institution_id,
            name=plan.name,
            description=plan.description,
            price=plan.price,
            billing_cycle=plan.billing_cycle.value if hasattr(plan.billing_cycle, "value") else str(plan.billing_cycle),
            is_active=plan.is_active,
            course_ids=course_ids,
            created_at=plan.created_at,
        )

    async def get_membership_plan(self, plan_id: UUID) -> MembershipPlanResponse:
        plan = await self.repo.get_membership_plan_by_id(plan_id)
        if not plan:
            raise NotFoundException(message="Plan not found", error_code="PLAN_NOT_FOUND")
        return await self._to_plan_response(plan)

    async def list_membership_plans(self, institution_id: UUID) -> List[MembershipPlanResponse]:
        plans = await self.repo.list_membership_plans(institution_id)
        return [await self._to_plan_response(p) for p in plans]

    async def update_membership_plan(
        self, plan_id: UUID, user_id: UUID, payload: UpdateMembershipPlanRequest
    ) -> MembershipPlanResponse:
        plan = await self.repo.get_membership_plan_by_id(plan_id)
        if not plan:
            raise NotFoundException(message="Plan not found", error_code="PLAN_NOT_FOUND")

        await self._verify_institution_admin(plan.institution_id, user_id, "membership.manage")

        update_dict = payload.model_dump(exclude_unset=True)
        if "billing_cycle" in update_dict and update_dict["billing_cycle"]:
            update_dict["billing_cycle"] = BillingCycle(update_dict["billing_cycle"])

        updated = await self.repo.update_membership_plan(plan, update_dict)
        return await self._to_plan_response(updated)

    async def delete_membership_plan(self, plan_id: UUID, user_id: UUID) -> None:
        plan = await self.repo.get_membership_plan_by_id(plan_id)
        if not plan:
            raise NotFoundException(message="Plan not found", error_code="PLAN_NOT_FOUND")

        await self._verify_institution_admin(plan.institution_id, user_id, "membership.manage")

        success = await self.repo.delete_membership_plan(plan_id)
        if not success:
            raise NotFoundException(message="Plan not found", error_code="PLAN_NOT_FOUND")

    async def assign_courses_to_plan(
        self, plan_id: UUID, user_id: UUID, payload: AssignCoursesRequest
    ) -> MembershipPlanResponse:
        plan = await self.repo.get_membership_plan_by_id(plan_id)
        if not plan:
            raise NotFoundException(message="Plan not found", error_code="PLAN_NOT_FOUND")

        await self._verify_institution_admin(plan.institution_id, user_id, "membership.manage")

        await self.repo.assign_courses_to_plan(plan_id, payload.course_ids)
        return await self._to_plan_response(plan)

    async def remove_course_from_plan(
        self, plan_id: UUID, course_id: UUID, user_id: UUID
    ) -> MembershipPlanResponse:
        plan = await self.repo.get_membership_plan_by_id(plan_id)
        if not plan:
            raise NotFoundException(message="Plan not found", error_code="PLAN_NOT_FOUND")

        await self._verify_institution_admin(plan.institution_id, user_id, "membership.manage")

        await self.repo.remove_course_from_plan(plan_id, course_id)
        return await self._to_plan_response(plan)

    # Coupon Services
    async def create_coupon(
        self, institution_id: UUID, user_id: UUID, payload: CouponRequest
    ) -> CouponResponse:
        await self._verify_institution_admin(institution_id, user_id, "payment.manage")
        dtype = DiscountType(payload.discount_type)
        coupon = await self.repo.create_coupon(
            institution_id=institution_id,
            code=payload.code,
            discount_type=dtype,
            discount_value=payload.discount_value,
            max_usage=payload.max_usage,
            expires_at=payload.expires_at,
        )
        return CouponResponse.model_validate(coupon)

    async def list_coupons(self, institution_id: Optional[UUID] = None) -> List[CouponResponse]:
        coupons = await self.repo.list_coupons(institution_id)
        return [CouponResponse.model_validate(c) for c in coupons]

    async def update_coupon(
        self, coupon_id: UUID, user_id: UUID, payload: CouponRequest
    ) -> CouponResponse:
        coupon = await self.repo.get_coupon_by_id(coupon_id)
        if not coupon:
            raise NotFoundException(message="Coupon not found", error_code="COUPON_NOT_FOUND")

        await self._verify_institution_admin(coupon.institution_id, user_id, "payment.manage")

        update_dict = payload.model_dump(exclude_unset=True)
        if "discount_type" in update_dict and update_dict["discount_type"]:
            update_dict["discount_type"] = DiscountType(update_dict["discount_type"])

        updated = await self.repo.update_coupon(coupon, update_dict)
        return CouponResponse.model_validate(updated)

    async def delete_coupon(self, coupon_id: UUID, user_id: UUID) -> None:
        coupon = await self.repo.get_coupon_by_id(coupon_id)
        if not coupon:
            raise NotFoundException(message="Coupon not found", error_code="COUPON_NOT_FOUND")

        await self._verify_institution_admin(coupon.institution_id, user_id, "payment.manage")

        success = await self.repo.delete_coupon(coupon_id)
        if not success:
            raise NotFoundException(message="Coupon not found", error_code="COUPON_NOT_FOUND")

    async def validate_coupon(self, payload: ValidateCouponRequest) -> CouponValidationResponse:
        coupon = await self.repo.get_coupon_by_code(payload.code)
        if not coupon or not coupon.is_active:
            return CouponValidationResponse(
                valid=False, discount=Decimal("0.00"), final_amount=Decimal("0.00"), code=payload.code, message="Invalid or inactive coupon"
            )

        now = datetime.now(timezone.utc)
        exp = coupon.expires_at
        if exp and exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)

        if exp and now > exp:
            return CouponValidationResponse(
                valid=False, discount=Decimal("0.00"), final_amount=Decimal("0.00"), code=payload.code, message="Coupon code has expired"
            )

        if coupon.max_usage > 0 and coupon.used_count >= coupon.max_usage:
            return CouponValidationResponse(
                valid=False, discount=Decimal("0.00"), final_amount=Decimal("0.00"), code=payload.code, message="Coupon usage limit reached"
            )

        base_price = Decimal("0.00")
        if payload.course_id:
            course = await self.course_repo.get_course_by_id(payload.course_id)
            if course:
                base_price = course.price
        elif payload.membership_plan_id:
            plan = await self.repo.get_membership_plan_by_id(payload.membership_plan_id)
            if plan:
                base_price = plan.price

        discount = Decimal("0.00")
        if coupon.discount_type == DiscountType.PERCENTAGE:
            discount = round(base_price * (coupon.discount_value / Decimal("100.0")), 2)
        else:
            discount = min(base_price, coupon.discount_value)

        final_amount = max(Decimal("0.00"), base_price - discount)
        return CouponValidationResponse(
            valid=True,
            discount=discount,
            final_amount=final_amount,
            code=coupon.code,
            discount_type=coupon.discount_type.value if hasattr(coupon.discount_type, "value") else str(coupon.discount_type),
            message="Coupon applied successfully",
        )

    # Subscription Checkout Services
    async def subscribe_plan(
        self, plan_id: UUID, user_id: UUID, payload: SubscribeRequest
    ) -> SubscriptionResponse:
        plan = await self.repo.get_membership_plan_by_id(plan_id)
        if not plan or not plan.is_active:
            raise NotFoundException(message="Membership plan not found", error_code="PLAN_NOT_FOUND")

        final_price = plan.price
        if payload.coupon_code:
            val_res = await self.validate_coupon(
                ValidateCouponRequest(code=payload.coupon_code, membership_plan_id=plan_id)
            )
            if val_res.valid:
                final_price = val_res.final_amount
                coupon = await self.repo.get_coupon_by_code(payload.coupon_code)
                if coupon:
                    # HIGH-07: Atomic increment — raises if limit hit by concurrent request
                    incremented = await self.repo.increment_coupon_usage(coupon.id)
                    if not incremented:
                        raise ConflictException(
                            message="Coupon usage limit reached (concurrent request)",
                            error_code="COUPON_LIMIT_REACHED",
                        )

        # CRIT-01: Create payment PENDING, then confirm via mock provider
        if final_price > Decimal("0.00"):
            payment_rec = await self.repo.create_payment(
                amount=final_price, provider="MOCK",
                status=PaymentStatus.PENDING,
            )
            # For the mock provider, immediately confirm. Real providers would
            # update status via webhook (CRIT-05) after payment gateway confirms.
            session = await self.provider.create_payment_session(
                amount=final_price, currency="INR"
            )
            if session.get("status") == "SUCCESS":
                await self.repo.confirm_payment(payment_rec.id)

        expires_at = None
        now = datetime.now(timezone.utc)
        if plan.billing_cycle == BillingCycle.MONTHLY:
            expires_at = now + timedelta(days=30)
        elif plan.billing_cycle == BillingCycle.YEARLY:
            expires_at = now + timedelta(days=365)

        subscription = await self.repo.create_subscription(
            user_id=user_id, plan_id=plan_id, expires_at=expires_at
        )

        # Auto-enroll user in all mapped courses
        course_ids = await self.repo.get_plan_course_ids(plan_id)
        for c_id in course_ids:
            c = await self.course_repo.get_course_by_id(c_id)
            if c:
                enr = await self.enrollment_repo.find_enrollment(user_id, c_id)
                if not enr:
                    await self.enrollment_repo.create_enrollment(
                        user_id=user_id,
                        course_id=c_id,
                        institution_id=c.institution_id,
                        access_type=EnrollmentAccessType.MEMBERSHIP,
                    )

        return SubscriptionResponse(
            subscription_id=subscription.id,
            user_id=subscription.user_id,
            plan_id=subscription.plan_id,
            status=subscription.status.value if hasattr(subscription.status, "value") else str(subscription.status),
            started_at=subscription.started_at,
            expires_at=subscription.expires_at,
            cancelled_at=subscription.cancelled_at,
        )

    async def cancel_subscription(self, subscription_id: UUID, user_id: UUID) -> None:
        success = await self.repo.cancel_subscription(subscription_id, user_id)
        if not success:
            raise NotFoundException(
                message="Active subscription not found", error_code="SUBSCRIPTION_NOT_FOUND"
            )

        # HIGH-08: Revoke all enrollments that were created via this membership subscription
        sub = await self.repo.get_subscription_by_id(subscription_id)
        if sub:
            course_ids = await self.repo.get_plan_course_ids(sub.plan_id)
            for c_id in course_ids:
                enr = await self.enrollment_repo.find_enrollment(user_id, c_id)
                if enr and str(getattr(enr, 'access_type', '')) == 'MEMBERSHIP':
                    enr.status = EnrollmentStatus.CANCELLED
                    await self.db.flush()

    async def list_user_subscriptions(self, user_id: UUID) -> List[SubscriptionResponse]:
        subs = await self.repo.list_user_subscriptions(user_id)
        return [
            SubscriptionResponse(
                subscription_id=s.id,
                user_id=s.user_id,
                plan_id=s.plan_id,
                status=s.status.value if hasattr(s.status, "value") else str(s.status),
                started_at=s.started_at,
                expires_at=s.expires_at,
                cancelled_at=s.cancelled_at,
            )
            for s in subs
        ]

    # One-Time Course Purchase Checkout Services
    async def purchase_course(
        self, course_id: UUID, user_id: UUID, payload: PurchaseCourseRequest
    ) -> CoursePurchaseResponse:
        course = await self.course_repo.get_course_by_id(course_id)
        if not course:
            raise NotFoundException(message="Course not found", error_code="COURSE_NOT_FOUND")

        existing_purchase = await self.repo.find_course_purchase(user_id, course_id)
        if existing_purchase:
            raise ConflictException(
                message="User has already purchased this course", error_code="ALREADY_PURCHASED"
            )

        final_price = course.price
        if payload.coupon_code:
            val_res = await self.validate_coupon(
                ValidateCouponRequest(code=payload.coupon_code, course_id=course_id)
            )
            if val_res.valid:
                final_price = val_res.final_amount
                coupon = await self.repo.get_coupon_by_code(payload.coupon_code)
                if coupon:
                    # HIGH-07: Atomic increment — raises if limit already hit
                    incremented = await self.repo.increment_coupon_usage(coupon.id)
                    if not incremented:
                        raise ConflictException(
                            message="Coupon usage limit reached (concurrent request)",
                            error_code="COUPON_LIMIT_REACHED",
                        )

        payment_rec = None
        if final_price > Decimal("0.00"):
            # CRIT-01: Start PENDING, confirm immediately for mock provider
            payment_rec = await self.repo.create_payment(
                amount=final_price, provider="MOCK",
                status=PaymentStatus.PENDING,
            )
            session = await self.provider.create_payment_session(
                amount=final_price, currency=course.currency
            )
            if session.get("status") == "SUCCESS":
                await self.repo.confirm_payment(payment_rec.id)

        purchase = await self.repo.create_course_purchase(
            user_id=user_id,
            course_id=course_id,
            payment_id=payment_rec.id if payment_rec else None,
            amount=final_price,
            currency=course.currency,
        )

        # Auto-enroll in course
        enr = await self.enrollment_repo.find_enrollment(user_id, course_id)
        if not enr:
            await self.enrollment_repo.create_enrollment(
                user_id=user_id,
                course_id=course_id,
                institution_id=course.institution_id,
                access_type=EnrollmentAccessType.PURCHASED,
            )

        return CoursePurchaseResponse(
            purchase_id=purchase.id,
            user_id=purchase.user_id,
            course_id=purchase.course_id,
            payment_id=purchase.payment_id,
            amount=purchase.amount,
            currency=purchase.currency,
            status=purchase.status.value if hasattr(purchase.status, "value") else str(purchase.status),
            created_at=purchase.created_at,
        )

    async def list_user_purchases(self, user_id: UUID) -> List[CoursePurchaseResponse]:
        purchases = await self.repo.list_user_purchases(user_id)
        return [
            CoursePurchaseResponse(
                purchase_id=p.id,
                user_id=p.user_id,
                course_id=p.course_id,
                payment_id=p.payment_id,
                amount=p.amount,
                currency=p.currency,
                status=p.status.value if hasattr(p.status, "value") else str(p.status),
                created_at=p.created_at,
            )
            for p in purchases
        ]

    # Payment & Statistics
    async def create_payment_session(self, payload: PaymentRequest) -> PaymentResponse:
        payment = await self.repo.create_payment(
            amount=payload.amount,
            currency=payload.currency,
            provider=payload.provider,
            payment_method=payload.payment_method,
        )
        return PaymentResponse.model_validate(payment)

    async def get_membership_statistics(self) -> MembershipStatisticsResponse:
        stats = await self.repo.get_membership_statistics()
        return MembershipStatisticsResponse(**stats)

    async def get_payment_statistics(self) -> PaymentStatisticsResponse:
        stats = await self.repo.get_payment_statistics()
        return PaymentStatisticsResponse(**stats)
