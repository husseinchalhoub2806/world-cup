from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator

from app.models.user import UserRole, UserStatus


class UserRegister(BaseModel):
    nickname: str
    real_name: str
    password: str

    @field_validator("nickname")
    @classmethod
    def nickname_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 50:
            raise ValueError("Nickname must be between 2 and 50 characters")
        return v

    @field_validator("real_name")
    @classmethod
    def real_name_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2 or len(v) > 100:
            raise ValueError("Real name must be between 2 and 100 characters")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v: str) -> str:
        if len(v) < 4:
            raise ValueError("Password must be at least 4 characters")
        return v


class UserLogin(BaseModel):
    nickname: str
    password: str


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    nickname: str
    real_name: str
    role: UserRole
    status: UserStatus
    joker_balance: int
    created_at: datetime


class UserPublic(BaseModel):
    """Minimal public-facing user info."""
    model_config = {"from_attributes": True}

    id: int
    nickname: str
    role: UserRole
    status: UserStatus


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class AdminUserUpdate(BaseModel):
    status: Optional[UserStatus] = None
    role: Optional[UserRole] = None


class JokerGrantInput(BaseModel):
    count: int = 1
