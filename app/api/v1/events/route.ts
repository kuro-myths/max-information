import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { batchSchema, telemetrySchema } from "@/lib/validation";
import { isDatabaseConfigured, supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: NextRequest) {
  const expected = process.env.INGEST_API_KEY;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\\s+/i, "");
  if (!expected || !supplied) return false;
  const a = createHash("sha256").update(expected).digest();
  const b = createHash("sha256").update(supplied).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDatabaseConfigured || !supabase) {
    return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 1_000_000) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsedBatch = batchSchema.safeParse(body);
  const parsedSingle = telemetrySchema.safeParse(body);
  const events = parsedBatch.success ? parsedBatch.data.events : parsedSingle.success ? [parsedSingle.data] : null;
  if (!events) return NextResponse.json({
    error: "Invalid telemetry payload",
    details: parsedBatch.error?.flatten()
  }, { status: 422 });

  const rows = events.map((event) => ({
    event_id: event.event_id ?? crypto.randomUUID(),
    occurred_at: event.occurred_at ?? new Date().toISOString(),
    instance_id: event.instance_id,
    source: event.source,
    client: event.client ?? null,
    request_id: event.request_id,
    requested_model: event.requested_model,
    resolved_model: event.resolved_model ?? null,
    upstream_model: event.upstream_model ?? null,
    provider: event.provider ?? null,
    provider_owner: event.provider_owner ?? null,
    provider_connection_id: event.provider_connection_id ?? null,
    status: event.status,
    success: event.success,
    input_tokens: event.input_tokens ?? null,
    output_tokens: event.output_tokens ?? null,
    cached_input_tokens: event.cached_input_tokens ?? null,
    reasoning_tokens: event.reasoning_tokens ?? null,
    total_tokens: event.total_tokens ?? null,
    latency_ms: event.latency_ms ?? null,
    estimated_cost_usd: event.estimated_cost_usd ?? null,
    cost_status: event.cost_status,
    usage_status: event.usage_status,
    error_code: event.error_code ?? null,
    error_message: event.error_message ?? null,
    stream: event.stream,
    metadata: event.metadata
  }));

  const { data, error } = await supabase.from("usage_events")
    .upsert(rows, { onConflict: "event_id", ignoreDuplicates: true })
    .select("event_id");

  if (error) return NextResponse.json({ error: "Database write failed", code: error.code }, { status: 500 });
  return NextResponse.json({
    accepted: data?.length ?? 0,
    received: rows.length,
    duplicates: rows.length - (data?.length ?? 0)
  }, { status: 202 });
}