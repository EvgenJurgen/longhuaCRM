import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Scheduled: every day at 09:00 MSK — sends reminders for tomorrow's lessons
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not set" });
    }

    // Tomorrow's date in Minsk time (UTC+3)
    const now = new Date();
    const mskNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const tomorrow = new Date(mskNow);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    const allTomorrow = await base44.asServiceRole.entities.Lesson.filter({ date: tomorrowStr, status: "planned" });
    // Skip lessons that already got a 24h reminder
    const lessons = allTomorrow.filter(l => !l.reminder_24h_sent);

    if (lessons.length === 0) {
      return Response.json({ ok: true, sent: 0, message: "No lessons tomorrow" });
    }

    const [students, teachers] = await Promise.all([
      base44.asServiceRole.entities.Student.list(),
      base44.asServiceRole.entities.Teacher.list(),
    ]);
    const studentMap = Object.fromEntries(students.map(s => [s.id, s]));
    const teacherMap = Object.fromEntries(teachers.map(t => [t.id, t]));

    let sentCount = 0;
    const sendMsg = async (chatId, text) => {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      const data = await res.json();
      if (data.ok) sentCount++;
      else console.log(`Send failed to ${chatId}: ${data.description}`);
    };

    for (const lesson of lessons) {
      // Mark as sent FIRST to avoid duplicates on retry
      await base44.asServiceRole.entities.Lesson.update(lesson.id, { reminder_24h_sent: true });

      const teacher = teacherMap[lesson.teacher_id];
      const studentIds = lesson.student_ids?.length ? lesson.student_ids : lesson.student_id ? [lesson.student_id] : [];
      const lessonStudents = studentIds.map(id => studentMap[id]).filter(Boolean);

      const timeStr   = lesson.start_time;
      const duration  = lesson.duration || 60;
      const formatStr = lesson.lesson_format === "offline" ? "очно" : "онлайн";

      // Remind students
      for (const student of lessonStudents) {
        if (!student.telegram_id) continue;
        const teacherName = teacher?.name || "Преподаватель";
        let msg = `📅 Напоминание об уроке!\n\nЗавтра в ${timeStr} (${duration} мин, ${formatStr})\n👩‍🏫 Преподаватель: ${teacherName}\n💡 Баланс уроков: ${student.lesson_balance || 0}`;
        if (lesson.meeting_link && lesson.lesson_format !== "offline") {
          msg += `\n\n🔗 Ссылка на урок:\n${lesson.meeting_link}`;
        }
        await sendMsg(student.telegram_id, msg);
      }

      // Remind teacher
      if (teacher?.telegram_id) {
        const studentNames = lessonStudents.map(s => s.name).join(", ") || "—";
        let msg = `📅 Напоминание об уроке!\n\nЗавтра в ${timeStr} (${duration} мин, ${formatStr})\n👤 Ученик${lessonStudents.length > 1 ? "и" : ""}: ${studentNames}`;
        if (lesson.meeting_link && lesson.lesson_format !== "offline") {
          msg += `\n\n🔗 Ссылка на урок:\n${lesson.meeting_link}`;
        }
        await sendMsg(teacher.telegram_id, msg);
      }
    }

    return Response.json({ ok: true, sent: sentCount, lessons: lessons.length });
  } catch (error) {
    console.error(error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});