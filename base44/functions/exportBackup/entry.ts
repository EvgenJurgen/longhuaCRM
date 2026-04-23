import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Проверяем права админа
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Получаем все сущности
    const entities = [
      'Student', 'Teacher', 'Lesson', 'Payment', 'Course',
      'LessonMaterial', 'ScheduleSlot', 'LessonStudent',
      'LessonBalance', 'TeacherPayment', 'MaterialAccess',
      'TeacherAvailability', 'AlfaBankOrder', 'User'
    ];

    const backup = {};
    let totalRecords = 0;

    for (const entity of entities) {
      try {
        const records = await base44.asServiceRole.entities[entity].list('', 1000);
        backup[entity] = records || [];
        totalRecords += records.length;
      } catch (e) {
        // Некоторые сущности могут не существовать
        backup[entity] = [];
      }
    }

    // Добавляем метаданные
    backup._metadata = {
      exportedAt: new Date().toISOString(),
      totalRecords,
      exportedEntities: entities.length
    };

    // Преобразуем в JSON и кодируем в base64
    const jsonData = JSON.stringify(backup, null, 2);
    const base64Data = btoa(jsonData);

    return Response.json({
      success: true,
      data: base64Data,
      filename: `backup_${new Date().toISOString().split('T')[0]}.json.b64`,
      totalRecords
    });
  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});