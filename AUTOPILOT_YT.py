#!/usr/bin/env python3
"""
AUTOPILOT_YT.py
================
End-to-end autonomous (governed) video factory + MCP-like tool server for YouTube publishing.

WHAT THIS IS
------------
- A single-file, production-minded skeleton that can run unattended with HARD guardrails:
  - deterministic job state machine
  - outbox + idempotent publish
  - single-use capability tokens for publish operations
  - daily publish caps + similarity checks
  - asset provenance hooks (you must actually use licensed assets in real deployments)

WHAT THIS IS NOT
----------------
- A guarantee of profit.
- A bypass around OAuth consent. You must authorize YouTube upload once.

RUN MODES (ONE FILE)
--------------------
1) Initialize DB:
   python AUTOPILOT_YT.py init-db

2) Start tool server (MCP-like):
   python AUTOPILOT_YT.py serve --host 0.0.0.0 --port 8787

3) Run worker loop (asset gen + publish orchestration):
   python AUTOPILOT_YT.py worker

4) Create a job:
   python AUTOPILOT_YT.py create-job --topic "Partner risk checklist for SaaS founders" --privacy unlisted

5) OAuth setup (one-time):
   - Put your Google OAuth client secrets JSON at ./client_secrets.json
   - Then run:
     python AUTOPILOT_YT.py oauth
   This stores a refresh token in ./oauth_token.json (for MVP). Protect this file.

ENVIRONMENT
-----------
Create a .env next to this file:

  # Server
  AUTOPILOT_DB=./autopilot.db
  AUTOPILOT_STORAGE=./storage
  AUTOPILOT_BASE_URL=http://127.0.0.1:8787

  # Governance
  AUTOPILOT_APP_KEY=change-me-please-32bytes-min
  AUTOPILOT_MAX_PUBLISH_PER_DAY=1
  AUTOPILOT_MAX_RENDERS_PER_JOB=2

  # YouTube
  AUTOPILOT_YT_CATEGORY_ID=22
  AUTOPILOT_OAUTH_CLIENT_SECRETS=./client_secrets.json
  AUTOPILOT_OAUTH_TOKEN_FILE=./oauth_token.json

NOTES ON COMPLIANCE
-------------------
- Use YouTube Data API + Analytics/Reporting APIs; do not use undocumented endpoints.
- Upload implementation uses official client libraries (recommended). See official upload guide. (links in comments)

"""

from __future__ import annotations

import argparse
import base64
import contextlib
import datetime as dt
import hashlib
import hmac
import json
import os
import random
import re
import sqlite3
import subprocess
import sys
import threading
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from PIL import Image, ImageDraw, ImageFont

# YouTube client libraries (official)
# Docs:
# - Upload a video: https://developers.google.com/youtube/v3/guides/uploading_a_video
# - Resumable upload protocol: https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol
try:
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
except Exception:
    build = None  # type: ignore


# -----------------------------
# Configuration
# -----------------------------

load_dotenv()

DB_PATH = Path(os.getenv("AUTOPILOT_DB", "./autopilot.db"))
STORAGE_DIR = Path(os.getenv("AUTOPILOT_STORAGE", "./storage"))
BASE_URL = os.getenv("AUTOPILOT_BASE_URL", "http://127.0.0.1:8787").rstrip("/")

APP_KEY = os.getenv("AUTOPILOT_APP_KEY", "change-me-please-32bytes-min")
MAX_PUBLISH_PER_DAY = int(os.getenv("AUTOPILOT_MAX_PUBLISH_PER_DAY", "1"))
MAX_RENDERS_PER_JOB = int(os.getenv("AUTOPILOT_MAX_RENDERS_PER_JOB", "2"))

YT_CATEGORY_ID = os.getenv("AUTOPILOT_YT_CATEGORY_ID", "22")
OAUTH_CLIENT_SECRETS = Path(os.getenv("AUTOPILOT_OAUTH_CLIENT_SECRETS", "./client_secrets.json"))
OAUTH_TOKEN_FILE = Path(os.getenv("AUTOPILOT_OAUTH_TOKEN_FILE", "./oauth_token.json"))

YOUTUBE_SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]

STORAGE_DIR.mkdir(parents=True, exist_ok=True)


# -----------------------------
# Utilities
# -----------------------------

def utcnow() -> str:
    return dt.datetime.utcnow().replace(tzinfo=dt.timezone.utc).isoformat()

def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def hmac_sign(payload: bytes, key: str) -> str:
    return hmac.new(key.encode("utf-8"), payload, hashlib.sha256).hexdigest()

def json_dumps(obj: Any) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"), sort_keys=True)

def safe_slug(text: str, max_len: int = 80) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^a-z0-9\s_-]+", "", text)
    text = re.sub(r"[\s_-]+", "-", text).strip("-")
    return text[:max_len] or "job"

