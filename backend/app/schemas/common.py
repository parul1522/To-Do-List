from pydantic import BaseModel, ConfigDict


class APIModel(BaseModel):
    """Base for response models read straight from ORM objects."""

    model_config = ConfigDict(from_attributes=True)


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: object | None = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
