import asyncio
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logger = logging.getLogger("Main")

try:
    from api.routes import verifynet, detectnet, shieldtrain, report, auth, telegram_link
except ImportError:
    try:
        from backend.api.routes import verifynet, detectnet, shieldtrain, report, auth, telegram_link
    except ImportError:
        import sys
        from pathlib import Path
        sys.path.append(str(Path(__file__).parent.resolve()))
        from api.routes import verifynet, detectnet, shieldtrain, report, auth, telegram_link

FRONTEND_URL = os.getenv("FRONTEND_URL", "*")

app = FastAPI(
    title="SEBI Kavach API",
    description="AI-Driven Detection & Authentication Platform for Securities Markets",
)

# CORS — allow all origins so Railway backend works with any Vercel/localhost URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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

@app.on_event("startup")
async def on_startup():
    try:
        try:
            from telegram_bot import start_telegram_bot_async
        except ImportError:
            from backend.telegram_bot import start_telegram_bot_async
        asyncio.create_task(start_telegram_bot_async())
        logger.info("[Startup] Telegram Bot background task launched successfully.")
    except Exception as exc:
        logger.warning("[Startup] Telegram Bot background launch skipped: %s", exc)

@app.get("/")
def read_root():
    return {"message": "Welcome to SEBI Kavach API. Visit /docs for API documentation."}

@app.get("/health")
def health_check():
    return {"status": "ok"}
