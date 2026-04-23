// Utility: drop pending Telegram updates and re-register webhook clean
Deno.serve(async (req) => {
  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return Response.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 400 });
    }

    // 1. Delete webhook (drops all pending updates)
    const deleteRes = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=true`, {
      method: "POST",
    });
    const deleteData = await deleteRes.json();
    console.log("deleteWebhook:", JSON.stringify(deleteData));

    // 2. Re-register webhook
    const reqUrl = new URL(req.url);
    const webhookUrl = `${reqUrl.protocol}//${reqUrl.host}/telegramWebhook`;

    const setRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        drop_pending_updates: true,
        allowed_updates: ["message"],
      }),
    });
    const setData = await setRes.json();
    console.log("setWebhook:", JSON.stringify(setData));

    // 3. Check final status
    const infoRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const info = await infoRes.json();

    return Response.json({
      delete_result: deleteData,
      set_result: setData,
      final_webhook: info.result,
      webhook_url: webhookUrl,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});