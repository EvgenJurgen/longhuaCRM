import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Registers the telegramWebhook function URL as Telegram webhook
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return Response.json({ error: 'TELEGRAM_BOT_TOKEN не установлен в секретах приложения' }, { status: 400 });
    }

    const appId = Deno.env.get("BASE44_APP_ID");
    if (!appId) {
      return Response.json({ error: 'BASE44_APP_ID not found' }, { status: 400 });
    }

    // Stable webhook URL using the app's base44 domain
    const webhookUrl = `https://${appId}.base44.app/functions/telegramWebhook`;
    console.log("Setting webhook to:", webhookUrl);

    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message"] }),
    });
    const data = await res.json();
    console.log("setWebhook result:", JSON.stringify(data));

    // Get current webhook info
    const infoRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const info = await infoRes.json();

    return Response.json({
      set_result: data,
      webhook_info: info.result,
      attempted_url: webhookUrl,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});