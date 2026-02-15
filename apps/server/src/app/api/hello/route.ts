export async function GET() {
  return new Response("Hello!", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
