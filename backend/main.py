from fastapi import FastAPI
from database import engine, Base
from routes.ingest import router as ingest_router

# create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="xIDS API", version="2.0")

app.include_router(ingest_router)

@app.get("/health")
def health():
    return {"status": "ok"}