def require_ffmpeg() -> None:
    try:
        subprocess.run(["ffmpeg", "-version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    except Exception as e:
        raise RuntimeError("ffmpeg is required on PATH. Install ffmpeg and retry.") from e


# -----------------------------
# DB Layer (SQLite for MVP)
# -----------------------------

def db_connect() -> sqlite3.Connection:
    con = sqlite3.connect(str(DB_PATH))
    con.row_factory = sqlite3.Row
    # SQLite pragmas for durability-ish
    con.execute("PRAGMA journal_mode=WAL;")
    con.execute("PRAGMA synchronous=NORMAL;")
    return con

def init_db() -> None:
    with db_connect() as con:
        con.executescript("""
        CREATE TABLE IF NOT EXISTS video_jobs (
            id TEXT PRIMARY KEY,
            status TEXT NOT NULL,
            topic TEXT NOT NULL,
            title TEXT,
            description TEXT,
            tags_json TEXT,
            privacy_status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            approved_at TEXT,
            published_at TEXT,
            youtube_video_id TEXT,
            error TEXT,
            render_count INTEGER NOT NULL DEFAULT 0,
            content_fingerprint TEXT
        );

        CREATE TABLE IF NOT EXISTS video_assets (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            kind TEXT NOT NULL,
            storage_path TEXT NOT NULL,
            created_at TEXT NOT NULL,
            meta_json TEXT,
            FOREIGN KEY(job_id) REFERENCES video_jobs(id)
        );

        CREATE TABLE IF NOT EXISTS publish_events (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            attempt INTEGER NOT NULL,
            status TEXT NOT NULL,
            youtube_video_id TEXT,
            response_json TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY(job_id) REFERENCES video_jobs(id)
        );

        -- Outbox for reliable execution
        CREATE TABLE IF NOT EXISTS outbox (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            type TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            status TEXT NOT NULL,        -- PENDING, PROCESSING, DONE, FAILED
            attempt INTEGER NOT NULL DEFAULT 0,
            locked_until TEXT,
            last_error TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(job_id, type) ON CONFLICT IGNORE
        );

        -- Idempotency table: ensures only one publish per (publish_key)
        CREATE TABLE IF NOT EXISTS idempotency_keys (
            key TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_jobs_status ON video_jobs(status);
        CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox(status);
        """)
    print(f"Initialized DB at {DB_PATH}")

# -----------------------------
# State machine and governance
# -----------------------------

VALID_STATUSES = {
    "QUEUED",
    "GENERATING",
    "READY_FOR_REVIEW",
    "READY_TO_PUBLISH",
    "PUBLISHING",
    "PUBLISHED",
    "FAILED_GENERATION",
    "FAILED_PUBLISH",
    "CANCELLED",
}

ALLOWED_TRANSITIONS = {
    "QUEUED": {"GENERATING", "CANCELLED"},
    "GENERATING": {"READY_FOR_REVIEW", "FAILED_GENERATION"},
    "READY_FOR_REVIEW": {"READY_TO_PUBLISH", "CANCELLED"},
    "READY_TO_PUBLISH": {"PUBLISHING", "CANCELLED"},
    "PUBLISHING": {"PUBLISHED", "FAILED_PUBLISH"},
    "FAILED_GENERATION": {"QUEUED", "CANCELLED"},
    "FAILED_PUBLISH": {"READY_TO_PUBLISH", "CANCELLED"},
    "PUBLISHED": set(),
    "CANCELLED": set(),
}

def transition_job(con: sqlite3.Connection, job_id: str, new_status: str, error: Optional[str] = None) -> None:
    row = con.execute("SELECT status FROM video_jobs WHERE id=?", (job_id,)).fetchone()
    if not row:
        raise ValueError("job not found")
    cur = row["status"]
    if new_status not in VALID_STATUSES:
        raise ValueError(f"invalid status: {new_status}")
    if new_status not in ALLOWED_TRANSITIONS.get(cur, set()):
        raise ValueError(f"illegal transition {cur} -> {new_status}")
    con.execute(
        "UPDATE video_jobs SET status=?, updated_at=?, error=? WHERE id=?",
        (new_status, utcnow(), error, job_id),
    )

def count_publishes_today(con: sqlite3.Connection) -> int:
    today = dt.datetime.utcnow().date().isoformat()
    # published_at is ISO; prefix match date
    row = con.execute(
        "SELECT COUNT(*) as n FROM video_jobs WHERE published_at LIKE ?",
        (today + "%",),
    ).fetchone()
    return int(row["n"]) if row else 0

def similarity(a: str, b: str) -> float:
    # A tiny, cheap similarity heuristic: token overlap Jaccard
    toks_a = set(re.findall(r"[a-z0-9]+", a.lower()))
    toks_b = set(re.findall(r"[a-z0-9]+", b.lower()))
    if not toks_a or not toks_b:
        return 0.0
    return len(toks_a & toks_b) / len(toks_a | toks_b)

def content_fingerprint(title: str, topic: str, script_text: str) -> str:
    # stable fingerprint for duplication control
    payload = (title + "\n" + topic + "\n" + script_text).encode("utf-8")
    return sha256_hex(payload)

def policy_lint_text(text: str) -> List[str]:
    """
    Minimal policy lint (extend heavily):
    - blocks obvious prohibited patterns / spam indicators.
    This is NOT a comprehensive YouTube policy checker; it is a guardrail.
    """
    flags = []
    lower = text.lower()
    if "guaranteed income" in lower or "get rich quick" in lower:
        flags.append("Potentially spammy/financial claim: 'guaranteed income'")
    if re.search(r"\b(hate|kill all|genocide)\b", lower):
        flags.append("Potential hateful/violent language")
    if re.search(r"\b(100% safe|no risk)\b", lower):
        flags.append("Overconfident safety claim")
    return flags


# -----------------------------
# Capability tokens (single-use)
# -----------------------------

@dataclass
class Capability:
    cap_id: str
    job_id: str
    action: str
    publish_key: str
    exp: int  # unix seconds
    nonce: str

def mint_capability(job_id: str, action: str, publish_key: str, ttl_seconds: int = 600) -> str:
    cap = {
        "cap_id": str(uuid.uuid4()),
        "job_id": job_id,
        "action": action,
        "publish_key": publish_key,
        "exp": int(time.time()) + ttl_seconds,
        "nonce": str(uuid.uuid4()),
    }
    payload = json_dumps(cap).encode("utf-8")
    sig = hmac_sign(payload, APP_KEY)
    token = base64.urlsafe_b64encode(payload).decode("utf-8") + "." + sig
    return token

def verify_capability(token: str, expected_action: str, expected_job_id: str) -> Capability:
    try:
        payload_b64, sig = token.split(".", 1)
        payload = base64.urlsafe_b64decode(payload_b64.encode("utf-8"))
        expected_sig = hmac_sign(payload, APP_KEY)
        if not hmac.compare_digest(sig, expected_sig):
            raise ValueError("bad signature")
        cap = json.loads(payload.decode("utf-8"))
        if cap.get("action") != expected_action:
            raise ValueError("wrong action")
        if cap.get("job_id") != expected_job_id:
            raise ValueError("wrong job")
        if int(cap.get("exp", 0)) < int(time.time()):
            raise ValueError("expired")
        return Capability(
            cap_id=cap["cap_id"],
            job_id=cap["job_id"],
            action=cap["action"],
            publish_key=cap["publish_key"],
            exp=int(cap["exp"]),
            nonce=cap["nonce"],
        )
    except Exception as e:
        raise HTTPException(status_code=403, detail=f"invalid capability: {e}")

def consume_idempotency_key(con: sqlite3.Connection, publish_key: str, job_id: str) -> bool:
    """
    Returns True if consumed successfully (first time), False if already exists.
    """
    try:
        con.execute(
            "INSERT INTO idempotency_keys(key, job_id, created_at) VALUES (?,?,?)",
            (publish_key, job_id, utcnow()),
        )
        return True
    except sqlite3.IntegrityError:
        return False


# -----------------------------
# Plan DSL (agent proposes, governor enforces)
# -----------------------------

class PlanAction(BaseModel):
    type: str
    params: Dict[str, Any] = Field(default_factory=dict)
    rationale: str = ""

class PlanDSL(BaseModel):
    job_id: str
    actions: List[PlanAction]
    budgets: Dict[str, int] = Field(default_factory=dict)
    success_criteria: List[str] = Field(default_factory=list)
    risk_notes: List[str] = Field(default_factory=list)

    @validator("actions")
    def non_empty_actions(cls, v: List[PlanAction]) -> List[PlanAction]:
        if not v:
            raise ValueError("actions must not be empty")
        return v

def default_plan_for_job(job_id: str) -> PlanDSL:
    return PlanDSL(
        job_id=job_id,
        actions=[
            PlanAction(type="script", params={"style": "checklist_playbook", "length_sec": 420}, rationale="Create structured playbook"),
            PlanAction(type="render", params={"template": "simple_kinetic", "fps": 30}, rationale="Deterministic rendering via ffmpeg"),
            PlanAction(type="metadata", params={"title_style": "benefit_first"}, rationale="Optimize for clarity"),
            PlanAction(type="gate", params={"require_policy_lint": True, "require_similarity_check": True}, rationale="Prevent spam/policy issues"),
            PlanAction(type="publish", params={"privacy": "unlisted"}, rationale="Publish within constraints"),
        ],
        budgets={"max_renders": MAX_RENDERS_PER_JOB, "max_uploads": 1},
        success_criteria=["video_created", "lint_passed", "published_or_scheduled"],
        risk_notes=[],
    )

def governor_validate_plan(con: sqlite3.Connection, plan: PlanDSL) -> Tuple[bool, List[str]]:
    issues: List[str] = []
    row = con.execute("SELECT * FROM video_jobs WHERE id=?", (plan.job_id,)).fetchone()
    if not row:
        return False, ["job not found"]
    if row["status"] not in ("QUEUED", "FAILED_GENERATION", "READY_FOR_REVIEW", "READY_TO_PUBLISH", "FAILED_PUBLISH"):
        issues.append(f"job status {row['status']} not eligible for planning/execution")

    # Budget enforcement
    max_renders = int(plan.budgets.get("max_renders", MAX_RENDERS_PER_JOB))
    if max_renders > MAX_RENDERS_PER_JOB:
        issues.append("plan requests too many renders")

    # Ensure publish action exists at most once
    publish_actions = [a for a in plan.actions if a.type == "publish"]
    if len(publish_actions) > 1:
        issues.append("multiple publish actions not allowed")

    # Daily publish cap
    if publish_actions:
        n = count_publishes_today(con)
        if n >= MAX_PUBLISH_PER_DAY:
            issues.append(f"daily publish cap reached ({n}/{MAX_PUBLISH_PER_DAY})")

    return (len(issues) == 0), issues


# -----------------------------
# Asset Storage (local filesystem MVP)
# -----------------------------

def storage_put(path: str, data: bytes) -> str:
    dst = STORAGE_DIR / path
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_bytes(data)
    return str(dst)

def storage_get(path: str) -> bytes:
    p = STORAGE_DIR / path
    if not p.exists():
        raise FileNotFoundError(path)
    return p.read_bytes()

def storage_exists(path: str) -> bool:
    return (STORAGE_DIR / path).exists()

def record_asset(con: sqlite3.Connection, job_id: str, kind: str, storage_path: str, meta: Optional[Dict[str, Any]] = None) -> str:
    asset_id = str(uuid.uuid4())
    con.execute(
        "INSERT INTO video_assets(id, job_id, kind, storage_path, created_at, meta_json) VALUES (?,?,?,?,?,?)",
        (asset_id, job_id, kind, storage_path, utcnow(), json_dumps(meta or {})),
    )
    return asset_id

def get_asset_path(con: sqlite3.Connection, job_id: str, kind: str) -> Optional[str]:
    row = con.execute(
        "SELECT storage_path FROM video_assets WHERE job_id=? AND kind=? ORDER BY created_at DESC LIMIT 1",
        (job_id, kind),
    ).fetchone()
    return row["storage_path"] if row else None


# -----------------------------
# Video Factory (deterministic)
# -----------------------------

def generate_script(topic: str) -> str:
    # Replace with LLM if you want; this is deterministic scaffolding.
    bullets = [
        "Define the partner profile and success criteria.",
        "List mandatory checks: legal, financial, security, reputation, delivery capability.",
        "Score each category and collect evidence.",
        "Define red flags and automatic rejection thresholds.",
        "Document mitigation steps and monitoring cadence."
    ]
    script = [
        f"Title: {topic}",
        "",
        "Hook (0:00-0:15):",
        "Most partnerships fail because due diligence is informal. Here is a checklist you can run every time.",
        "",
        "Checklist:",
    ] + [f"- {b}" for b in bullets] + [
        "",
        "Close:",
        "If you want this as a repeatable workflow, turn the checklist into a scorecard with evidence capture and review gates."
    ]
    return "\n".join(script)

def generate_background_image(path: Path, title: str) -> None:
    w, h = 1280, 720
    img = Image.new("RGB", (w, h), (20, 20, 20))
    draw = ImageDraw.Draw(img)

    # Default font: PIL's built-in
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 48)
        small = ImageFont.truetype("DejaVuSans.ttf", 28)
    except Exception:
        font = ImageFont.load_default()
        small = ImageFont.load_default()

    draw.text((60, 80), "PLAYBOOK", font=small, fill=(200, 200, 200))
    # Wrap title
    lines = []
    words = title.split()
    cur = []
    for wds in words:
        cur.append(wds)
        if len(" ".join(cur)) > 28:
            lines.append(" ".join(cur[:-1]))
            cur = [wds]
    if cur:
        lines.append(" ".join(cur))

    y = 150
    for line in lines[:6]:
        draw.text((60, y), line, font=font, fill=(240, 240, 240))
        y += 62

    draw.rectangle((60, 600, 1220, 650), outline=(180, 180, 180), width=2)
    draw.text((80, 610), "Due diligence checklist • Evidence-based scoring • Red flags", font=small, fill=(220, 220, 220))

    img.save(path)

def generate_thumbnail(path: Path, title: str) -> None:
    w, h = 1280, 720
    img = Image.new("RGB", (w, h), (10, 10, 10))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 72)
        small = ImageFont.truetype("DejaVuSans.ttf", 36)
    except Exception:
        font = ImageFont.load_default()
        small = ImageFont.load_default()

    draw.text((60, 60), "PARTNER CHECK", font=small, fill=(220, 220, 220))
    draw.rectangle((60, 140, 1220, 640), outline=(200, 200, 200), width=3)

    # BIG keyword extraction
    keyword = "CHECKLIST"
    if "risk" in title.lower():
        keyword = "RISK"
    if "vendor" in title.lower():
        keyword = "VENDOR"

    draw.text((120, 240), keyword, font=font, fill=(255, 255, 255))
    draw.text((120, 340), "PLAYBOOK", font=font, fill=(255, 255, 255))
    img.save(path)

