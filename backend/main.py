from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import verifynet, detectnet, shieldtrain, report

app = FastAPI(title="SEBI Kavach API", description="AI-Driven Detection & Authentication Platform for Securities Markets")

# Configure CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, allow all. In production, restrict to frontend domain.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(verifynet.router, prefix="/api/v1")
app.include_router(detectnet.router, prefix="/api/v1")
app.include_router(shieldtrain.router, prefix="/api/v1")
app.include_router(report.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to SEBI Kavach API. Visit /docs for API documentation."}
