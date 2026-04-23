import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Проверка статуса платежа в Alfa Bank
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId } = await req.json();
    if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 });

    const alfaToken = Deno.env.get('ALFA_BANK_TOKEN');
    const alfaMerchantId = Deno.env.get('ALFA_BANK_MERCHANT_ID');
    if (!alfaToken || !alfaMerchantId) {
      return Response.json({ error: 'Alfa Bank credentials not configured' }, { status: 500 });
    }

    const checkPayload = {
      userName: alfaMerchantId,
      password: alfaToken,
      orderId,
      language: 'RU',
    };

    const alfaRes = await fetch('https://pay.alfabank.by/api/getOrderStatusExtended.do', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(checkPayload).toString(),
    });

    const alfaData = await alfaRes.json();

    // Status codes: 0 = created, 1 = approved, 2 = declined, 3 = authorized, 4 = auth_failed, 5 = captured, 6 = capture_failed, 7 = refunded, 8 = refund_failed, 9 = declined_by_bank
    const isPaid = alfaData.orderStatus === 1 || alfaData.orderStatus === 5;

    return Response.json({
      ok: true,
      orderId,
      status: alfaData.orderStatus,
      statusLabel: getStatusLabel(alfaData.orderStatus),
      isPaid,
      amount: alfaData.amount ? (alfaData.amount / 100) : null,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getStatusLabel(status) {
  const labels = {
    0: 'Создан',
    1: 'Одобрен',
    2: 'Отклонён',
    3: 'Авторизован',
    4: 'Ошибка авторизации',
    5: 'Захвачен',
    6: 'Ошибка захвата',
    7: 'Возвращён',
    8: 'Ошибка возврата',
    9: 'Отклонён банком',
  };
  return labels[status] || 'Неизвестный статус';
}