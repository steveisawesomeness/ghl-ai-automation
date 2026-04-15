# GHL Internal API — Endpoint Inventory

**Subaccount:** StopLosingLeadsHQ
**Location ID:** `5upKzDPLSpQ2txoYwSdz`
**Company ID:** `PTtM4nIlGHCHpe0agt7j`
**Captured:** April 14, 2026

---

## Auth Pattern

Every request to `backend.leadconnectorhq.com` requires these headers:

| Header | Value | Notes |
|--------|-------|-------|
| `token-id` | Firebase JWT | Short-lived — expires ~60 min from `iat` |
| `channel` | `APP` | Static |
| `source` | `WEB_USER` | Static |
| `version` | `2021-04-15` | Static API version string |
| `origin` | `https://client-app-automation-workflows.leadconnectorhq.com` | Varies by GHL surface |
| `referer` | `https://client-app-automation-workflows.leadconnectorhq.com/` | Match origin |

### Token Structure

The `token-id` is a Firebase JWT signed by `https://securetoken.google.com/highlevel-backend`.

```json
{
  "user_id": "2a9mydDKyeTV5RXXlD2x",
  "company_id": "PTtM4nIlGHCHpe0agt7j",
  "role": "admin",
  "type": "agency",
  "locations": ["5upKzDPLSpQ2txoYwSdz"],
  "permissions": { "workflows_enabled": true, "workflows_read_only": false },
  "iss": "https://securetoken.google.com/highlevel-backend",
  "iat": 1776193403,
  "exp": 1776197003
}
```

- Token expires 60 min after `iat`
- `type: agency` — works across sub-accounts (to verify)
- Refresh via Firebase: `https://securetoken.googleapis.com/v1/token?key={apiKey}` with `refresh_token`

---

## Endpoints

### Workflow — Get Single
```
GET https://backend.leadconnectorhq.com/workflow/{locationId}/{workflowId}?includeScheduledPauseInfo=true&sessionId={uuid}
```
- `sessionId`: fresh UUID per call
- Returns full workflow with `workflowData.templates` step tree

### Workflow — Update (metadata only)
```
PUT https://backend.leadconnectorhq.com/workflow/{locationId}/{workflowId}
```
Validated for metadata writes (rename). Step-tree deltas go through `/auto-save` — see below.

### Workflow — Auto-Save (step tree writes)
```
PUT https://backend.leadconnectorhq.com/workflow/{locationId}/{workflowId}/auto-save
```
Captured from the GHL builder's save flow. Used for step add/modify/delete. Payload = full workflow object plus:
- `workflowData.templates` — full step tree, with the step change already applied
- `createdSteps` / `modifiedSteps` / `deletedSteps` — delta step ID arrays (only the changed IDs)
- `isAutoSave: true`
- `version` — auto-increments on save
- `triggersChanged` — only true when triggers modified
- `newTriggers` / `oldTriggers` — send both

Write pattern: GET → mutate `workflowData.templates` → PUT to `/auto-save` with the matching delta array populated.

### Workflow Assets (step type catalog)
```
GET https://backend.leadconnectorhq.com/workflows-marketplace/location/{locationId}/assets?workflowTypes=default,contacts
```

---

## Step Tree Schema

`workflowData.templates` is a flat array of step objects linked by `parent` / `parentKey`.

**Universal step fields:**
| Field | Notes |
|-------|-------|
| `id` | UUID — generate fresh for new |
| `name` | Display label |
| `type` | e.g. `add_contact_tag`, `create_opportunity`, `email`, `wait` |
| `order` | Integer position within parent |
| `parent` | UUID of parent step |
| `parentKey` | UUID of previous step (chain link) |
| `next` | UUID of next step (omit if last) |
| `attributes` | Action-specific config |

### Add Tag step
```json
{
  "id": "...",
  "name": "Add Tag",
  "type": "add_contact_tag",
  "attributes": { "tags": ["setup only"] }
}
```

### Create/Update Opportunity step
```json
{
  "name": "Create Or Update Opportunity",
  "type": "create_opportunity",
  "attributes": {
    "fields": [],
    "type": "create_opportunity",
    "pipeline_id": "mgDvNgt28NdDnGpYBcih"
  }
}
```

### Send Email step
```json
{
  "name": "Email",
  "type": "email",
  "attributes": {
    "templateCreationMode": "existing",
    "template_id": "69de8638526a832ebed27d63",
    "templatesource": "email-builder",
    "subject": "",
    "from_email": "",
    "from_name": "",
    "preHeader": "",
    "attachments": [],
    "conditions": [],
    "previewUrl": "",
    "trackingOptions": {
      "hasTrackingLinks": false,
      "hasUtmTracking": false,
      "hasTags": false,
      "sourceId": "{workflowId}:{stepId}"
    }
  }
}
```

---

## Still To Capture

- Workflow list, publish, create, delete
- Email templates: PUT, DELETE
- Forms: list, get, update
- Custom values: CRUD
- Tags: list, create, delete
- Firebase token refresh flow
- Verify agency token works cross-location

## curl Template

```bash
curl -X GET "https://backend.leadconnectorhq.com/ENDPOINT?locationId=5upKzDPLSpQ2txoYwSdz" \
  -H "token-id: YOUR_JWT" \
  -H "channel: APP" \
  -H "source: WEB_USER" \
  -H "version: 2021-04-15" \
  -H "origin: https://client-app-automation-workflows.leadconnectorhq.com" \
  -H "accept: application/json"
```
