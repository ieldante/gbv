import { NextResponse } from "next/server";
import { submitGbvEvidence } from "@/lib/gbvServerService";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const response = submitGbvEvidence(body);
  return NextResponse.json(response.body, { status: response.status });
}