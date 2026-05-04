from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# --- Config ---
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL_MIN = 60 * 24 * 7  # 7 days for owner convenience

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Autoland 07 API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# --- Helpers ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_TTL_MIN),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Neautentificat")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Token invalid")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilizator inexistent")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirat")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalid")


# --- Models ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    user: dict


class Settings(BaseModel):
    phone: str = "+40 753 017 291"
    email: str = "contact@autoland07.ro"
    address: str = "Nicolae Titulescu nr. 78bis, 120159 Buzău, România"
    schedule_weekday: str = "08:30 - 17:00"
    schedule_saturday: str = "08:30 - 12:00"
    schedule_sunday: str = "Închis"
    status: str = "open"  # open | break | closed
    status_message: str = ""


class SettingsUpdate(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    schedule_weekday: Optional[str] = None
    schedule_saturday: Optional[str] = None
    schedule_sunday: Optional[str] = None
    status: Optional[str] = None
    status_message: Optional[str] = None


class InquiryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    contact: Optional[str] = Field(None, max_length=120)  # phone or email (optional)
    vin: Optional[str] = Field(None, max_length=40)
    car_model: Optional[str] = Field(None, max_length=120)
    problem: str = Field(..., min_length=5, max_length=2000)


class InquiryOut(BaseModel):
    id: str
    name: str
    contact: Optional[str] = None
    vin: Optional[str] = None
    car_model: Optional[str] = None
    problem: str
    status: str  # new | resolved
    review_token: Optional[str] = None
    created_at: str
    resolved_at: Optional[str] = None


class ReviewCreate(BaseModel):
    token: str
    rating: int = Field(..., ge=1, le=5)
    text: str = Field(..., min_length=3, max_length=400)


class ReviewOut(BaseModel):
    id: str
    name: str
    rating: int
    text: str
    color: str
    created_at: str


# --- Public endpoints ---
@api_router.get("/")
async def root():
    return {"message": "Autoland 07 API", "ok": True}


@api_router.get("/settings", response_model=Settings)
async def get_settings():
    doc = await db.settings.find_one({"_id": "main"}, {"_id": 0})
    if not doc:
        defaults = Settings().model_dump()
        await db.settings.insert_one({"_id": "main", **defaults})
        return Settings(**defaults)
    return Settings(**doc)


@api_router.post("/inquiries", response_model=InquiryOut)
async def create_inquiry(payload: InquiryCreate):
    now = datetime.now(timezone.utc)
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "contact": (payload.contact or "").strip() or None,
        "vin": (payload.vin or "").strip().upper() or None,
        "car_model": (payload.car_model or "").strip() or None,
        "problem": payload.problem.strip(),
        "status": "new",
        "review_token": None,
        "created_at": now.isoformat(),
        "resolved_at": None,
    }
    await db.inquiries.insert_one(doc)
    return InquiryOut(**{k: v for k, v in doc.items() if k != "_id"})


@api_router.get("/reviews", response_model=List[ReviewOut])
async def list_reviews():
    docs = await db.reviews.find({"approved": True}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [ReviewOut(**d) for d in docs]


@api_router.get("/reviews/check/{token}")
async def check_review_token(token: str):
    inquiry = await db.inquiries.find_one({"review_token": token}, {"_id": 0})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Link invalid sau expirat")
    existing = await db.reviews.find_one({"inquiry_id": inquiry["id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Recenzia a fost deja trimisă")
    return {"name": inquiry["name"], "ok": True}


@api_router.post("/reviews", response_model=ReviewOut)
async def submit_review(payload: ReviewCreate):
    inquiry = await db.inquiries.find_one({"review_token": payload.token}, {"_id": 0})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Link invalid sau expirat")
    existing = await db.reviews.find_one({"inquiry_id": inquiry["id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Recenzia a fost deja trimisă")
    palette = ["yellow", "pink", "cyan", "green"]
    color = palette[secrets.randbelow(len(palette))]
    now = datetime.now(timezone.utc)
    doc = {
        "id": str(uuid.uuid4()),
        "inquiry_id": inquiry["id"],
        "name": inquiry["name"],
        "rating": payload.rating,
        "text": payload.text.strip(),
        "color": color,
        "approved": True,
        "created_at": now.isoformat(),
    }
    await db.reviews.insert_one(doc)
    return ReviewOut(**{k: doc[k] for k in ("id", "name", "rating", "text", "color", "created_at")})


# --- Auth endpoints ---
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email sau parolă greșită")
    token = create_access_token(user["id"], user["email"])
    safe_user = {k: v for k, v in user.items() if k not in ("_id", "password_hash")}
    return LoginResponse(access_token=token, user=safe_user)


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# --- Admin endpoints ---
@api_router.put("/admin/settings", response_model=Settings)
async def update_settings(payload: SettingsUpdate, user: dict = Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "status" in update and update["status"] not in ("open", "break", "closed"):
        raise HTTPException(status_code=400, detail="Status invalid")
    await db.settings.update_one({"_id": "main"}, {"$set": update}, upsert=True)
    doc = await db.settings.find_one({"_id": "main"}, {"_id": 0})
    return Settings(**doc)


@api_router.get("/admin/inquiries", response_model=List[InquiryOut])
async def list_inquiries(user: dict = Depends(get_current_user)):
    docs = await db.inquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [InquiryOut(**d) for d in docs]


@api_router.get("/admin/inquiries/stats")
async def inquiries_stats(user: dict = Depends(get_current_user)):
    new_count = await db.inquiries.count_documents({"status": "new"})
    total = await db.inquiries.count_documents({})
    return {"new": new_count, "total": total}


@api_router.post("/admin/inquiries/{inquiry_id}/resolve", response_model=InquiryOut)
async def resolve_inquiry(inquiry_id: str, user: dict = Depends(get_current_user)):
    inquiry = await db.inquiries.find_one({"id": inquiry_id}, {"_id": 0})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Cererea nu există")
    review_token = inquiry.get("review_token") or secrets.token_urlsafe(16)
    await db.inquiries.update_one(
        {"id": inquiry_id},
        {"$set": {
            "status": "resolved",
            "resolved_at": datetime.now(timezone.utc).isoformat(),
            "review_token": review_token,
        }},
    )
    doc = await db.inquiries.find_one({"id": inquiry_id}, {"_id": 0})
    return InquiryOut(**doc)


@api_router.delete("/admin/inquiries/{inquiry_id}")
async def delete_inquiry(inquiry_id: str, user: dict = Depends(get_current_user)):
    res = await db.inquiries.delete_one({"id": inquiry_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cererea nu există")
    return {"ok": True}


@api_router.delete("/admin/reviews/{review_id}")
async def delete_review(review_id: str, user: dict = Depends(get_current_user)):
    res = await db.reviews.delete_one({"id": review_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Recenzia nu există")
    return {"ok": True}


@api_router.get("/admin/reviews", response_model=List[ReviewOut])
async def admin_list_reviews(user: dict = Depends(get_current_user)):
    docs = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [ReviewOut(**{k: d[k] for k in ("id", "name", "rating", "text", "color", "created_at")}) for d in docs]


# --- Startup ---
async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Mihai Ipate",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )
        logger.info(f"Admin password updated: {admin_email}")


async def ensure_settings():
    if not await db.settings.find_one({"_id": "main"}):
        await db.settings.insert_one({"_id": "main", **Settings().model_dump()})


@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.inquiries.create_index("created_at")
    await db.reviews.create_index("created_at")
    await seed_admin()
    await ensure_settings()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
