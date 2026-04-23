import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Sends reminders 2 hours before lessons
// Scheduled every 5 minutes — checks a 15-min window to avoid gaps
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not set" });
    }

    // All lesson times are stored as HH:MM in Europe/Minsk (UTC+3).
    // We compare everything in UTC.
    const now = new Date();
    const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

    // Window: lessons starting in 110–125 minutes from now (UTC)
    const windowStart = new Date(now.getTime() + 110 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + 125 * 60 * 1000);

    // Determine which MSK calendar dates to query (today and maybe tomorrow)
    const mskNow = new Date(now.getTime() + MSK_OFFSET_MS);
    const mskWindowEnd = new Date(windowEnd.getTime() + MSK_OFFSET_MS);
    const todayStr    = mskNow.toISOString().split("T")[0];
    const tomorrowStr = mskWindowEnd.toISOString().split("T")[0];

    const dates = todayStr === tomorrowStr ? [todayStr] : [todayStr, tomorrowStr];

    const allLessons = [];
    for (const date of dates) {
      const lessons = await base44.asServiceRole.entities.Lesson.filter({ date, status: "planned" });
      allLessons.push(...lessons);
    }

    if (allLessons.length === 0) {
      return Response.json({ ok: true, sent: 0, checked: 0 });
    }

    // Filter lessons falling inside our 2-hour window that haven't been notified yet
    const targetLessons = allLessons.filter(lesson => {
      if (lesson.reminder_2h_sent) return false;
      const lessonUtc = new Date(`${lesson.date}T${lesson.start_time}:00.000+03:00`);
      return lessonUtc >= windowStart && lessonUtc < windowEnd;
    });

    console.log(`now=${now.toISOString()} | window=${windowStart.toISOString()}–${windowEnd.toISOString()} | checked=${allLessons.length} | matched=${targetLessons.length}`);

    if (targetLessons.length === 0) {
      return Response.json({ ok: true, sent: 0, checked: allLessons.length });
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

    for (const lesson of targetLessons) {
      const teacher = teacherMap[lesson.teacher_id];
      const studentIds = lesson.student_ids?.length ? lesson.student_ids : lesson.student_id ? [lesson.student_id] : [];
      const lessonStudents = studentIds.map(id => studentMap[id]).filter(Boolean);

      const dateStr     = lesson.date;
      const timeStr     = lesson.start_time;
      const duration    = lesson.duration || 60;
      const formatStr   = lesson.lesson_format === "offline" ? "очно" : "онлайн";
      const teacherName = teacher?.name || "Преподаватель";
      const studentNames = lessonStudents.map(s => s.name).join(", ") || "—";

      // Mark as sent FIRST to avoid duplicate sends on retry
      await base44.asServiceRole.entities.Lesson.update(lesson.id, { reminder_2h_sent: true });

      // Notify students
      for (const student of lessonStudents) {
        if (!student.telegram_id) continue;
        let msg = `⏰ Напоминание: занятие через 2 часа!\n\n📅 ${dateStr} в ${timeStr} (${duration} мин, ${formatStr})\n👩‍🏫 Преподаватель: ${teacherName}`;
        if (lesson.meeting_link && lesson.lesson_format !== "offline") {
          msg += `\n\n🔗 Ссылка на урок:\n${lesson.meeting_link}`;
        }
        await sendMsg(student.telegram_id, msg);
      }

      // Notify teacher
      if (teacher?.telegram_id) {
        let msg = `⏰ Напоминание: занятие через 2 часа!\n\n📅 ${dateStr} в ${timeStr} (${duration} мин, ${formatStr})\n👤 Ученик${lessonStudents.length > 1 ? "и" : ""}: ${studentNames}`;
        if (lesson.meeting_link && lesson.lesson_format !== "offline") {
          msg += `\n\n🔗 Ссылка на урок:\n${lesson.meeting_link}`;
        }
        await sendMsg(teacher.telegram_id, msg);
      }
    }

    return Response.json({ ok: true, sent: sentCount, lessons_matched: targetLessons.length });
  } catch (error) {
    console.error(error.message);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
});