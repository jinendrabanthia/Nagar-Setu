# Development Environment Setup & Maintenance Guide

This runbook provides step-by-step instructions for initializing, maintaining, updating, and troubleshooting the Antigravity development environment and the Nagar-Setu platform.

---

## 1. Quickstart: Running the Application

### A. Web Frontend (Currently Ready & Operational)
Node.js (`v26.13.0`) and all npm dependencies are pre-installed in `apps/web`.
```powershell
# Start the Next.js 16 development server
npm --prefix apps/web run dev

# Run TypeScript type validation
npm --prefix apps/web run typecheck
```
The application will be accessible in your browser at: **http://localhost:3000**

### B. Backend & Full Container Stack (Docker Compose)
*Prerequisite: Install Docker Desktop on Windows.*
```powershell
# 1. Ensure .env is present (generated from .env.example)
# 2. Build and launch all 7 containers in background
docker compose up -d --build

# 3. Run database migrations
docker compose run --rm api alembic upgrade head

# 4. Seed demo data (departments, assets, synthetic users)
docker compose run --rm api python scripts/seed_database.py

# 5. Execute automated 12-step smoke test
python scripts/demo_smoke.py --external-worker
```

### C. Bare-Metal Development (Without Docker)
*Prerequisite: Install Python 3.12+ (`winget install Python.Python.3.12`).*
```powershell
# 1. Initialize virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# 2. Install Python dependencies in editable mode
pip install -e "./apps/api[dev]" -e "./ai-engine"

# 3. Run database migrations
alembic -c apps/api/alembic.ini upgrade head

# 4. Start the FastAPI API server
uvicorn app.main:app --app-dir apps/api --port 8000 --reload
```

---

## 2. Managing & Updating Agent Skills

### Skill Discovery Locations
- **Global Skills:** `~/.gemini/config/skills/<skill-name>/SKILL.md` (active across all workspaces).
- **Workspace Skills:** `.agents/skills/<skill-name>/SKILL.md` (active for this repository).

### How to Add or Update a Skill
1. Create a directory: `~/.gemini/config/skills/<skill-name>/`
2. Author `SKILL.md` with required frontmatter:
   ```markdown
   ---
   name: your-skill-name
   description: Detailed description of what the skill does and when to activate it.
   ---
   # Skill Instructions
   ...
   ```
3. Antigravity automatically detects new skills on the fly without needing an IDE restart.

---

## 3. Managing & Updating MCP Servers

### Configuration Files
- **Global MCPs:** `~/.gemini/config/mcp_config.json`
- **Workspace MCPs:** `.agents/mcp_config.json`

### Updating an MCP Server
To add or modify an MCP server, edit the JSON configuration:
```json
{
  "mcpServers": {
    "server-name": {
      "command": "npx.cmd",
      "args": ["-y", "@modelcontextprotocol/package-name@latest"]
    }
  }
}
```
Always use `"command": "npx.cmd"` on Windows to ensure correct command resolution.

### Troubleshooting MCP Connections
- **`ENOENT` Error:** Ensure the executable name is suffixed with `.cmd` on Windows (e.g. `npx.cmd`).
- **Connection Timeout:** Verify network connectivity. If running inside a corporate proxy or VPN, ensure npm proxy settings are configured (`npm config set proxy ...`).
- **Authentication Failure:** Verify environment variables (e.g., `GITHUB_PERSONAL_ACCESS_TOKEN`) are set in your user environment.

---

## 4. Resetting & Cleaning the Environment
To safely clear caches or rebuild:
```powershell
# Clear Next.js build cache
Remove-Item -Path "apps/web/.next" -Recurse -Force -ErrorAction SilentlyContinue

# Reinstall web dependencies cleanly
Remove-Item -Path "apps/web/node_modules" -Recurse -Force -ErrorAction SilentlyContinue
npm --prefix apps/web install

# Teardown Docker volumes
docker compose down -v
```
