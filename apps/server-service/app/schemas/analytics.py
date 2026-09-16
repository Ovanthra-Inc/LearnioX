from decimal import Decimal
from typing import Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class InstitutionAnalyticsResponse(BaseModel):
    institution_id: UUID
    total_courses: int
    total_published_courses: int
    total_students: int
    total_enrollments: int
    active_enrollments: int
    completed_enrollments: int
    total_revenue: Decimal
    currency: str
    recent_enrollments_count_7d: int
    recent_revenue_7d: Decimal


class CourseAnalyticsResponse(BaseModel):
    course_id: UUID
    course_title: str
    total_enrollments: int
    active_students: int
    completion_rate_percent: float
    avg_rating: Decimal
    review_count: int
    total_revenue: Decimal
