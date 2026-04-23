import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Получаем все запланированные уроки
    const lessons = await base44.asServiceRole.entities.Lesson.list('', 1000);
    
    const now = new Date();
    let completedCount = 0;
    
    for (const lesson of lessons) {
      // Пропускаем если уже завершён или отменён
      if (lesson.status !== 'planned') continue;
      
      // Вычисляем время окончания урока
      const [hours, minutes] = lesson.start_time.split(':').map(Number);
      const lessonDate = new Date(lesson.date);
      lessonDate.setHours(hours, minutes, 0, 0);
      
      const duration = lesson.duration || 60;
      const lessonEndTime = new Date(lessonDate.getTime() + duration * 60 * 1000);
      
      // Если урок уже закончился, помечаем его как завершённый
      if (now >= lessonEndTime) {
        await base44.asServiceRole.entities.Lesson.update(lesson.id, {
          status: 'completed'
        });
        completedCount++;
      }
    }
    
    return Response.json({ 
      success: true, 
      message: `Автоматически завершено уроков: ${completedCount}` 
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});