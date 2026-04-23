import { Clock, Video, User } from "lucide-react";

const statusStyles = {
  planned: "bg-sky-50 text-sky-600 border-sky-100",
  completed: "bg-emerald-50 text-emerald-600 border-emerald-100",
  cancelled: "bg-red-50 text-red-500 border-red-100",
  rescheduled: "bg-amber-50 text-amber-600 border-amber-100",
};

export default function LessonRow({ lesson, role = "admin", onAction }) {
  // Get display names - prefer full names, fallback to names from lesson
  const getDisplayName = (firstName, lastName, fallback) => {
    if (firstName && lastName) return `${lastName} ${firstName}`;
    return fallback || "Unknown";
  };

  const studentDisplay = getDisplayName(
    lesson.student_first_name,
    lesson.student_last_name,
    lesson.student_name
  );
  const teacherDisplay = getDisplayName(
    lesson.teacher_first_name,
    lesson.teacher_last_name,
    lesson.teacher_name
  );

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group">
      <div className="w-1 h-10 rounded-full bg-indigo-400 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-700">
            {role === "teacher" ? studentDisplay : role === "student" ? teacherDisplay : `${studentDisplay} → ${teacherDisplay}`}
          </span>
          <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${statusStyles[lesson.status] || statusStyles.planned}`}>
            {lesson.status}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" /> {lesson.start_time} · {lesson.duration || 60}min
          </span>
          {lesson.meeting_link && (
            <a
              href={lesson.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700"
              onClick={(e) => e.stopPropagation()}
            >
              <Video className="w-3 h-3" /> Join
            </a>
          )}
        </div>
      </div>
      {onAction && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          {onAction}
        </div>
      )}
    </div>
  );
}