import re
from decimal import Decimal
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy import func, select, or_, and_, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, CourseCategory, CourseStatus, CourseTag, course_tag_map
from app.models.enrollment import Enrollment
from app.models.institution import Institution, InstitutionStatus
from app.models.member import InstitutionMember, MemberStatus
from app.models.user import User


def _clean_search_term(term: str) -> str:
    """Strip special syntax characters (&, |, !, etc.) to prevent query parser exceptions."""
    if not term:
        return ""
    cleaned = re.sub(r"[&|!<>():*'\"]", " ", term).strip()
    return cleaned if cleaned else term.strip()


def _fts_query(term: str):
    """Build a plainto_tsquery expression for full-text search with cleaned query."""
    clean = _clean_search_term(term)
    return func.plainto_tsquery("english", clean or term)


def _ts_rank(vector_col, query):
    """Compute ts_rank for relevance ordering."""
    return func.ts_rank(vector_col, query)


class SearchRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_courses(
        self,
        q: Optional[str] = None,
        category_id: Optional[UUID] = None,
        tag_id: Optional[UUID] = None,
        institution_id: Optional[UUID] = None,
        level: Optional[str] = None,
        access_type: Optional[str] = None,
        min_price: Optional[Decimal] = None,
        max_price: Optional[Decimal] = None,
        sort_by: str = "newest",
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        # Subquery for enrollment counts per course
        enr_sub = (
            select(Enrollment.course_id, func.count(Enrollment.id).label("enr_count"))
            .group_by(Enrollment.course_id)
            .subquery()
        )

        # Build relevance rank expression (only when q is provided)
        ts_query = _fts_query(q) if q else None
        rank_col = _ts_rank(Course.search_vector, ts_query).label("rank") if ts_query else None

        select_cols = [
            Course,
            Institution.name.label("institution_name"),
            CourseCategory.name.label("category_name"),
            func.coalesce(enr_sub.c.enr_count, 0).label("enrollment_count"),
        ]
        if rank_col is not None:
            select_cols.append(rank_col)

        query = (
            select(*select_cols)
            .outerjoin(Institution, Course.institution_id == Institution.id)
            .outerjoin(CourseCategory, Course.category_id == CourseCategory.id)
            .outerjoin(enr_sub, Course.id == enr_sub.c.course_id)
            .where(Course.status == CourseStatus.PUBLISHED)
        )

        if q:
            clean_q = _clean_search_term(q)
            # GAP-02 FIX: Full-text search with GIN index.
            # Primary: tsvector @@ tsquery (uses GIN index, sub-20ms)
            # Fallback: pg_trgm similarity for typo tolerance + substring ILIKE safety
            fts_match = Course.search_vector.op("@@")(ts_query)
            trgm_match = Course.title.op("%%")(clean_q)
            ilike_match = or_(
                Course.title.ilike(f"%{clean_q}%"),
                Course.description.ilike(f"%{clean_q}%"),
            )
            query = query.where(or_(fts_match, trgm_match, ilike_match))

        if category_id:
            query = query.where(Course.category_id == category_id)

        if institution_id:
            query = query.where(Course.institution_id == institution_id)

        if level:
            query = query.where(Course.level == level)

        if access_type:
            query = query.where(Course.access_type == access_type)

        if min_price is not None:
            query = query.where(Course.price >= min_price)

        if max_price is not None:
            query = query.where(Course.price <= max_price)

        if tag_id:
            query = query.join(course_tag_map, Course.id == course_tag_map.c.course_id).where(
                course_tag_map.c.tag_id == tag_id
            )

        # Count total matches
        count_stmt = select(func.count()).select_from(query.subquery())
        count_res = await self.db.execute(count_stmt)
        total = count_res.scalar_one()

        # Apply Sorting — FTS queries sort by relevance first, then by secondary sort
        if q and ts_query is not None:
            # Primary: relevance rank (desc), secondary: sort_by selection
            secondary = Course.created_at.desc()
            if sort_by == "popular":
                secondary = func.coalesce(enr_sub.c.enr_count, 0).desc()
            elif sort_by == "price_asc":
                secondary = Course.price.asc()
            elif sort_by == "price_desc":
                secondary = Course.price.desc()
            query = query.order_by(
                _ts_rank(Course.search_vector, ts_query).desc(),
                secondary,
            )
        elif sort_by == "popular":
            query = query.order_by(func.coalesce(enr_sub.c.enr_count, 0).desc(), Course.created_at.desc())
        elif sort_by == "price_asc":
            query = query.order_by(Course.price.asc(), Course.created_at.desc())
        elif sort_by == "price_desc":
            query = query.order_by(Course.price.desc(), Course.created_at.desc())
        else:  # newest
            query = query.order_by(Course.created_at.desc())

        query = query.offset((page - 1) * limit).limit(limit)
        res = await self.db.execute(query)

        items = []
        for row in res.all():
            c = row[0]
            inst_name = row[1]
            cat_name = row[2]
            enr_cnt = row[3]
            items.append(
                {
                    "id": c.id,
                    "title": c.title,
                    "subtitle": c.subtitle,
                    "description": c.description,
                    "institution_id": c.institution_id,
                    "institution_name": inst_name,
                    "category_id": c.category_id,
                    "category_name": cat_name,
                    "price": c.price,
                    "currency": c.currency,
                    "level": c.level.value if hasattr(c.level, "value") else str(c.level),
                    "access_type": c.access_type.value if hasattr(c.access_type, "value") else str(c.access_type),
                    "enrollment_count": enr_cnt,
                    "avg_rating": float(c.avg_rating) if c.avg_rating else 0.0,
                    "review_count": c.review_count or 0,
                    "created_at": c.created_at,
                }
            )

        return items, total

    async def search_institutions(
        self, q: Optional[str] = None, page: int = 1, limit: int = 20
    ) -> Tuple[List[dict], int]:
        course_sub = (
            select(Course.institution_id, func.count(Course.id).label("c_count"))
            .where(Course.status == CourseStatus.PUBLISHED)
            .group_by(Course.institution_id)
            .subquery()
        )
        mem_sub = (
            select(
                InstitutionMember.institution_id,
                func.count(InstitutionMember.id).label("m_count"),
            )
            .where(InstitutionMember.status == MemberStatus.ACTIVE)
            .group_by(InstitutionMember.institution_id)
            .subquery()
        )

        query = (
            select(
                Institution,
                func.coalesce(course_sub.c.c_count, 0).label("course_count"),
                func.coalesce(mem_sub.c.m_count, 0).label("member_count"),
            )
            .outerjoin(course_sub, Institution.id == course_sub.c.institution_id)
            .outerjoin(mem_sub, Institution.id == mem_sub.c.institution_id)
            .where(Institution.status == InstitutionStatus.ACTIVE)
        )

        if q:
            # GAP-02 FIX: Use institution FTS vector when available, with pg_trgm fallback + ilike
            clean_q = _clean_search_term(q)
            ts_query = _fts_query(clean_q)
            fts_match = Institution.search_vector.op("@@")(ts_query)
            trgm_match = Institution.name.op("%%")(clean_q)
            ilike_match = or_(
                Institution.name.ilike(f"%{clean_q}%"),
                Institution.tagline.ilike(f"%{clean_q}%"),
            )
            query = query.where(or_(fts_match, trgm_match, ilike_match))

        count_stmt = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()

        if q:
            ts_query = _fts_query(q)
            query = query.order_by(
                _ts_rank(Institution.search_vector, ts_query).desc(),
                func.coalesce(mem_sub.c.m_count, 0).desc(),
                Institution.created_at.desc(),
            )
        else:
            query = (
                query.order_by(func.coalesce(mem_sub.c.m_count, 0).desc(), Institution.created_at.desc())
            )

        query = query.offset((page - 1) * limit).limit(limit)
        res = await self.db.execute(query)

        items = []
        for row in res.all():
            inst = row[0]
            c_cnt = row[1]
            m_cnt = row[2]
            items.append(
                {
                    "id": inst.id,
                    "name": inst.name,
                    "slug": inst.slug,
                    "tagline": inst.tagline,
                    "course_count": c_cnt,
                    "member_count": m_cnt,
                    "created_at": inst.created_at,
                }
            )

        return items, total

    async def search_teachers(
        self,
        q: Optional[str] = None,
        institution_id: Optional[UUID] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        query = (
            select(User, Institution.name.label("institution_name"), InstitutionMember.institution_id)
            .join(InstitutionMember, User.id == InstitutionMember.user_id)
            .join(Institution, InstitutionMember.institution_id == Institution.id)
            .where(
                and_(
                    User.is_active == True,
                    InstitutionMember.status == MemberStatus.ACTIVE,
                )
            )
        )

        if q:
            term = f"%{q.strip()}%"
            query = query.where(or_(User.name.ilike(term), User.email.ilike(term)))

        if institution_id:
            query = query.where(InstitutionMember.institution_id == institution_id)

        count_stmt = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()

        query = query.offset((page - 1) * limit).limit(limit)
        res = await self.db.execute(query)

        items = []
        for row in res.all():
            u = row[0]
            inst_name = row[1]
            inst_id = row[2]
            items.append(
                {
                    "user_id": u.id,
                    "name": u.name,
                    "email": u.email,
                    "institution_id": inst_id,
                    "institution_name": inst_name,
                    "role_name": "Instructor",
                }
            )

        return items, total

    async def get_suggestions(self, q: str) -> dict:
        clean_q = _clean_search_term(q)
        term = f"%{clean_q}%"
        ts_query = _fts_query(clean_q)

        # Course titles — FTS with trgm fallback
        c_res = await self.db.execute(
            select(Course.title)
            .where(
                and_(
                    Course.status == CourseStatus.PUBLISHED,
                    or_(
                        Course.search_vector.op("@@")(ts_query),
                        Course.title.ilike(term),
                    ),
                )
            )
            .order_by(_ts_rank(Course.search_vector, ts_query).desc())
            .limit(5)
        )
        course_titles = [row[0] for row in c_res.all()]

        inst_res = await self.db.execute(
            select(Institution.name)
            .where(
                and_(
                    Institution.status == InstitutionStatus.ACTIVE,
                    or_(
                        Institution.search_vector.op("@@")(ts_query),
                        Institution.name.ilike(term),
                    ),
                )
            )
            .limit(5)
        )
        inst_names = [row[0] for row in inst_res.all()]

        tag_res = await self.db.execute(
            select(CourseTag.name).where(CourseTag.name.ilike(term)).limit(5)
        )
        tag_names = [row[0] for row in tag_res.all()]

        return {
            "courses": course_titles,
            "institutions": inst_names,
            "tags": tag_names,
        }