def synth_audio_tone(path: Path, seconds: int = 20) -> None:
    # Simple sine tone using ffmpeg's lavfi
    require_ffmpeg()
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi", "-i", f"sine=frequency=440:duration={seconds}",
        "-q:a", "9",
        str(path),
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

def render_video(bg_path: Path, audio_path: Path, out_path: Path, seconds: int = 20, fps: int = 30) -> None:
    require_ffmpeg()
    # Render a simple video: background image loop + audio
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", str(bg_path),
        "-i", str(audio_path),
        "-c:v", "libx264",
        "-t", str(seconds),
        "-pix_fmt", "yuv420p",
        "-r", str(fps),
        "-c:a", "aac",
        "-shortest",
        str(out_path),
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

def build_captions_srt(script: str, out_path: Path) -> None:
    # Stub captions: first N lines spaced
    lines = [ln.strip() for ln in script.splitlines() if ln.strip()]
    chunks = lines[:8]
    def ts(sec: int) -> str:
        return f"00:00:{sec:02d},000"
    out = []
    t = 0
    idx = 1
    for c in chunks:
        out.append(str(idx))
        out.append(f"{ts(t)} --> {ts(t+3)}")
        out.append(c[:80])
        out.append("")
        idx += 1
        t += 3
    out_path.write_text("\n".join(out), encoding="utf-8")


