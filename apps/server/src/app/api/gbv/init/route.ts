import { NextResponse } from "next/server";
import { initGbvSession } from "@/lib/gbvServerService";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const response = initGbvSession(body);
  return NextResponse.json(response.body, { status: response.status });
}