import { NextResponse } from "next/server";
import { isDatabaseConfigured, supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured || !supabase) return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from("usage_events")
    .select("occurred_at,requested_model,provider,source,status,total_tokens,latency_ms,usage_status,success,input_tokens,output_tokens,estimated_cost_usd")
    .gte("occurred_at", since).order("occurred_at", { ascending: false }).limit(5000);
  if (error) return NextResponse.json({ error: "Database query failed" }, { status: 500 });
  const rows = data ?? [];
  const sum = (key: "input_tokens" | "output_tokens" | "total_tokens" | "estimated_cost_usd") => rows.reduce((n, r) => n + Number(r[key] ?? 0), 0);
  const successful = rows.filter(r => r.success).length;
  return NextResponse.json({
    requests: rows.length, successful, failed: rows.length-successful,
    successRate: rows.length ? Number((successful/rows.length*100).toFixed(2)) : 0,
    inputTokens: sum("input_tokens"), outputTokens: sum("output_tokens"),
    totalTokens: sum("total_tokens"), estimatedCostUsd: sum("estimated_cost_usd"),
    providers: new Set(rows.map(r=>r.provider).filter(Boolean)).size,
    models: new Set(rows.map(r=>r.requested_model)).size,
    events: rows.slice(0,100)
  });
}