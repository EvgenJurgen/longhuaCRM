import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Polls Telegram for new messages and responds to /start
// Runs every 5 min via scheduler, but loops internally for near-instant response
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not set" });
    }

    // Get stored offset once at start
    const offsetSettings = await base44.asServiceRole.entities.AppSettings.filter({ key: "telegram_poll_offset" });
    let offset = offsetSettings.length > 0 ? parseInt(offsetSettings[0].value || "0") : 0;
    let totalProcessed = 0;
    let lastOffsetRecord = offsetSettings[0] || null;

    const welcomeMsg = (firstName) =>
      `🎉 Спасибо за подключение уведомлений!\n\nПривет, ${firstName}! Ваш Telegram успешно привязан к платформе Longhua Chinese 🐉\n\nТеперь вы будете получать уведомления:\n• ✅ О завершении уроков\n• ⏰ Напоминания перед занятиями\n• 💳 О пополнении баланса\n\nУдачи в изучении китайского языка! 加油！`;

    const deadline = Date.now() + 4 * 60 * 1000; // loop for up to 4 minutes

    while (Date.now() < deadline) {
      // Long-poll: wait up to 25s for new updates
      const updatesRes = await fetch(
        `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=25&allowed_updates=message`
      );
      const updatesData = await updatesRes.json();

      if (!updatesData.ok || !updatesData.result?.length) {
        // No updates in this 25s window, loop again if time remains
        continue;
      }

      const updates = updatesData.result;

      for (const update of updates) {
        const message = update.message;
        if (message?.text?.startsWith("/start") && message.chat?.id) {
          const chatId = message.chat.id;
          const firstName = message.from?.first_name || "Пользователь";

          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: welcomeMsg(firstName) }),
          });

          totalProcessed++;
          console.log(`Replied to /start from chatId=${chatId} (${firstName})`);
        }
      }

      // Advance offset past processed updates
      const newOffset = updates[updates.length - 1].update_id + 1;
      offset = newOffset;

      // Persist offset to DB
      if (lastOffsetRecord) {
        await base44.asServiceRole.entities.AppSettings.update(lastOffsetRecord.id, { value: String(newOffset) });
      } else {
        lastOffsetRecord = await base44.asServiceRole.entities.AppSettings.create({
          key: "telegram_poll_offset",
          value: String(newOffset),
          description: "Telegram polling offset",
        });
      }
    }

    return Response.json({ ok: true, processed: totalProcessed, final_offset: offset });
  } catch (error) {
    console.error("Polling error:", error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});