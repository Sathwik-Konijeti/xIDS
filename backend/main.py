from fastapi import FastAPI
from database import engine, Base
from routes.ingest import router as ingest_router
from routes.auth import router as auth_router
from routes.alerts import router as alerts_router
from routes.stats import router as stats_router

# create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="xIDS API", version="2.0")

app.include_router(auth_router)
app.include_router(ingest_router)
app.include_router(alerts_router)
app.include_router(stats_router)

@app.get("/health")
def health():
    return {"status": "ok"}