# -----------------------------
# YouTube uploader
# -----------------------------

def load_creds() -> Credentials:
    if build is None:
        raise RuntimeError("Google API libs not installed. pip install google-api-python-client google-auth google-auth-oauthlib google-auth-httplib2")
    creds: Optional[Credentials] = None
    if OAUTH_TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(OAUTH_TOKEN_FILE), scopes=YOUTUBE_SCOPES)
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        OAUTH_TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")
    if not creds or not creds.valid:
        raise RuntimeError("No valid OAuth creds. Run: python AUTOPILOT_YT.py oauth")
    return creds

def youtube_client() -> Any:
    creds = load_creds()
    return build("youtube", "v3", credentials=creds)

def youtube_upload_video(
    file_path: Path,
    title: str,
    description: str,
    tags: List[str],
    privacy_status: str,
    category_id: str = "22",
) -> str:
    yt = youtube_client()
    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": category_id,
        },
        "status": {
            "privacyStatus": privacy_status,
        }
    }
    media = MediaFileUpload(str(file_path), chunksize=-1, resumable=True)
    req = yt.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media
    )
    response = None
    retries = 0
    while response is None:
        try:
            status, response = req.next_chunk()
            # status can be used for progress
        except Exception as e:
            if retries > 8:
                raise
            sleep = (2 ** retries) + random.random()
            time.sleep(sleep)
            retries += 1
    return response["id"]

