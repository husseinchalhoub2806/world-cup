from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.security import create_access_token, verify_password
from app.crud.crud_user import create_user, get_user_by_nickname
from app.models.user import User
from app.schemas.user import TokenResponse, UserLogin, UserRegister, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    if get_user_by_nickname(db, data.nickname):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nickname already taken",
        )

    user = create_user(db, data)
    logger.info("New user registered: '{}' (id={}) — pending approval", user.nickname, user.id)
    return user


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_nickname(db, data.nickname)

    if not user or not verify_password(data.password, user.hashed_password):
        logger.warning("Failed login attempt for nickname='{}'", data.nickname)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid nickname or password",
        )

    token = create_access_token(user.id)
    logger.info("User '{}' (id={}) logged in successfully", user.nickname, user.id)

    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
