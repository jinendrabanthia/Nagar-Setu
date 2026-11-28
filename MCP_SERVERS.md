# Model Context Protocol (MCP) Configuration & Status

This document catalogs the MCP servers configured for Antigravity, detailing their scope, transport mechanism, authentication requirements, and security permissions.

---

## 1. Configured MCP Servers Summary

| Server Identifier | Transport | Configuration Scope | Purpose | Auth Required | Permission Level | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`playwright`** | Stdio (`npx.cmd`) | Global (`~/.gemini/config/mcp_config.json`) & Workspace | Headless browser automation, UI testing, screenshot capture, DOM inspection. | None | Sandboxed local browser | **Configured** |
| **`github`** | Stdio (`npx.cmd`) | Global (`~/.gemini/config/mcp_config.json`) | GitHub repository inspection, PR review, issues, and branch management. | `GITHUB_PERSONAL_ACCESS_TOKEN` | Read / Write (User PAT) | **Awaiting Token** |
| **`postgres`** | Stdio (`npx.cmd`) | Workspace (`.agents/mcp_config.json`) | PostgreSQL & PostGIS database introspection, schema exploration, read-only queries. | Database credentials (unprivileged role) | Read-only / App-role | **Configured** |

---

## 2. Configuration Details

### A. Global Configuration (`~/.gemini/config/mcp_config.json`)
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx.cmd",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    },
    "github": {
      "command": "npx.cmd",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": ""
      }
    }
  }
}
```

### B. Workspace Configuration (`.agents/mcp_config.json`)
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx.cmd",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://roadguard_app:local-dev-app-role-password@localhost:5432/roadguard"
      ]
    },
    "playwright": {
      "command": "npx.cmd",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    }
  }
}
```

---

## 3. Recommended Marketplace MCP Plugins

For advanced ecosystem integrations, the following verified Antigravity Marketplace plugins provide native one-click MCP connectivity:

1. **Context7 Documentation Lookup** (`antigravity-plugins-partners/plugin/context7`)
   - Up-to-date documentation lookup directly from official framework repositories (Next.js, FastAPI, PostGIS, Tailwind).
2. **Supabase Integration** (`antigravity-plugins-partners/plugin/supabase`)
   - Direct integration for Supabase-hosted PostgreSQL + PostGIS instances, storage buckets, and auth schemas.

---

## 4. Security & Safety Constraints
- **Least Privilege:** The PostgreSQL MCP server is configured to connect strictly through the unprivileged `roadguard_app` role, preventing destructive DDL or bypassing Row-Level Security.
- **Zero Hardcoded Personal Secrets:** The `GITHUB_PERSONAL_ACCESS_TOKEN` is left empty in version-controlled templates and should be injected via system environment variables.
- **Approval Gates:** Any state-modifying database or repository actions remain subject to manual approval before execution.
