import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Инициирует платёж в Alfa Bank
// Параметры: type ("package"|"course"), itemId, studentId, amount, redirectUrl
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, itemId, studentId, amount, returnUrl } = await req.json();

    if (!type || !itemId || !studentId || !amount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const alfaToken = Deno.env.get('ALFA_BANK_TOKEN');
    const alfaMerchantId = Deno.env.get('ALFA_BANK_MERCHANT_ID');
    if (!alfaToken || !alfaMerchantId) {
      return Response.json({ error: 'Alfa Bank credentials not configured' }, { status: 500 });
    }

    // Создаём заказ в БД со статусом "pending"
    const orderData = {
      student_id: studentId,
      type, // "package" или "course"
      item_id: itemId,
      amount,
      status: 'pending',
      order_number: `ALF-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    // Сохраняем заказ в временную таблицу
    const order = await base44.asServiceRole.entities.Payment.create({
      student_id: studentId,
      amount,
      lessons_added: 0,
      package_type: type,
      payment_date: new Date().toISOString().split('T')[0],
      comment: `Pending Alfa Bank - Order ${orderData.order_number}`,
    });

    // Вызываем API Alfa Bank для создания платежа
    const alfaPayload = {
      userName: alfaMerchantId,
      password: alfaToken,
      orderNumber: orderData.order_number,
      amount: Math.round(amount * 100), // в копейках
      returnUrl: returnUrl || `${new URL(req.url).origin}/success`,
      description: `${type === 'package' ? 'Пакет уроков' : 'Курс'} - ${itemId}`,
      clientId: studentId,
      expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      language: 'RU',
    };

    const alfaRes = await fetch('https://pay.alfabank.by/api/register.do', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(alfaPayload).toString(),
    });

    const alfaData = await alfaRes.json();

    if (alfaData.errorCode !== undefined && alfaData.errorCode !== 0) {
      console.error('Alfa Bank error:', alfaData);
      return Response.json({ 
        error: 'Payment gateway error',
        details: alfaData.errorMessage 
      }, { status: 500 });
    }

    // Сохраняем orderId от Alfa Bank для вебхука
    await base44.asServiceRole.entities.Payment.update(order.id, {
      comment: `Alfa Bank - orderId: ${alfaData.orderId}`,
    });

    return Response.json({
      ok: true,
      orderId: alfaData.orderId,
      redirectUrl: alfaData.formUrl,
      paymentId: order.id,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});