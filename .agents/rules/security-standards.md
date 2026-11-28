# Security & Compliance Standards — Nagar-Setu (RoadGuard AI)

## 1. Zero Trust & Defense in Depth
- Every API endpoint requiring authentication must validate the session cookie/token and extract `current_user` and `current_organization_id`.
- Never trust client-supplied IDs (e.g. `user_id` or `organization_id`) in request bodies or query params to determine record ownership.

## 2. Row-Level Security (RLS) Protocol
- All tenant-bound PostgreSQL tables MUST have Row-Level Security enabled and forced:
  `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
  `ALTER TABLE <table> FORCE ROW LEVEL SECURITY;`
- The runtime API connects as the unprivileged role `roadguard_app` with `NOBYPASSRLS`.
- Direct/migration connections (`DATABASE_MIGRATION_URL`) run as `roadguard` or `postgres` to perform DDL and seeding only.

## 3. Session & Token Security
- Session tokens are stored in `HttpOnly`, `SameSite=Lax` (or `Strict`), and `Secure` (in production) cookies.
- Double-Submit CSRF cookie verification is required on state-changing API operations.
- Access token TTL $\le 15$ minutes; refresh token rotation enforced.

## 4. Responsible AI & Ethics Guardrails
- **Observations, Not Accusations:** The AI pipeline produces candidate observations (`near_miss_candidate`, `collision_candidate`). It NEVER issues definitive findings of fault, guilt, or legal culpability.
- **No Uncalibrated Pixel Physics:** Never calculate or display vehicular speed (km/h or mph) from 2D uncalibrated perspective cameras.
- **Human Authority:** All municipal work orders, penalties, or formal investigations require verified human official sign-off.
- **Audit Trail:** All state transitions on incidents, work orders, and review actions must write immutable append-only records to `audit_logs`.
