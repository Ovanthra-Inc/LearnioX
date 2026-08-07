from typing import List, Dict
from app.core.config import settings


class ServiceRoute:
    def __init__(self, path_prefix: str, target: str, name: str, description: str):
        self.path_prefix = path_prefix
        self.target = target
        self.name = name
        self.description = description

    def to_dict(self) -> Dict[str, str]:
        return {
            "path_prefix": self.path_prefix,
            "target": self.target,
            "name": self.name,
            "description": self.description,
        }


# LearnioX Central Microservice Routing Table
SERVICE_REGISTRY: List[ServiceRoute] = [
    ServiceRoute(
        path_prefix="/api/v1/ai",
        target=settings.AI_SERVICE_URL,
        name="ai-service",
        description="AI tutoring, automated quiz generation, and content intelligence service",
    ),
    ServiceRoute(
        path_prefix="/api/v1/marketing",
        target=settings.MARKETING_SERVICE_URL,
        name="marketing-service",
        description="Marketing landing pages, email notifications, and conversion tracking service",
    ),
    # Default fallback route for core backend
    ServiceRoute(
        path_prefix="/api/v1",
        target=settings.SERVER_SERVICE_URL,
        name="server-service",
        description="Core backend service — Auth, Courses, Enrollments, Payments, Storage, Curriculum",
    ),
]


def resolve_target_service(path: str) -> tuple[ServiceRoute | None, str]:
    """
    Matches the longest matching path prefix and returns the target ServiceRoute
    along with the remaining target path.
    """
    for route in SERVICE_REGISTRY:
        if path.startswith(route.path_prefix):
            return route, path
    return None, path
