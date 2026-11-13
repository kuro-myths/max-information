# MAX Information

**AI Usage Intelligence for 9Router and OpenAI-compatible gateways.**

MAX Information is a standalone TypeScript / Next.js telemetry dashboard. It collects request-level usage from multiple 9Router instances (Codespaces, local installations, and other clients) into one PostgreSQL database.

## Features
- Request ledger with idempotent event ingestion.
- Requested, resolved, and upstream model identity kept separately.
- Provider, provider owner, connection ID, client and instance attribution.
- Input/output/cached/reasoning/total token fields.
- Latency, HTTP status, stream flag, errors and cost/usage confidence.
- 24-hour analytics API and auto-refreshing dashboard.
- Health endpoint and Supabase SQL migration.
- Ingest endpoint protected by a dedicated bearer secret; service-role key stays server-side.

## Architecture
9Router instances -> `POST /api/v1/events` -> Next.js API -> Supabase Postgres -> dashboard.

## Quick start
1. Create a Supabase project.
2. Run `supabase/migrations/0001_usage_events.sql` in the Supabase SQL Editor.
3. Copy `.env.example` to `.env.local` and set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and a long random `INGEST_API_KEY`.
4. Install and run:
   ```bash
   npm install
   npm run dev
   ```
5. Open `http://localhost:3000`; check `/api/health`.

## Ingest contract
Send one event or a batch (maximum 100 events) to `POST /api/v1/events`:

```http
Authorization: Bearer YOUR_INGEST_API_KEY
Content-Type: application/json
```

```json
{
  "instance_id": "codespaces-kuro",
  "source": "codespaces",
  "client": "Kiro",
  "request_id": "req-unique-001",
  "requested_model": "gemini-3.8-flash",
  "resolved_model": "google/gemini-3.8-flash",
  "upstream_model": "gemini-3.8-flash",
  "provider": "Google AI Studio",
  "provider_owner": "Google",
  "provider_connection_id": "google-key-01",
  "status": 200,
  "success": true,
  "input_tokens": 4990,
  "output_tokens": 267,
  "total_tokens": 5257,
  "latency_ms": 1240,
  "usage_status": "verified",
  "cost_status": "unknown"
}
```

Optional fields include `event_id` (UUID for deduplication), `occurred_at`, `cached_input_tokens`, `reasoning_tokens`, `estimated_cost_usd`, `error_code`, `error_message`, `stream`, and `metadata`. Use `usage_status=verified` only when token counts came from authoritative provider response usage metadata. If unavailable, send null counts and `unknown`; do not invent usage.

## API endpoints
- `GET /api/health` — service and database health.
- `POST /api/v1/events` — authenticated telemetry ingestion.
- `GET /api/v1/summary` — authenticated 24-hour aggregate and latest events.
- `GET /api/dashboard/summary` — dashboard's server-side summary endpoint.

## Vercel deployment
Import this repository into Vercel, use the Next.js preset, and add the three server-side environment variables from `.env.example`. Deploy after the Supabase migration is applied. Never prefix service-role or ingest secrets with `NEXT_PUBLIC_`.

## 9Router integration
This repository intentionally does not modify 9Router. Instrument its final request/response lifecycle where the actual upstream response and usage object are available. Emit one event per completed request, including failed requests. For streaming, emit once after stream completion using the final usage metadata. Preserve requested model, resolved model, actual upstream model, selected provider connection, client and instance identifiers separately.

A 9Router adapter is not included yet because the exact 9Router source version and internal hook names must be inspected first. Do not guess these hooks or report integration as complete until a real request is observed end-to-end.

## Accuracy and security
- `event_id` is unique; duplicate event delivery is ignored.
- Model aliases and upstream model IDs are stored separately.
- `usage_status` and `cost_status` distinguish verified, estimated and unknown data.
- The ingest secret is compared in constant-time and never stored in event rows.
- Supabase service-role access is server-only; RLS is enabled with no public policy.
- Cost remains unknown unless supplied from a trusted pricing calculation or provider-reported cost.

## Current limitations
The dashboard is functional in preview mode before configuration. Live analytics require Supabase setup. Automatic discovery of provider/model ownership and automatic 9Router instrumentation require an adapter built against the exact upstream 9Router version. Provider names and owners must be sent by the adapter, not inferred from a model string.

## License
Private project. Add a license before distributing.
