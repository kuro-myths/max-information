import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) return NextResponse.json({ error: "DASHBOARD_SECRET is not configured" }, { status: 503 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const password = typeof body === "object" && body !== null && "password" in body && typeof body.password === "string" ? body.password : "";
  const expected = createHash("sha256").update(secret).digest();
  const supplied = createHash("sha256").update(password).digest();
  if (!password || !timingSafeEqual(expected, supplied)) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set("max_dashboard", secret, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 60 * 60 * 12 });
  return response;
}
