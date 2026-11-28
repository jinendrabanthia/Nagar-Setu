# Development & Engineering Standards — Nagar-Setu

## 1. Clean Modular Monolith Architecture

The repository enforces strict separation of concerns across its four principal modules:

```
Nagar-Setu/
├── apps/
│   ├── web/          # Presentation Layer: Next.js 16 App Router, React 19, Tailwind CSS 4, Leaflet
│   └── api/          # Application & Data Layer: FastAPI 0.115+, Pydantic v2, SQLAlchemy 2, Alembic
├── ai-engine/        # Worker Tier: Computer Vision, OpenCV, YOLO Adapter, IoU Tracker, Celery
└── shared/           # Cross-cutting: Domain contracts, shared schemas, and constants
```

### Architectural Rules:
- **No Cross-Tier Leaks:** The web tier (`apps/web`) communicates with the API tier strictly via authenticated HTTP/REST endpoints. Never import backend ORM models, database sessions, or secret keys into web components.
- **Stateless API:** The FastAPI backend maintains no in-memory session state. All session authentication uses cryptographically signed JWT cookies and distributed storage.
- **Asynchronous Heavy Processing:** Video decoding, object detection inference, trajectory prediction, and media clipping MUST be executed asynchronously in worker processes (`ai-engine`); never block HTTP request/response loops.

---

## 2. Frontend Coding Conventions (TypeScript & React)

- **Strict TypeScript:** `noImplicitAny: true`, `strictNullChecks: true`. All component props, state variables, and API responses must have explicit TypeScript types.
- **Server vs. Client Boundaries:**
  - Mark interactive components with `"use client"` at the very top of the file.
  - Keep client components at the leaves of the render tree (buttons, modals, input forms, map controls).
  - Use Server Components (`RSC`) for data-fetching containers and layouts.
- **Dynamic Leaflet Imports:** Always import Leaflet and React-Leaflet components with `next/dynamic` and `ssr: false` to avoid SSR `window is not defined` errors.
- **CSS & Design System:** Use Tailwind CSS 4 utility classes. Maintain accessibility contrast ratios ($\ge 4.5:1$) across both the dark Command Center theme and light Administrative Portal theme.

---

## 3. Backend Coding Conventions (Python & FastAPI)

- **Pydantic v2 Schemas:** Define explicit schemas for every input and output:
  - `*Create` for creation payloads.
  - `*Update` for partial updates (`Optional` fields).
  - `*Response` for outbound JSON representations (excluding sensitive internal fields).
- **Dependency Injection:** Database sessions (`AsyncSession`), current authenticated users (`User`), and current organization IDs (`UUID`) must be injected via `Depends()`.
- **SQLAlchemy 2.0 Style:** Use the `select()` 2.0 syntax exclusively. Avoid legacy 1.x query styles.
- **Structured Error Responses:** Every error response must adhere to the standard envelope:
  ```json
  {
    "error": {
      "code": "STRING_IDENTIFIER",
      "message": "Human readable summary",
      "details": []
    }
  }
  ```

---

## 4. Database & Geospatial Standards (PostGIS)

- **Coordinate System:** Always use WGS 84 (`SRID=4326`).
- **Spatial Columns & Indexes:** Every table containing spatial data must declare geometry/geography types and must have a corresponding `GIST` index.
- **Row-Level Security (RLS):** All tenant tables (`incidents`, `work_orders`, `assets`, `cameras`) must have RLS enabled and forced:
  ```sql
  ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;
  ALTER TABLE <table_name> FORCE ROW LEVEL SECURITY;
  ```
- **Reversible Migrations:** Every Alembic revision file must implement both `upgrade()` and `downgrade()` functions.

---

## 5. Security & Responsible AI Standards

- **OWASP ASVS L2 Compliance:** HttpOnly, Secure, SameSite cookies for tokens; double-submit CSRF cookie checks on state-changing endpoints.
- **Secrets Management:** Zero hardcoded credentials. All configuration is loaded from `.env` via `pydantic-settings`.
- **Responsible Surveillance AI Guardrails:**
  - The AI engine generates **candidate observations**, never legal determinations of guilt or liability.
  - Speed is **never** calculated from 2D uncalibrated perspective cameras.
  - Every corrective action (work order issuance, legal investigation, fine) requires verified human official review.
- **Immutable Audit Trail:** All review decisions, work order dispatches, and verification actions are permanently logged in the PostgreSQL `audit_logs` table.
