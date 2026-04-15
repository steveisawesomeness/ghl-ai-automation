# GHL Internal API MCP Server

Local MCP server wrapping GoHighLevel's internal API (`backend.leadconnectorhq.com`) to enable workflow, form, and email template CRUD that the public API blocks.

**Status:** Phase 1 — skeleton + workflow get/update tools.

## Setup

```bash
npm install
cp .env.example .env
# paste your GHL_TOKEN_ID from Chrome DevTools → Network → any GHL request → Headers → token-id
npm run dev
```

Expected output: `GHL Internal API MCP Server running on stdio`

## Token refresh

The Firebase JWT expires ~60 min after issue. When you get 401 errors, re-copy `token-id` from DevTools and update `.env`. Automated refresh is a Phase 2 item.

## Tools (Phase 1)

- `workflow_get(workflowId)` — fetch full workflow with step tree
- `workflow_update(workflowId, workflow, modifiedSteps, createdSteps, deletedSteps)` — save workflow changes

See `endpoints.md` for full API reference.

## Register with Claude Code

Add to your MCP config:

```json
{
  "mcpServers": {
    "ghl-internal": {
      "command": "node",
      "args": ["C:\\Users\\Steve\\Dev\\ghl-mcp-server\\dist\\index.js"],
      "cwd": "C:\\Users\\Steve\\Dev\\ghl-mcp-server"
    }
  }
}
```

Run `npm run build` first to produce `dist/`.
