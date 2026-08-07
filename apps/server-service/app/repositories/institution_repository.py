from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import func, select, update, and_, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.institution import (
    Institution,
    InstitutionSettings,
    InstitutionSocialLink,
    InstitutionStatus,
    InstitutionVisibility,
)


class InstitutionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_institution(
        self,
        owner_id: UUID,
        name: str,
        slug: str,
        tagline: Optional[str] = None,
        description: Optional[str] = None,
        email: Optional[str] = None,
        phone: Optional[str] = None,
        website: Optional[str] = None,
        timezone_str: str = "Asia/Kolkata",
        language: str = "en",
        currency: str = "INR",
    ) -> Institution:
        inst = Institution(
            owner_id=owner_id,
            name=name,
            slug=slug,
            tagline=tagline,
            description=description,
            email=email,
            phone=phone,
            website=website,
            timezone=timezone_str,
            language=language,
            currency=currency,
            visibility=InstitutionVisibility.PUBLIC,
            status=InstitutionStatus.DRAFT,
            is_verified=False,
            is_deleted=False,
        )
        self.db.add(inst)
        await self.db.flush()
        await self.db.refresh(inst)
        return inst

    async def create_default_settings(self, institution_id: UUID) -> InstitutionSettings:
        settings = InstitutionSettings(institution_id=institution_id)
        self.db.add(settings)
        await self.db.flush()
        await self.db.refresh(settings)
        return settings

    async def get_by_id(
        self, institution_id: UUID, include_deleted: bool = False
    ) -> Optional[Institution]:
        query = select(Institution).where(Institution.id == institution_id)
        if not include_deleted:
            query = query.where(Institution.is_deleted == False)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def get_by_slug(
        self, slug: str, include_deleted: bool = False
    ) -> Optional[Institution]:
        query = select(Institution).where(Institution.slug == slug)
        if not include_deleted:
            query = query.where(Institution.is_deleted == False)
        result = await self.db.execute(query)
        return result.scalars().first()

    async def list_by_owner(self, owner_id: UUID) -> List[Institution]:
        result = await self.db.execute(
            select(Institution)
            .where(and_(Institution.owner_id == owner_id, Institution.is_deleted == False))
            .order_by(Institution.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_institutions(
        self,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
        status_filter: Optional[str] = None,
        visibility_filter: Optional[str] = None,
        city: Optional[str] = None,
        country: Optional[str] = None,
        verified_only: bool = False,
        sort: str = "desc",
        is_deleted: bool = False,
    ) -> Tuple[List[Institution], int]:
        conditions = [Institution.is_deleted == is_deleted]

        if status_filter:
            conditions.append(Institution.status == status_filter)
        if visibility_filter:
            conditions.append(Institution.visibility == visibility_filter)
        if verified_only:
            conditions.append(Institution.is_verified == True)
        if city:
            conditions.append(Institution.city.ilike(f"%{city}%"))
        if country:
            conditions.append(Institution.country.ilike(f"%{country}%"))
        if search:
            conditions.append(
                (Institution.name.ilike(f"%{search}%"))
                | (Institution.slug.ilike(f"%{search}%"))
                | (Institution.tagline.ilike(f"%{search}%"))
            )

        count_query = select(func.count(Institution.id)).where(and_(*conditions))
        total_res = await self.db.execute(count_query)
        total = total_res.scalar_one()

        query = select(Institution).where(and_(*conditions))
        if sort.lower() == "asc":
            query = query.order_by(Institution.created_at.asc())
        else:
            query = query.order_by(Institution.created_at.desc())

        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        res = await self.db.execute(query)
        return list(res.scalars().all()), total

    async def update_institution(
        self, institution: Institution, update_dict: dict
    ) -> Institution:
        for key, value in update_dict.items():
            if value is not None:
                setattr(institution, key, value)
        await self.db.flush()
        await self.db.refresh(institution)
        return institution

    async def soft_delete(self, institution_id: UUID) -> bool:
        inst = await self.get_by_id(institution_id, include_deleted=False)
        if not inst:
            return False
        inst.is_deleted = True
        inst.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()
        return True

    async def restore(self, institution_id: UUID) -> bool:
        inst = await self.get_by_id(institution_id, include_deleted=True)
        if not inst or not inst.is_deleted:
            return False
        inst.is_deleted = False
        inst.deleted_at = None
        await self.db.flush()
        return True

    async def set_status(self, institution_id: UUID, new_status: InstitutionStatus) -> Optional[Institution]:
        inst = await self.get_by_id(institution_id)
        if not inst:
            return None
        inst.status = new_status
        await self.db.flush()
        await self.db.refresh(inst)
        return inst

    # Settings
    async def get_settings(self, institution_id: UUID) -> Optional[InstitutionSettings]:
        result = await self.db.execute(
            select(InstitutionSettings).where(InstitutionSettings.institution_id == institution_id)
        )
        return result.scalars().first()

    async def update_settings(
        self, institution_id: UUID, update_dict: dict
    ) -> InstitutionSettings:
        settings = await self.get_settings(institution_id)
        if not settings:
            settings = await self.create_default_settings(institution_id)

        for key, value in update_dict.items():
            if value is not None:
                setattr(settings, key, value)

        await self.db.flush()
        await self.db.refresh(settings)
        return settings

    # Social Links
    async def list_social_links(self, institution_id: UUID) -> List[InstitutionSocialLink]:
        result = await self.db.execute(
            select(InstitutionSocialLink).where(
                InstitutionSocialLink.institution_id == institution_id
            )
        )
        return list(result.scalars().all())

    async def add_social_link(
        self, institution_id: UUID, platform: str, url: str
    ) -> InstitutionSocialLink:
        link = InstitutionSocialLink(
            institution_id=institution_id, platform=platform, url=url
        )
        self.db.add(link)
        await self.db.flush()
        await self.db.refresh(link)
        return link

    async def update_social_link(
        self, link_id: UUID, institution_id: UUID, platform: str, url: str
    ) -> Optional[InstitutionSocialLink]:
        result = await self.db.execute(
            select(InstitutionSocialLink).where(
                and_(
                    InstitutionSocialLink.id == link_id,
                    InstitutionSocialLink.institution_id == institution_id,
                )
            )
        )
        link = result.scalars().first()
        if not link:
            return None
        link.platform = platform
        link.url = url
        await self.db.flush()
        await self.db.refresh(link)
        return link

    async def delete_social_link(self, link_id: UUID, institution_id: UUID) -> bool:
        result = await self.db.execute(
            select(InstitutionSocialLink).where(
                and_(
                    InstitutionSocialLink.id == link_id,
                    InstitutionSocialLink.institution_id == institution_id,
                )
            )
        )
        link = result.scalars().first()
        if not link:
            return False
        await self.db.delete(link)
        await self.db.flush()
        return True
