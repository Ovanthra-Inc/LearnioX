from datetime import datetime, timezone
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import func, select, and_, delete, insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import (
    Course,
    CourseAccessType,
    CourseCategory,
    CourseLevel,
    CourseStatus,
    CourseTag,
    CourseVisibility,
    course_tag_map,
)


class CourseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # Category Methods
    async def create_category(
        self, name: str, slug: str, parent_id: Optional[UUID] = None
    ) -> CourseCategory:
        category = CourseCategory(name=name.strip(), slug=slug, parent_id=parent_id)
        self.db.add(category)
        await self.db.flush()
        await self.db.refresh(category)
        return category

    async def get_category_by_id(self, category_id: UUID) -> Optional[CourseCategory]:
        res = await self.db.execute(
            select(CourseCategory).where(CourseCategory.id == category_id)
        )
        return res.scalars().first()

    async def get_category_by_slug(self, slug: str) -> Optional[CourseCategory]:
        res = await self.db.execute(
            select(CourseCategory).where(CourseCategory.slug == slug)
        )
        return res.scalars().first()

    async def list_categories() -> List[CourseCategory]:
        res = await self.db.execute(
            select(CourseCategory).order_by(CourseCategory.name.asc())
        )
        return list(res.scalars().all())

    async def update_category(
        self, category: CourseCategory, update_dict: dict
    ) -> CourseCategory:
        for k, v in update_dict.items():
            if v is not None:
                setattr(category, k, v)
        await self.db.flush()
        await self.db.refresh(category)
        return category

    async def delete_category(self, category_id: UUID) -> bool:
        cat = await self.get_category_by_id(category_id)
        if not cat:
            return False
        await self.db.delete(cat)
        await self.db.flush()
        return True

    # Tag Methods
    async def create_tag(self, name: str) -> CourseTag:
        tag = CourseTag(name=name.strip())
        self.db.add(tag)
        await self.db.flush()
        await self.db.refresh(tag)
        return tag

    async def get_tag_by_id(self, tag_id: UUID) -> Optional[CourseTag]:
        res = await self.db.execute(select(CourseTag).where(CourseTag.id == tag_id))
        return res.scalars().first()

    async def list_tags() -> List[CourseTag]:
        res = await self.db.execute(select(CourseTag).order_by(CourseTag.name.asc()))
        return list(res.scalars().all())

    async def get_tags_by_ids(self, tag_ids: List[UUID]) -> List[CourseTag]:
        if not tag_ids:
            return []
        res = await self.db.execute(select(CourseTag).where(CourseTag.id.in_(tag_ids)))
        return list(res.scalars().all())

    async def update_tag(self, tag: CourseTag, name: str) -> CourseTag:
        tag.name = name.strip()
        await self.db.flush()
        await self.db.refresh(tag)
        return tag

    async def delete_tag(self, tag_id: UUID) -> bool:
        tag = await self.get_tag_by_id(tag_id)
        if not tag:
            return False
        await self.db.delete(tag)
        await self.db.flush()
        return True

    # Course Methods
    async def create_course(
        self,
        institution_id: UUID,
        created_by: UUID,
        title: str,
        slug: str,
        subtitle: Optional[str],
        description: str,
        category_id: Optional[UUID],
        language: str,
        level: CourseLevel,
        access_type: CourseAccessType,
        price: float,
        currency: str,
        certificate_enabled: bool,
        allow_reviews: bool,
        allow_download: bool,
    ) -> Course:
        course = Course(
            institution_id=institution_id,
            created_by=created_by,
            title=title.strip(),
            slug=slug,
            subtitle=subtitle,
            description=description,
            category_id=category_id,
            language=language,
            level=level,
            access_type=access_type,
            price=price,
            currency=currency,
            certificate_enabled=certificate_enabled,
            allow_reviews=allow_reviews,
            allow_download=allow_download,
            status=CourseStatus.DRAFT,
            visibility=CourseVisibility.PUBLIC,
        )
        self.db.add(course)
        await self.db.flush()
        await self.db.refresh(course)
        return course

    async def get_course_by_id(
        self, course_id: UUID, include_deleted: bool = False
    ) -> Optional[Course]:
        query = select(Course).where(Course.id == course_id)
        if not include_deleted:
            query = query.where(Course.is_deleted == False)
        res = await self.db.execute(query)
        return res.scalars().first()

    async def get_course_by_slug(self, slug: str) -> Optional[Course]:
        res = await self.db.execute(
            select(Course).where(and_(Course.slug == slug, Course.is_deleted == False))
        )
        return res.scalars().first()

    async def list_courses(
        self,
        page: int = 1,
        limit: int = 20,
        institution_id: Optional[UUID] = None,
        category_id: Optional[UUID] = None,
        level: Optional[str] = None,
        status: Optional[str] = None,
        visibility: Optional[str] = None,
        access_type: Optional[str] = None,
        search: Optional[str] = None,
        sort: str = "desc",
    ) -> Tuple[List[Course], int]:
        conditions = [Course.is_deleted == False]
        if institution_id:
            conditions.append(Course.institution_id == institution_id)
        if category_id:
            conditions.append(Course.category_id == category_id)
        if level:
            conditions.append(Course.level == level)
        if status:
            conditions.append(Course.status == status)
        if visibility:
            conditions.append(Course.visibility == visibility)
        if access_type:
            conditions.append(Course.access_type == access_type)
        if search:
            conditions.append(
                (Course.title.ilike(f"%{search}%")) | (Course.description.ilike(f"%{search}%"))
            )

        count_query = select(func.count(Course.id)).where(and_(*conditions))
        total_res = await self.db.execute(count_query)
        total = total_res.scalar_one()

        query = select(Course).where(and_(*conditions))
        if sort.lower() == "asc":
            query = query.order_by(Course.created_at.asc())
        else:
            query = query.order_by(Course.created_at.desc())

        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all()), total

    async def update_course(self, course: Course, update_dict: dict) -> Course:
        for k, v in update_dict.items():
            if v is not None:
                setattr(course, k, v)
        await self.db.flush()
        await self.db.refresh(course)
        return course

    async def soft_delete_course(self, course_id: UUID) -> bool:
        course = await self.get_course_by_id(course_id)
        if not course:
            return False
        course.is_deleted = True
        course.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()
        return True

    async def assign_course_tags(self, course: Course, tag_ids: List[UUID]) -> Course:
        tags = await self.get_tags_by_ids(tag_ids)
        course.tags = tags
        await self.db.flush()
        await self.db.refresh(course)
        return course

    async def remove_course_tag(self, course_id: UUID, tag_id: UUID) -> bool:
        stmt = delete(course_tag_map).where(
            and_(
                course_tag_map.c.course_id == course_id,
                course_tag_map.c.tag_id == tag_id,
            )
        )
        await self.db.execute(stmt)
        await self.db.flush()
        return True

    async def get_course_statistics(self, course_id: UUID) -> dict:
        return {
            "total_students": 0,
            "total_lessons": 0,
            "total_modules": 0,
            "total_reviews": 0,
            "average_rating": 0.0,
            "completion_rate": 0.0,
            "total_watch_hours": 0.0,
        }
