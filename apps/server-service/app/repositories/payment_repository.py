from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple
import uuid
from uuid import UUID
from sqlalchemy import func, select, and_, delete, update, insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, CourseAccessType
from app.models.curriculum import Lesson, LessonVisibility
from app.models.member import InstitutionMember, MemberStatus
from app.models.payment import (
    BillingCycle,
    Coupon,
    CoursePurchase,
    DiscountType,
    MembershipPlan,
    Payment,
    PaymentStatus,
    Subscription,
    SubscriptionStatus,
    membership_plan_courses,
)


class PaymentRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Membership Plan Operations
    async def create_membership_plan(
        self,
        institution_id: UUID,
        name: str,
        description: Optional[str] = None,
        price: Decimal = Decimal("0.00"),
        billing_cycle: BillingCycle = BillingCycle.MONTHLY,
    ) -> MembershipPlan:
        plan = MembershipPlan(
            institution_id=institution_id,
            name=name.strip(),
            description=description,
            price=price,
            billing_cycle=billing_cycle,
            is_active=True,
        )
        self.db.add(plan)
        await self.db.flush()
        await self.db.refresh(plan)
        return plan

    async def get_membership_plan_by_id(self, plan_id: UUID) -> Optional[MembershipPlan]:
        res = await self.db.execute(
            select(MembershipPlan).where(MembershipPlan.id == plan_id)
        )
        return res.scalars().first()

    async def list_membership_plans(self, institution_id: UUID) -> List[MembershipPlan]:
        res = await self.db.execute(
            select(MembershipPlan)
            .where(MembershipPlan.institution_id == institution_id)
            .order_by(MembershipPlan.created_at.asc())
        )
        return list(res.scalars().all())

    async def update_membership_plan(
        self, plan: MembershipPlan, update_dict: dict
    ) -> MembershipPlan:
        for k, v in update_dict.items():
            if v is not None:
                setattr(plan, k, v)
        await self.db.flush()
        await self.db.refresh(plan)
        return plan

    async def delete_membership_plan(self, plan_id: UUID) -> bool:
        plan = await self.get_membership_plan_by_id(plan_id)
        if not plan:
            return False
        await self.db.delete(plan)
        await self.db.flush()
        return True

    async def assign_courses_to_plan(self, plan_id: UUID, course_ids: List[UUID]) -> bool:
        for c_id in course_ids:
            res = await self.db.execute(
                select(membership_plan_courses).where(
                    and_(
                        membership_plan_courses.c.plan_id == plan_id,
                        membership_plan_courses.c.course_id == c_id,
                    )
                )
            )
            if not res.first():
                await self.db.execute(
                    insert(membership_plan_courses).values(plan_id=plan_id, course_id=c_id)
                )
        await self.db.flush()
        return True

    async def remove_course_from_plan(self, plan_id: UUID, course_id: UUID) -> bool:
        await self.db.execute(
            delete(membership_plan_courses).where(
                and_(
                    membership_plan_courses.c.plan_id == plan_id,
                    membership_plan_courses.c.course_id == course_id,
                )
            )
        )
        await self.db.flush()
        return True

    async def get_plan_course_ids(self, plan_id: UUID) -> List[UUID]:
        res = await self.db.execute(
            select(membership_plan_courses.c.course_id).where(
                membership_plan_courses.c.plan_id == plan_id
            )
        )
        return [row[0] for row in res.all()]

    # Subscription Operations
    async def create_subscription(
        self, user_id: UUID, plan_id: UUID, expires_at: Optional[datetime] = None
    ) -> Subscription:
        sub = Subscription(
            user_id=user_id,
            plan_id=plan_id,
            status=SubscriptionStatus.ACTIVE,
            started_at=datetime.now(timezone.utc),
            expires_at=expires_at,
        )
        self.db.add(sub)
        await self.db.flush()
        await self.db.refresh(sub)
        return sub

    async def get_subscription_by_id(self, subscription_id: UUID) -> Optional[Subscription]:
        res = await self.db.execute(
            select(Subscription).where(Subscription.id == subscription_id)
        )
        return res.scalars().first()

    async def list_user_subscriptions(self, user_id: UUID) -> List[Subscription]:
        res = await self.db.execute(
            select(Subscription)
            .where(Subscription.user_id == user_id)
            .order_by(Subscription.started_at.desc())
        )
        return list(res.scalars().all())

    async def cancel_subscription(self, subscription_id: UUID, user_id: UUID) -> bool:
        sub = await self.get_subscription_by_id(subscription_id)
        if not sub or sub.user_id != user_id:
            return False
        sub.status = SubscriptionStatus.CANCELLED
        sub.cancelled_at = datetime.now(timezone.utc)
        await self.db.flush()
        return True

    # Purchase & Payment Operations
    async def create_payment(
        self,
        amount: Decimal,
        currency: str = "INR",
        provider: str = "MOCK",
        payment_method: str = "CARD",
        metadata_json: Optional[str] = None,
        status: PaymentStatus = PaymentStatus.PENDING,  # CRIT-01: default PENDING, not SUCCESS
    ) -> Payment:
        payment = Payment(
            provider=provider,
            provider_payment_id=f"pay_mock_{uuid.uuid4().hex[:12]}",
            amount=amount,
            currency=currency,
            status=status,
            payment_method=payment_method,
            metadata_json=metadata_json,
        )
        self.db.add(payment)
        await self.db.flush()
        await self.db.refresh(payment)
        return payment

    async def confirm_payment(self, payment_id: UUID) -> Optional["Payment"]:
        """Atomically mark a payment as SUCCESS. Called after provider confirmation."""
        await self.db.execute(
            update(Payment)
            .where(Payment.id == payment_id)
            .values(status=PaymentStatus.SUCCESS)
        )
        await self.db.flush()
        return await self.get_payment_by_id(payment_id)

    async def get_payment_by_id(self, payment_id: UUID) -> Optional[Payment]:
        res = await self.db.execute(select(Payment).where(Payment.id == payment_id))
        return res.scalars().first()

    async def create_course_purchase(
        self,
        user_id: UUID,
        course_id: UUID,
        payment_id: Optional[UUID],
        amount: Decimal,
        currency: str = "INR",
        status: PaymentStatus = PaymentStatus.SUCCESS,
    ) -> CoursePurchase:
        purchase = CoursePurchase(
            user_id=user_id,
            course_id=course_id,
            payment_id=payment_id,
            amount=amount,
            currency=currency,
            status=status,
        )
        self.db.add(purchase)
        await self.db.flush()
        await self.db.refresh(purchase)
        return purchase

    async def find_course_purchase(
        self, user_id: UUID, course_id: UUID
    ) -> Optional[CoursePurchase]:
        # CRIT-02: SELECT FOR UPDATE prevents duplicate purchases under concurrent requests
        res = await self.db.execute(
            select(CoursePurchase)
            .where(
                and_(
                    CoursePurchase.user_id == user_id,
                    CoursePurchase.course_id == course_id,
                    CoursePurchase.status == PaymentStatus.SUCCESS,
                )
            )
            .with_for_update(skip_locked=False)
        )
        return res.scalars().first()

    async def get_course_purchase_by_id(self, purchase_id: UUID) -> Optional[CoursePurchase]:
        res = await self.db.execute(
            select(CoursePurchase).where(CoursePurchase.id == purchase_id)
        )
        return res.scalars().first()

    async def list_user_purchases(self, user_id: UUID) -> List[CoursePurchase]:
        res = await self.db.execute(
            select(CoursePurchase)
            .where(CoursePurchase.user_id == user_id)
            .order_by(CoursePurchase.created_at.desc())
        )
        return list(res.scalars().all())

    async def list_all_payments(self, page: int = 1, limit: int = 20) -> Tuple[List[Payment], int]:
        count_res = await self.db.execute(select(func.count(Payment.id)))
        total = count_res.scalar_one()

        query = (
            select(Payment)
            .order_by(Payment.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    # Coupon Operations
    async def create_coupon(
        self,
        institution_id: UUID,
        code: str,
        discount_type: DiscountType = DiscountType.PERCENTAGE,
        discount_value: Decimal = Decimal("0.00"),
        max_usage: int = 0,
        expires_at: Optional[datetime] = None,
    ) -> Coupon:
        coupon = Coupon(
            institution_id=institution_id,
            code=code.strip().upper(),
            discount_type=discount_type,
            discount_value=discount_value,
            max_usage=max_usage,
            expires_at=expires_at,
            is_active=True,
        )
        self.db.add(coupon)
        await self.db.flush()
        await self.db.refresh(coupon)
        return coupon

    async def get_coupon_by_code(self, code: str) -> Optional[Coupon]:
        res = await self.db.execute(
            select(Coupon).where(Coupon.code == code.strip().upper())
        )
        return res.scalars().first()

    async def get_coupon_by_id(self, coupon_id: UUID) -> Optional[Coupon]:
        res = await self.db.execute(select(Coupon).where(Coupon.id == coupon_id))
        return res.scalars().first()

    async def list_coupons(self, institution_id: Optional[UUID] = None) -> List[Coupon]:
        query = select(Coupon)
        if institution_id:
            query = query.where(Coupon.institution_id == institution_id)
        res = await self.db.execute(query.order_by(Coupon.created_at.desc()))
        return list(res.scalars().all())

    async def update_coupon(self, coupon: Coupon, update_dict: dict) -> Coupon:
        for k, v in update_dict.items():
            if v is not None:
                setattr(coupon, k, v)
        await self.db.flush()
        await self.db.refresh(coupon)
        return coupon

    async def delete_coupon(self, coupon_id: UUID) -> bool:
        coup = await self.get_coupon_by_id(coupon_id)
        if not coup:
            return False
        await self.db.delete(coup)
        await self.db.flush()
        return True

    async def increment_coupon_usage(self, coupon_id: UUID) -> bool:
        """
        HIGH-07: Atomic conditional increment — prevents race condition where
        two concurrent requests both pass the usage-limit check and both
        increment the counter beyond max_usage.

        Returns True if increment succeeded, False if limit already reached.
        """
        result = await self.db.execute(
            update(Coupon)
            .where(
                and_(
                    Coupon.id == coupon_id,
                    # Only increment when usage has not yet hit the limit
                    # (max_usage == 0 means unlimited)
                    (Coupon.max_usage == 0) | (Coupon.used_count < Coupon.max_usage),
                )
            )
            .values(used_count=Coupon.used_count + 1)
            .returning(Coupon.id)
        )
        await self.db.flush()
        return result.scalar_one_or_none() is not None

    # Core Access Engine Checks
    async def is_user_institution_member(self, user_id: UUID, institution_id: UUID) -> bool:
        res = await self.db.execute(
            select(InstitutionMember).where(
                and_(
                    InstitutionMember.user_id == user_id,
                    InstitutionMember.institution_id == institution_id,
                    InstitutionMember.status == MemberStatus.ACTIVE,
                )
            )
        )
        return res.scalars().first() is not None

    async def has_user_purchased_course(self, user_id: UUID, course_id: UUID) -> bool:
        pur = await self.find_course_purchase(user_id, course_id)
        return pur is not None

    async def has_user_active_plan_for_course(self, user_id: UUID, course_id: UUID) -> bool:
        res = await self.db.execute(
            select(Subscription)
            .join(
                membership_plan_courses,
                Subscription.plan_id == membership_plan_courses.c.plan_id,
            )
            .where(
                and_(
                    Subscription.user_id == user_id,
                    Subscription.status == SubscriptionStatus.ACTIVE,
                    membership_plan_courses.c.course_id == course_id,
                )
            )
        )
        return res.scalars().first() is not None

    # Statistics
    async def get_membership_statistics(self) -> dict:
        active_res = await self.db.execute(
            select(func.count(Subscription.id)).where(
                Subscription.status == SubscriptionStatus.ACTIVE
            )
        )
        active_subs = active_res.scalar_one()

        expired_res = await self.db.execute(
            select(func.count(Subscription.id)).where(
                Subscription.status == SubscriptionStatus.EXPIRED
            )
        )
        expired_subs = expired_res.scalar_one()

        m_rev_res = await self.db.execute(
            select(func.coalesce(func.sum(MembershipPlan.price), 0.0))
            .join(Subscription, MembershipPlan.id == Subscription.plan_id)
            .where(
                and_(
                    Subscription.status == SubscriptionStatus.ACTIVE,
                    MembershipPlan.billing_cycle == BillingCycle.MONTHLY,
                )
            )
        )
        monthly_rev = m_rev_res.scalar_one()

        y_rev_res = await self.db.execute(
            select(func.coalesce(func.sum(MembershipPlan.price), 0.0))
            .join(Subscription, MembershipPlan.id == Subscription.plan_id)
            .where(
                and_(
                    Subscription.status == SubscriptionStatus.ACTIVE,
                    MembershipPlan.billing_cycle == BillingCycle.YEARLY,
                )
            )
        )
        yearly_rev = y_rev_res.scalar_one()

        return {
            "active_subscriptions": active_subs,
            "expired_subscriptions": expired_subs,
            "monthly_revenue": monthly_rev,
            "yearly_revenue": yearly_rev,
        }

    async def get_payment_statistics(self) -> dict:
        succ_res = await self.db.execute(
            select(func.count(Payment.id)).where(Payment.status == PaymentStatus.SUCCESS)
        )
        successful = succ_res.scalar_one()

        fail_res = await self.db.execute(
            select(func.count(Payment.id)).where(Payment.status == PaymentStatus.FAILED)
        )
        failed = fail_res.scalar_one()

        ref_res = await self.db.execute(
            select(func.count(Payment.id)).where(Payment.status == PaymentStatus.REFUNDED)
        )
        refunded = ref_res.scalar_one()

        rev_res = await self.db.execute(
            select(func.coalesce(func.sum(Payment.amount), 0.0)).where(
                Payment.status == PaymentStatus.SUCCESS
            )
        )
        revenue = rev_res.scalar_one()

        return {
            "successful": successful,
            "failed": failed,
            "refunded": refunded,
            "revenue": revenue,
        }