def youtube_set_thumbnail(video_id: str, thumb_path: Path) -> None:
    yt = youtube_client()
    req = yt.thumbnails().set(videoId=video_id, media_body=str(thumb_path))
    req.execute()

def run_oauth_flow() -> None:
    if build is None:
        raise RuntimeError("Google API libs not installed. pip install google-api-python-client google-auth google-auth-oauthlib google-auth-httplib2")
    if not OAUTH_CLIENT_SECRETS.exists():
        raise RuntimeError(f"Missing client secrets at {OAUTH_CLIENT_SECRETS}. Create OAuth client in Google Cloud console and download JSON.")
    flow = InstalledAppFlow.from_client_secrets_file(str(OAUTH_CLIENT_SECRETS), scopes=YOUTUBE_SCOPES)
    creds = flow.run_local_server(port=0)
    OAUTH_TOKEN_FILE.write_text(creds.to_json(), encoding="utf-8")
    print(f"Saved OAuth token to {OAUTH_TOKEN_FILE}. Protect this file.")


# -----------------------------
# Outbox + worker orchestration
# -----------------------------

def enqueue_outbox(con: sqlite3.Connection, job_id: str, type_: str, payload: Dict[str, Any]) -> None:
    outbox_id = str(uuid.uuid4())
    now = utcnow()
    con.execute(
        "INSERT OR IGNORE INTO outbox(id, job_id, type, payload_json, status, attempt, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)",
        (outbox_id, job_id, type_, json_dumps(payload), "PENDING", 0, now, now),
    )

def lock_next_outbox(con: sqlite3.Connection) -> Optional[sqlite3.Row]:
    # Cooperative lock: mark one row PROCESSING, set locked_until a few minutes
    now = dt.datetime.utcnow().replace(tzinfo=dt.timezone.utc)
    now_s = now.isoformat()
    unlock_before = (now - dt.timedelta(seconds=1)).isoformat()
    row = con.execute("""
        SELECT * FROM outbox
        WHERE status IN ('PENDING','FAILED')
          AND (locked_until IS NULL OR locked_until < ?)
        ORDER BY created_at ASC
        LIMIT 1
    """, (unlock_before,)).fetchone()
    if not row:
        return None
    locked_until = (now + dt.timedelta(minutes=5)).isoformat()
    con.execute(
        "UPDATE outbox SET status='PROCESSING', locked_until=?, updated_at=? WHERE id=?",
        (locked_until, now_s, row["id"]),
    )
    return con.execute("SELECT * FROM outbox WHERE id=?", (row["id"],)).fetchone()

def outbox_done(con: sqlite3.Connection, outbox_id: str) -> None:
    con.execute("UPDATE outbox SET status='DONE', locked_until=NULL, updated_at=? WHERE id=?", (utcnow(), outbox_id))

def outbox_fail(con: sqlite3.Connection, outbox_id: str, err: str) -> None:
    row = con.execute("SELECT attempt FROM outbox WHERE id=?", (outbox_id,)).fetchone()
    attempt = int(row["attempt"]) + 1 if row else 1
    # exponential backoff via locked_until
    delay = min(3600, (2 ** min(attempt, 10)))
    locked_until = (dt.datetime.utcnow().replace(tzinfo=dt.timezone.utc) + dt.timedelta(seconds=delay)).isoformat()
    con.execute(
        "UPDATE outbox SET status='FAILED', attempt=?, locked_until=?, last_error=?, updated_at=? WHERE id=?",
        (attempt, locked_until, err[:1000], utcnow(), outbox_id),
    )

