from fastapi import APIRouter

from app.api.v1 import admin, auth, leaderboard, matches, predictions, users

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(matches.router)
api_router.include_router(predictions.router)
api_router.include_router(leaderboard.router)
api_router.include_router(users.router)
api_router.include_router(admin.router)
