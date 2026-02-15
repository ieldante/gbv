import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "ready",
    service: "gbv-server",
    timestamp: new Date().toISOString(),
  });
}