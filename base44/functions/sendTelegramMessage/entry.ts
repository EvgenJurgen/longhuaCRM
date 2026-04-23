// Sends a single Telegram message. Called from frontend via base44.functions.invoke.
Deno.serve(async (req) => {
  try {
    const { chat_id, text } = await req.json();

    if (!chat_id || !text) {
      return Response.json({ ok: false, error: "chat_id and text are required" }, { status: 400 });
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id, text }),
    });
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});