import { NextResponse } from "next/server";
import { getGbvReceipt } from "@/lib/gbvServerService";

export async function GET(
  _req: Request,
  context: { params: Promise<{ receiptId: string }> },
) {
  const params = await context.params;
  const response = getGbvReceipt(params.receiptId);
  return NextResponse.json(response.body, { status: response.status });
}