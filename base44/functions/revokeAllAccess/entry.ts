import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Получаем все записи доступа
    const allAccess = await base44.asServiceRole.entities.MaterialAccess.list();

    // Удаляем все записи, которые не от ADMIN (или удаляем все)
    let deletedCount = 0;
    for (const access of allAccess) {
      if (access.granted_by_role !== 'ADMIN') {
        await base44.asServiceRole.entities.MaterialAccess.delete(access.id);
        deletedCount++;
      }
    }

    return Response.json({
      success: true,
      message: `Удалено ${deletedCount} записей доступа`,
      deletedCount,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});