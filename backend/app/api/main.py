from fastapi import APIRouter

from app.api.routes import users, schools, trips

api_router = APIRouter()
api_router.include_router(users.router)
api_router.include_router(schools.router)
api_router.include_router(trips.router)