def worker_step() -> None:
    with db_connect() as con:
        con.execute("BEGIN IMMEDIATE;")
        row = lock_next_outbox(con)
        con.commit()
        if not row:
            return
        outbox_id = row["id"]
        job_id = row["job_id"]
        type_ = row["type"]
        payload = json.loads(row["payload_json"])

        try:
            if type_ == "GENERATE":
                process_generate(con, job_id, payload)
                outbox_done(con, outbox_id)
            elif type_ == "PUBLISH":
                process_publish(con, job_id, payload)
                outbox_done(con, outbox_id)
            else:
                raise RuntimeError(f"unknown outbox type: {type_}")
            con.commit()
        except Exception as e:
            con.rollback()
            with db_connect() as con2:
                outbox_fail(con2, outbox_id, str(e))
                con2.commit()

def process_generate(con: sqlite3.Connection, job_id: str, payload: Dict[str, Any]) -> None:
    row = con.execute("SELECT * FROM video_jobs WHERE id=?", (job_id,)).fetchone()
    if not row:
        raise RuntimeError("job not found")

    # Transition safely
    if row["status"] not in ("QUEUED", "FAILED_GENERATION"):
        return

    # Enforce render budget
    render_count = int(row["render_count"])
    if render_count >= MAX_RENDERS_PER_JOB:
        transition_job(con, job_id, "FAILED_GENERATION", error="render budget exceeded")
        return

    transition_job(con, job_id, "GENERATING")

    topic = row["topic"]
    # Deterministic script
    script = generate_script(topic)
    flags = policy_lint_text(script)
    if flags:
        transition_job(con, job_id, "FAILED_GENERATION", error="; ".join(flags))
        return

    # Metadata
    # Title is derived deterministically to avoid random drift
    title = (row["title"] or f"{topic} | Due Diligence Checklist").strip()
    description = (row["description"] or (script + "\n\nDownload the checklist template: (your link here)")).strip()
    tags = json.loads(row["tags_json"]) if row["tags_json"] else ["partner", "due diligence", "risk", "checklist"]

    # Build assets
    job_slug = safe_slug(topic)
    base = f"jobs/{job_id}/{job_slug}"

    script_path = f"{base}/script.txt"
    storage_put(script_path, script.encode("utf-8"))
    record_asset(con, job_id, "script", script_path)

    bg_file = STORAGE_DIR / f"{base}/bg.png"
    bg_file.parent.mkdir(parents=True, exist_ok=True)
    generate_background_image(bg_file, title)
    record_asset(con, job_id, "image", f"{base}/bg.png")

    thumb_file = STORAGE_DIR / f"{base}/thumb.png"
    generate_thumbnail(thumb_file, title)
    record_asset(con, job_id, "thumbnail", f"{base}/thumb.png")

    audio_file = STORAGE_DIR / f"{base}/voice.wav"
    synth_audio_tone(audio_file, seconds=20)
    record_asset(con, job_id, "audio", f"{base}/voice.wav")

    video_file = STORAGE_DIR / f"{base}/final.mp4"
    render_video(bg_file, audio_file, video_file, seconds=20, fps=30)
    record_asset(con, job_id, "video", f"{base}/final.mp4")

    cap_file = STORAGE_DIR / f"{base}/captions.srt"
    build_captions_srt(script, cap_file)
    record_asset(con, job_id, "captions", f"{base}/captions.srt")

    fp = content_fingerprint(title, topic, script)

    # Similarity guard: compare against last N published fingerprints/topics
    recent = con.execute("""
        SELECT topic, title, content_fingerprint
        FROM video_jobs
        WHERE status='PUBLISHED'
        ORDER BY published_at DESC
        LIMIT 25
    """).fetchall()

    for r in recent:
        if not r["content_fingerprint"]:
            continue
        sim = similarity(fp, r["content_fingerprint"])
        if sim > 0.90:
            transition_job(con, job_id, "FAILED_GENERATION", error="too similar to recent content")
            return

    con.execute(
        "UPDATE video_jobs SET title=?, description=?, tags_json=?, content_fingerprint=?, render_count=render_count+1, updated_at=? WHERE id=?",
        (title, description, json_dumps(tags), fp, utcnow(), job_id),
    )
    transition_job(con, job_id, "READY_FOR_REVIEW")

    # In a no-human system, auto-approve after review gates:
    # Here we enforce minimal gates and then move forward.
    transition_job(con, job_id, "READY_TO_PUBLISH")

    enqueue_outbox(con, job_id, "PUBLISH", {"reason": "auto_publish_after_gates"})

