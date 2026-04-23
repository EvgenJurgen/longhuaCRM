// Debug: logs everything Telegram sends, no auth required
Deno.serve(async (req) => {
  const body = await req.text();
  console.log("METHOD:", req.method);
  console.log("HEADERS:", JSON.stringify(Object.fromEntries(req.headers.entries())));
  console.log("BODY:", body);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});