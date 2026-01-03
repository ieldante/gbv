/**
 * API route handler for GET /api/hello
 *
 * A simple health check / hello world endpoint.
 */

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Hello from Dante Ielceanu!",
    status: "ready",
    timestamp: new Date().toISOString(),
  });
}
