from abc import ABC, abstractmethod
from typing import Any, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class BaseAITask(ABC):
    """
    Abstract Base Class for all plug-and-play AI tasks in LearnioX.
    """

    @property
    @abstractmethod
    def task_name(self) -> str:
        """Unique identifier for this AI task."""
        pass

    @abstractmethod
    async def execute(self, payload: Any) -> Any:
        """Executes the AI task with structured output validation."""
        pass
