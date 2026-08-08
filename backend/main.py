from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

try:
    from api.routes import verifynet, detectnet, shieldtrain, report, auth, telegram_link
except ImportError:
    from backend.api.routes import verifynet, detectnet, shieldtrain, report, auth, telegram_link

FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

app = FastAPI(
    title="SEBI Kavach API",
    description="AI-Driven Detection & Authentication Platform for Securities Markets",
)

# CORS — restrict to frontend domain in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL] if FRONTEND_URL != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(verifynet.router, prefix="/api/v1")
app.include_router(detectnet.router, prefix="/api/v1")
app.include_router(shieldtrain.router, prefix="/api/v1")
app.include_router(report.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(telegram_link.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to SEBI Kavach API. Visit /docs for API documentation."}

@app.get("/health")
def health_check():
    return {"status": "ok"}
