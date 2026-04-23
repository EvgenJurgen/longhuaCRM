import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return Response.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 400 });
    }

    const [meRes, webhookRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${botToken}/getMe`),
      fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`),
    ]);

    const meData = await meRes.json();
    const webhookData = await webhookRes.json();

    return Response.json({
      bot: meData.result,
      webhook: webhookData.result,
      token_last5: botToken.slice(-5),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});