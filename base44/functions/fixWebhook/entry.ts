// One-shot: force-register webhook with correct base44 function URL
Deno.serve(async (req) => {
  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return Response.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 400 });
    }

    const appId = Deno.env.get("BASE44_APP_ID");

    // Correct URL format per base44 docs
    const webhookUrl = `https://api.base44.app/api/apps/${appId}/functions/telegramWebhook`;

    console.log("Registering webhook:", webhookUrl);

    const delRes = await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=true`, {
      method: "POST",
    });
    const delData = await delRes.json();
    console.log("deleteWebhook:", JSON.stringify(delData));

    const setRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message"],
        drop_pending_updates: true,
      }),
    });
    const setData = await setRes.json();
    console.log("setWebhook:", JSON.stringify(setData));

    const infoRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const info = await infoRes.json();

    return Response.json({
      delete: delData,
      set: setData,
      webhook: info.result,
      target_url: webhookUrl,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});