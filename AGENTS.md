# AGENTS.md — Nagar-Setu (RoadGuard AI) Engineering Guidelines

Welcome to Nagar-Setu (ROADGUARD AI). This workspace implements an AI road-safety intelligence and municipal corrective-action governance platform.

## Architecture
- **Clean Modular Monolith**:
  - `apps/web/`: Next.js 16 (App Router), React 19, TypeScript 5.7, Tailwind CSS 4, Leaflet GIS.
  - `apps/api/`: FastAPI 0.115+, Pydantic v2, SQLAlchemy 2.0, Alembic, PostgreSQL 16 + PostGIS 3.4.
  - `ai-engine/`: Asynchronous video processing, frame extraction, IoU tracking, YOLO adapter, rule engine.
  - `shared/`: Shared domain models and constants.
  - `scripts/`: Operational utilities (`demo_smoke.py`, `generate_demo_clip.py`, `seed_database.py`).

## Core Rules & Invariants
1. **Separation of Concerns:** Keep presentation, business logic, data access, and async workers strictly decoupled.
2. **Strict Multi-Tenancy & RLS:** Enforce PostgreSQL Row-Level Security on all tenant tables. Runtime API connects as `roadguard_app` (`NOBYPASSRLS`).
3. **Responsible AI Guardrails:** Observations are candidate proposals (`near_miss_candidate`, `collision_candidate`), never definitive legal findings. Speed is never calculated from uncalibrated 2D cameras.
4. **Audit Logging:** Every municipal action (work orders, reviews, verifications) must generate immutable audit records.
5. **No Hardcoded Secrets:** All secrets, keys, and connection strings must reside in environment variables (`.env`).

## Standard Commands
- **Frontend Development:** `npm --prefix apps/web run dev` (starts on port 3000)
- **Frontend Typecheck:** `npm --prefix apps/web run typecheck`
- **Docker Full Stack:** `docker compose up -d`
- **Database Migrations:** `docker compose run --rm api alembic upgrade head`
- **Automated Smoke Test:** `python scripts/demo_smoke.py --external-worker`
