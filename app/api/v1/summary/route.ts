import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { isDatabaseConfigured, supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: NextRequest) {
  const expected = process.env.INGEST_API_KEY;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\\s+/i, "");
  if (!expected || !supplied) return false;
  return timingSafeEqual(createHash("sha256").update(expected).digest(), createHash("sha256").update(supplied).digest());
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDatabaseConfigured || !supabase) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from("usage_events")
    .select("status,success,input_tokens,output_tokens,total_tokens,latency_ms,estimated_cost_usd,provider,requested_model,source,occurred_at")
    .gte("occurred_at", since).order("occurred_at", { ascending: false }).limit(5000);
  if (error) return NextResponse.json({ error: "Could not load analytics" }, { status: 500 });

  const rows = data ?? [];
  const sum = (key: "input_tokens" | "output_tokens" | "total_tokens" | "estimated_cost_usd") =>
    rows.reduce((n, row) => n + Number(row[key] ?? 0), 0);
  const successful = rows.filter((r) => r.success).length;
  const providers = new Set(rows.map((r) => r.provider).filter(Boolean));
  const models = new Set(rows.map((r) => r.requested_model));
  return NextResponse.json({
    window: "24h",
    requests: rows.length,
    successful,
    failed: rows.length - successful,
    successRate: rows.length ? Number((successful / rows.length * 100).toFixed(2)) : 0,
    inputTokens: sum("input_tokens"),
    outputTokens: sum("output_tokens"),
    totalTokens: sum("total_tokens"),
    estimatedCostUsd: sum("estimated_cost_usd"),
    providers: providers.size,
    models: models.size,
    events: rows.slice(0, 100)
  });
}