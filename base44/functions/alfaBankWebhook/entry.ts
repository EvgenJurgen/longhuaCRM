import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Webhook от Alfa Bank при успешном платеже
Deno.serve(async (req) => {
  try {
    // Получаем данные от Alfa Bank (POST)
    const body = await req.text();
    const params = new URLSearchParams(body);

    const alfaToken = Deno.env.get('ALFA_BANK_TOKEN');
    if (!alfaToken) {
      console.error('ALFA_BANK_TOKEN not set');
      return new Response('0', { status: 200 });
    }

    // Параметры вебхука
    const orderId = params.get('orderId');
    const orderNumber = params.get('orderNumber');
    const amount = parseInt(params.get('amount') || '0') / 100; // из копеек
    const status = params.get('status');
    const checksum = params.get('checksum');

    if (!orderId || !orderNumber || status !== '1') {
      console.log('Invalid webhook params or status not 1');
      return new Response('0', { status: 200 });
    }

    // Verify checksum: md5(orderId;amount;currency;key)
    const crypto = await import('crypto');
    const expectedChecksum = crypto
      .createHash('md5')
      .update(`${orderId};${params.get('amount')};810;${alfaToken}`)
      .digest('hex');

    if (checksum !== expectedChecksum) {
      console.error('Checksum mismatch');
      return new Response('0', { status: 200 });
    }

    const base44 = createClientFromRequest(req);

    // Найти платёж по orderNumber
    const payments = await base44.asServiceRole.entities.Payment.filter({
      comment: { $contains: orderNumber },
    });

    if (payments.length === 0) {
      console.error('Payment not found for order:', orderNumber);
      return new Response('0', { status: 200 });
    }

    const payment = payments[0];
    const studentId = payment.student_id;
    const type = payment.package_type; // "package" или "course"

    // Обновляем платёж
    await base44.asServiceRole.entities.Payment.update(payment.id, {
      comment: `Оплачено через Alfa Bank - ${orderId}`,
    });

    if (type === 'package') {
      // Пополнение баланса уроков
      const students = await base44.asServiceRole.entities.Student.filter({ id: studentId });
      if (students.length > 0) {
        const student = students[0];
        const lessonsAdded = payment.lessons_added || 0;
        const newBalance = (student.lesson_balance || 0) + lessonsAdded;
        await base44.asServiceRole.entities.Student.update(studentId, {
          lesson_balance: newBalance,
        });

        // Telegram уведомление
        if (student.telegram_id) {
          const msg = `✅ Платёж успешно обработан!\n\n💳 Сумма: ${amount.toFixed(2)} BYN\n📚 Уроков добавлено: ${lessonsAdded}\n💡 Новый баланс: ${newBalance} уроков`;
          base44.functions.invoke('sendTelegramMessage', {
            chat_id: student.telegram_id,
            text: msg,
          }).catch(() => {});
        }
      }
    } else if (type === 'course') {
      // Активация курса
      const students = await base44.asServiceRole.entities.Student.filter({ id: studentId });
      if (students.length > 0) {
        const student = students[0];

        // Создаём запись курса
        await base44.asServiceRole.entities.Course.create({
          student_id: studentId,
          student_name: student.name,
          course_type: payment.comment?.includes('basic') ? 'basic_beginner' : 'advanced',
          course_name: payment.comment || 'Курс',
          total_lessons: 35,
          completed_lessons: 0,
          start_date: new Date().toISOString().split('T')[0],
          status: 'active',
        });

        // Telegram уведомление
        if (student.telegram_id) {
          const msg = `✅ Курс успешно активирован!\n\n📚 Тип: Групповой курс\n💳 Сумма: ${amount.toFixed(2)} BYN\n🎓 Всего занятий: 35 часов`;
          base44.functions.invoke('sendTelegramMessage', {
            chat_id: student.telegram_id,
            text: msg,
          }).catch(() => {});
        }
      }
    }

    return new Response('1', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response('0', { status: 200 });
  }
});