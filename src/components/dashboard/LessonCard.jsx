import React from "react";
import { Clock, User, GraduationCap, Video, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const statusStyles = {
  planned: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  rescheduled: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function LessonCard({ lesson, showTeacher = true, showStudent = true, onClick }) {
  return (
    <div 
      className="p-4 bg-white rounded-xl border border-slate-200/70 hover:shadow-sm transition-all cursor-pointer group"
      onClick={() => onClick?.(lesson)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-indigo-500" />
          <span className="text-sm font-semibold text-slate-900">{lesson.start_time}</span>
          <span className="text-xs text-slate-400">{lesson.duration || 60} min</span>
        </div>
        <Badge variant="outline" className={`text-[11px] ${statusStyles[lesson.status] || statusStyles.planned}`}>
          {lesson.status}
        </Badge>
      </div>

      <div className="space-y-1.5">
        {showStudent && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="h-3.5 w-3.5 text-slate-400" />
            <span>{lesson.student_name || "—"}</span>
          </div>
        )}
        {showTeacher && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
            <span>{lesson.teacher_name || "—"}</span>
          </div>
        )}
      </div>

      {lesson.meeting_link && (
        <a
          href={lesson.meeting_link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
        >
          <Video className="h-3.5 w-3.5" />
          Join Meeting
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}