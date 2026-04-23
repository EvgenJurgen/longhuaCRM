// Telegram webhook - handles /start command
// Called directly by Telegram (no user auth context)
Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    console.log("Incoming body:", rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch(e) {
      console.error("Failed to parse JSON:", e.message);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const message = body?.message;

    if (!message) {
      console.log("No message in body, ignoring");
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const chatId = message.chat?.id;
    const text = message.text || "";
    const firstName = message.from?.first_name || "Пользователь";

    console.log(`chatId=${chatId}, text="${text}", firstName="${firstName}"`);

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN not set");
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (!text.startsWith("/start") || !chatId) {
      console.log("Not a /start command or no chatId, ignoring");
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const welcomeMsg = `🎉 Спасибо за подключение уведомлений!\n\nПривет, ${firstName}! Ваш Telegram успешно привязан к платформе Longhua Chinese 🐉\n\nТеперь вы будете получать уведомления:\n• ✅ О завершении уроков\n• ⏰ Напоминания перед занятиями\n• 💳 О пополнении баланса\n\nУдачи в изучении китайского языка! 加油！`;

    const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: welcomeMsg }),
    });

    const sendData = await sendRes.json();
    console.log("Send result:", JSON.stringify(sendData));

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
});