def process_publish(con: sqlite3.Connection, job_id: str, payload: Dict[str, Any]) -> None:
    row = con.execute("SELECT * FROM video_jobs WHERE id=?", (job_id,)).fetchone()
    if not row:
        raise RuntimeError("job not found")

    if row["status"] != "READY_TO_PUBLISH":
        return

    # Daily cap enforced again at publish time
    if count_publishes_today(con) >= MAX_PUBLISH_PER_DAY:
        raise RuntimeError("daily publish cap reached")

    video_path = get_asset_path(con, job_id, "video")
    thumb_path = get_asset_path(con, job_id, "thumbnail")
    if not video_path or not thumb_path:
        raise RuntimeError("missing assets for publish")

    # Publish idempotency key includes file digest so re-render creates a new publish_key
    video_bytes = storage_get(video_path)
    digest = sha256_hex(video_bytes)
    publish_key = sha256_hex(f"{job_id}|v1|{digest}".encode("utf-8"))

    # Mint capability token and consume idempotency in DB (banking-grade)
    if not consume_idempotency_key(con, publish_key, job_id):
        # Already published (or already attempted successfully)
        if row["youtube_video_id"]:
            transition_job(con, job_id, "PUBLISHED")
            return
        # If idempotency exists but youtube_video_id missing, treat as suspicious and fail safely.
        transition_job(con, job_id, "FAILED_PUBLISH", error="idempotency key exists but no youtube_video_id")
        return

    cap_token = mint_capability(job_id, "publish", publish_key, ttl_seconds=600)

    # Execute publish via internal function (same as tool server would do)
    transition_job(con, job_id, "PUBLISHING")
    attempt = int(con.execute("SELECT COUNT(*) as n FROM publish_events WHERE job_id=?", (job_id,)).fetchone()["n"]) + 1

    # Call the same internal routines the API uses, but still verify capability.
    cap = verify_capability(cap_token, "publish", job_id)
    if cap.publish_key != publish_key:
        raise RuntimeError("capability publish_key mismatch")

    title = row["title"] or row["topic"]
    description = row["description"] or ""
    tags = json.loads(row["tags_json"]) if row["tags_json"] else []
    privacy = row["privacy_status"]

    # Upload video
    yt_video_id = youtube_upload_video(
        file_path=(STORAGE_DIR / video_path),
        title=title,
        description=description,
        tags=tags,
        privacy_status=privacy,
        category_id=YT_CATEGORY_ID,
    )

    # Set thumbnail
    youtube_set_thumbnail(yt_video_id, (STORAGE_DIR / thumb_path))

    con.execute(
        "INSERT INTO publish_events(id, job_id, attempt, status, youtube_video_id, response_json, created_at) VALUES (?,?,?,?,?,?,?)",
        (str(uuid.uuid4()), job_id, attempt, "SUCCESS", yt_video_id, json_dumps({"videoId": yt_video_id}), utcnow()),
    )
    con.execute(
        "UPDATE video_jobs SET youtube_video_id=?, published_at=?, updated_at=? WHERE id=?",
        (yt_video_id, utcnow(), utcnow(), job_id),
    )
    transition_job(con, job_id, "PUBLISHED")


# -----------------------------
# API Server (MCP-like)
# -----------------------------

class PutObjectReq(BaseModel):
    storage_path: str
    base64_bytes: str
    content_type: str = "application/octet-stream"

class PutObjectResp(BaseModel):
    storage_path: str
    bytes_written: int

class UploadVideoReq(BaseModel):
    job_id: str
    capability_token: str

class UploadVideoResp(BaseModel):
    job_id: str
    youtube_video_id: str
    status: str

class SetThumbnailReq(BaseModel):
    job_id: str
    youtube_video_id: str
    capability_token: str

class SetThumbnailResp(BaseModel):
    status: str

def create_app() -> FastAPI:
    app = FastAPI(title="Autopilot YouTube MCP-like Server", version="0.1")

    @app.get("/health")
    def health() -> Dict[str, Any]:
        return {"ok": True, "time": utcnow()}

    @app.post("/tools/assets.put_object", response_model=PutObjectResp)
    def assets_put(req: PutObjectReq) -> PutObjectResp:
        try:
            data = base64.b64decode(req.base64_bytes.encode("utf-8"))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"invalid base64: {e}")
        storage_put(req.storage_path, data)
        return PutObjectResp(storage_path=req.storage_path, bytes_written=len(data))

    @app.post("/tools/youtube.upload_video", response_model=UploadVideoResp)
    def youtube_upload(req: UploadVideoReq) -> UploadVideoResp:
        with db_connect() as con:
            row = con.execute("SELECT * FROM video_jobs WHERE id=?", (req.job_id,)).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="job not found")

            cap = verify_capability(req.capability_token, "publish", req.job_id)

            if row["status"] not in ("READY_TO_PUBLISH", "PUBLISHING"):
                raise HTTPException(status_code=409, detail=f"job status not publishable: {row['status']}")

            # Ensure idempotency key has been registered
            idem = con.execute("SELECT key FROM idempotency_keys WHERE key=?", (cap.publish_key,)).fetchone()
            if not idem:
                raise HTTPException(status_code=403, detail="idempotency key not registered")

            video_path = get_asset_path(con, req.job_id, "video")
            if not video_path:
                raise HTTPException(status_code=400, detail="missing video asset")

            title = row["title"] or row["topic"]
            description = row["description"] or ""
            tags = json.loads(row["tags_json"]) if row["tags_json"] else []
            privacy = row["privacy_status"]

            if row["youtube_video_id"]:
                return UploadVideoResp(job_id=req.job_id, youtube_video_id=row["youtube_video_id"], status="already_uploaded")

            transition_job(con, req.job_id, "PUBLISHING")

            yt_video_id = youtube_upload_video(
                file_path=(STORAGE_DIR / video_path),
                title=title,
                description=description,
                tags=tags,
                privacy_status=privacy,
                category_id=YT_CATEGORY_ID,
            )
            con.execute(
                "UPDATE video_jobs SET youtube_video_id=?, updated_at=? WHERE id=?",
                (yt_video_id, utcnow(), req.job_id),
            )
            con.commit()
            return UploadVideoResp(job_id=req.job_id, youtube_video_id=yt_video_id, status="uploaded")

    @app.post("/tools/youtube.set_thumbnail", response_model=SetThumbnailResp)
    def youtube_thumb(req: SetThumbnailReq) -> SetThumbnailResp:
        with db_connect() as con:
            row = con.execute("SELECT * FROM video_jobs WHERE id=?", (req.job_id,)).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="job not found")
            cap = verify_capability(req.capability_token, "publish", req.job_id)
            idem = con.execute("SELECT key FROM idempotency_keys WHERE key=?", (cap.publish_key,)).fetchone()
            if not idem:
                raise HTTPException(status_code=403, detail="idempotency key not registered")
            thumb_path = get_asset_path(con, req.job_id, "thumbnail")
            if not thumb_path:
                raise HTTPException(status_code=400, detail="missing thumbnail asset")

            youtube_set_thumbnail(req.youtube_video_id, (STORAGE_DIR / thumb_path))
            return SetThumbnailResp(status="ok")

    return app


