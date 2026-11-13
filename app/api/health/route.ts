import { NextResponse } from "next/server";
import { isDatabaseConfigured, supabase } from "@/lib/supabase";

export const runtime = "nodejs";
export async function GET() {
  let database: "connected" | "not_configured" | "error" = "not_configured";
  if (isDatabaseConfigured && supabase) {
    const { error } = await supabase.from("usage_events").select("id", { count: "exact", head: true });
    database = error ? "error" : "connected";
  }
  return NextResponse.json({
    ok: database !== "error",
    service: "max-information",
    version: "1.0.0",
    database,
    ingestConfigured: Boolean(process.env.INGEST_API_KEY),
    timestamp: new Date().toISOString()
  }, { status: database === "error" ? 503 : 200 });
}