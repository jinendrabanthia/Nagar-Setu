# Installed Antigravity Agent Skills

All skills listed below have been installed globally in `~/.gemini/config/skills/` (`C:\Users\Arnab Sharma\.gemini\config\skills\`) so they are permanently accessible across **all current and future projects** on this machine.

---

## Global Skills Directory

| Skill Name | Location | Primary Purpose | Activation Triggers |
| :--- | :--- | :--- | :--- |
| **`software-architecture`** | `~/.gemini/config/skills/software-architecture/SKILL.md` | Modular monolith design, SOLID principles, clean layer separation, domain boundaries. | Designing new features, structuring subsystems, refactoring modules, evaluating architectural trade-offs. |
| **`senior-code-review`** | `~/.gemini/config/skills/senior-code-review/SKILL.md` | Deep code review, bug detection, code smells, cognitive complexity reduction, OWASP verification. | Reviewing PRs, inspecting git diffs, refactoring legacy code, evaluating code quality before merge. |
| **`secure-software-development`** | `~/.gemini/config/skills/secure-software-development/SKILL.md` | OWASP Top 10, ASVS Level 2 compliance, RLS, CSRF, XSS, SQLi, secure session lifecycles, secrets hygiene. | Implementing authentication, writing RLS policies, securing APIs, threat modeling, vulnerability remediation. |
| **`frontend-engineering`** | `~/.gemini/config/skills/frontend-engineering/SKILL.md` | Next.js 14-16 (App Router), React 18/19, TypeScript, Tailwind CSS, Leaflet/Mapbox GIS, WCAG a11y. | Authoring UI components, responsive layout styling, client state, dynamic map rendering, bundle optimization. |
| **`backend-engineering`** | `~/.gemini/config/skills/backend-engineering/SKILL.md` | FastAPI 0.115+, RESTful API design, Pydantic v2 schemas, async endpoints, error envelopes, rate limiting. | Authoring API endpoints, request/response validation, dependency injection, service layers, async tasks. |
| **`database-engineering`** | `~/.gemini/config/skills/database-engineering/SKILL.md` | PostgreSQL 16, PostGIS 3.4 spatial queries, GIST indexes, Alembic migrations, connection pooling, RLS. | Designing relational/spatial schemas, writing migrations, optimizing slow queries, tuning connection pools. |
| **`testing-quality-assurance`** | `~/.gemini/config/skills/testing-quality-assurance/SKILL.md` | Unit, integration, and E2E testing with pytest, Vitest, Playwright, mock fixtures, smoke test scripts. | Writing test suites, setting up fixtures, debugging flaky tests, smoke testing deployments, coverage enforcement. |
| **`debugging-performance-engineering`**| `~/.gemini/config/skills/debugging-performance-engineering/SKILL.md` | Root-cause analysis, CPU/memory profiling, query optimization (EXPLAIN ANALYZE), memory leak diagnosis. | Diagnosing 500 errors, crashes, latency spikes, memory leaks, database lock contention, event loop lag. |
| **`devops-deployment`** | `~/.gemini/config/skills/devops-deployment/SKILL.md` | Multi-stage Docker builds, Docker Compose orchestration, CI/CD GitHub Actions, container hardening. | Authoring Dockerfiles, composing multi-service stacks, setting up CI/CD pipelines, container health checks. |
| **`documentation-engineering`** | `~/.gemini/config/skills/documentation-engineering/SKILL.md` | Architecture Decision Records (ADRs), Mermaid diagrams, OpenAPI specs, READMEs, runbooks, changelogs. | Documenting technical specs, generating architecture diagrams, writing setup runbooks, documenting APIs. |
| **`ai-cv-engineering`** | `~/.gemini/config/skills/ai-cv-engineering/SKILL.md` | Computer vision pipelines, OpenCV, YOLO adapters, IoU tracking, candidate event rules, ethical AI guardrails. | Developing CV workers, frame extraction, tracking algorithms, candidate safety rules, ethical surveillance compliance. |
| **`git-github-engineering`** | `~/.gemini/config/skills/git-github-engineering/SKILL.md` | Git workflows, Conventional Commits, PR templates, merge conflict resolution, GitHub CLI automation. | Crafting commit messages, opening PRs, managing branch lifecycles, resolving git conflicts. |

---

## Workspace Rules (Nagar-Setu)

In addition to the global skills, the following workspace-scoped rules are established in `.agents/rules/` and `AGENTS.md`:

1. **`AGENTS.md`**: Top-level project architectural summary, invariant rules, and common development commands.
2. **`.agents/rules/coding-standards.md`**: Modular monolith design, Next.js client/server boundaries, FastAPI schema validation.
3. **`.agents/rules/security-standards.md`**: PostgreSQL RLS enforcement, HttpOnly cookies, Double-Submit CSRF, ethical AI guardrails.
4. **`.agents/rules/database-and-gis.md`**: PostGIS 4326 spatial requirements, GIST index enforcement, reversible Alembic migrations.