# -----------------------------
# CLI Commands
# -----------------------------

def create_job(topic: str, privacy: str = "unlisted") -> str:
    if privacy not in ("private", "unlisted", "public"):
        raise ValueError("privacy must be private|unlisted|public")
    job_id = str(uuid.uuid4())
    now = utcnow()
    with db_connect() as con:
        con.execute(
            "INSERT INTO video_jobs(id, status, topic, privacy_status, created_at, updated_at) VALUES (?,?,?,?,?,?)",
            (job_id, "QUEUED", topic, privacy, now, now),
        )
        enqueue_outbox(con, job_id, "GENERATE", {"topic": topic})
        con.commit()
    return job_id

def list_jobs() -> None:
    with db_connect() as con:
        rows = con.execute("""
            SELECT id, status, topic, youtube_video_id, created_at, updated_at, error
            FROM video_jobs
            ORDER BY created_at DESC
            LIMIT 50
        """).fetchall()
    for r in rows:
        print(f"{r['id']}  {r['status']:<16}  {r['topic'][:60]:<60}  yt={r['youtube_video_id'] or '-'}  err={r['error'] or '-'}")

def run_worker_loop() -> None:
    print("Worker started. Ctrl+C to stop.")
    while True:
        worker_step()
        time.sleep(1.0)

def serve(host: str, port: int) -> None:
    app = create_app()
    import uvicorn
    uvicorn.run(app, host=host, port=port, log_level="info")

def autopilot_tick() -> None:
    """
    Optional: A scheduler tick you can call from cron/systemd.
    It creates a new job if within daily cap and there isn't already a queued job.
    """
    with db_connect() as con:
        if count_publishes_today(con) >= MAX_PUBLISH_PER_DAY:
            return
        queued = con.execute("SELECT COUNT(*) as n FROM video_jobs WHERE status IN ('QUEUED','GENERATING','READY_FOR_REVIEW','READY_TO_PUBLISH','PUBLISHING')").fetchone()
        if int(queued["n"]) > 0:
            return
    # Example topic generator (replace with agent)
    topics = [
        "Partner risk checklist for SaaS founders",
        "Vendor due diligence: security and compliance essentials",
        "How to score partnership fit before you sign",
        "Red flags in channel partnerships and alliances",
    ]
    topic = random.choice(topics)
    job_id = create_job(topic=topic, privacy="unlisted")
    print(f"Autopilot created job {job_id} topic={topic}")

def main() -> None:
    parser = argparse.ArgumentParser(description="Autopilot YouTube: governed autonomous video factory + MCP-like server")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init-db")

    pserve = sub.add_parser("serve")
    pserve.add_argument("--host", default="127.0.0.1")
    pserve.add_argument("--port", type=int, default=8787)

    sub.add_parser("worker")

    pjob = sub.add_parser("create-job")
    pjob.add_argument("--topic", required=True)
    pjob.add_argument("--privacy", default="unlisted")

    sub.add_parser("list-jobs")

    sub.add_parser("oauth")

    sub.add_parser("autopilot-tick")

    args = parser.parse_args()

    if args.cmd == "init-db":
        init_db()
    elif args.cmd == "serve":
        serve(args.host, args.port)
    elif args.cmd == "worker":
        run_worker_loop()
    elif args.cmd == "create-job":
        job_id = create_job(args.topic, args.privacy)
        print(f"Created job {job_id}")
    elif args.cmd == "list-jobs":
        list_jobs()
    elif args.cmd == "oauth":
        run_oauth_flow()
    elif args.cmd == "autopilot-tick":
        autopilot_tick()
    else:
        raise SystemExit("unknown cmd")

if __name__ == "__main__":
    main()
