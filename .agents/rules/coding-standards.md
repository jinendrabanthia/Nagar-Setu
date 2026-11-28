# Project Coding & Architectural Standards — Nagar-Setu (RoadGuard AI)

## 1. Architectural Philosophy: Clean Modular Monolith
- The system is architected as a Clean Modular Monolith with an asynchronous worker tier for heavy computer vision tasks.
- Maintain strict boundaries:
  - `apps/web/`: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Leaflet. Client-server boundaries must be explicit (`"use client"` on interactive leaf components only).
  - `apps/api/`: FastAPI 0.115+, Pydantic v2 schemas, SQLAlchemy 2.0 ORM, Alembic migrations. All endpoints must return typed, uniform JSON envelopes.
  - `ai-engine/`: Asynchronous video decoding, frame sampling, IoU tracking, YOLO adapter, rule engine, and candidate event classification.
  - `shared/`: Shared domain contracts, enums, and schemas.

## 2. TypeScript & Next.js Conventions
- **Strict Typing:** `strict: true` in `tsconfig.json`. No `any` types; use explicit interfaces, generics, or `unknown` with type guards.
- **Components:** Reusable UI components live in `apps/web/components/`. Page routes live in `apps/web/app/`.
- **Geospatial Maps:** Leaflet components must be dynamically imported with `{ ssr: false }` to prevent server-side DOM window errors.
- **Styling:** Use Tailwind CSS 4 utility classes. Keep dark/light theme tokens consistent across Command Center (Dark) and Administrative Portal (Light).

## 3. Python & FastAPI Conventions
- **Pydantic v2:** Separate request models (`Create`, `Update`) from response models (`Response`). Use `model_config = ConfigDict(extra="forbid")` on sensitive schemas.
- **Async Endpoints:** Use `async def` for I/O-bound operations (database queries, HTTP calls). Delegate CPU-bound operations (image manipulation, video decoding) to worker processes or `asyncio.to_thread`.
- **Dependencies:** Inject database sessions and authenticated user context via FastAPI `Depends()`.

## 4. Error Handling & Validation
- Return structured error JSON envelopes on all non-2xx responses:
  `{"error": {"code": "...", "message": "...", "details": [...]}}`
- Never expose raw stack traces, database schema details, or unhandled exceptions to the client.
