import { useState } from "react";
import { X, RefreshCw } from "lucide-react";

const FORMAT_LABELS = { online: "Дистанционное", offline: "Очное" };

export default function LessonModal({ date, teachers, students, onSave, onClose, defaultTeacherId }) {
  const [form, setForm] = useState({
    teacher_id: defaultTeacherId || "",
    teacher_name: "",
    teacher_first_name: "",
    teacher_last_name: "",
    student_ids: [],
    date: date || "",
    start_time: "10:00",
    duration: 60,
    meeting_link: "",
    status: "planned",
    lesson_format: "online",
    notes: "",
  });
  const [recurring, setRecurring] = useState(false);
  const [recurringWeeks, setRecurringWeeks] = useState(4);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleStudent = (id) => {
    setForm(f => {
      const ids = f.student_ids.includes(id)
        ? f.student_ids.filter(s => s !== id)
        : [...f.student_ids, id];
      return { ...f, student_ids: ids };
    });
  };

  const handleSave = async () => {
    if (!form.teacher_id || form.student_ids.length === 0 || !form.date || !form.start_time) return;
    if (saving) return;

    // Проверка: не ранее чем за 2 часа до начала урока
    const lessonDateTime = new Date(`${form.date}T${form.start_time}`);
    const now = new Date();
    const hoursUntilLesson = (lessonDateTime - now) / (1000 * 60 * 60);
    if (hoursUntilLesson < 2) {
      alert("Урок должен быть запланирован не ранее чем за 2 часа до начала");
      return;
    }

    setSaving(true);
    const teacher = teachers.find(t => t.id === form.teacher_id);
    const selectedStudents = students.filter(s => form.student_ids.includes(s.id));
    const student_names = selectedStudents.map(s => s.name);
    await onSave({
      ...form,
      teacher_name: teacher?.name || form.teacher_name || "",
      teacher_first_name: teacher?.first_name || form.teacher_first_name || "",
      teacher_last_name: teacher?.last_name || form.teacher_last_name || "",
      student_id: form.student_ids[0],
      student_name: student_names[0] || "",
      student_names,
      student_first_name: selectedStudents[0]?.first_name || "",
      student_last_name: selectedStudents[0]?.last_name || "",
      duration: +form.duration,
    }, recurring, recurringWeeks);
    setSaving(false);
  };

  const activeStudents = students.filter(s => s.status !== "inactive");

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="text-base font-semibold text-slate-800">Запланировать урок</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Преподаватель *</label>
              <select value={form.teacher_id} onChange={e => {
                const t = teachers.find(x => x.id === e.target.value);
                set("teacher_id", e.target.value);
                set("teacher_name", t?.name || "");
                set("teacher_first_name", t?.first_name || "");
                set("teacher_last_name", t?.last_name || "");
              }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
                <option value="">Выбрать преподавателя</option>
                {teachers.filter(t => t.status !== "inactive").map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Multi-student selector */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Ученики * {form.student_ids.length > 0 && <span className="text-indigo-600">({form.student_ids.length} выбрано)</span>}
              </label>
              <div className="border border-slate-200 rounded-lg max-h-32 overflow-y-auto divide-y divide-slate-50">
                {activeStudents.map(s => (
                  <label key={s.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={form.student_ids.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                      className="accent-indigo-600"
                    />
                    <span className="text-sm text-slate-700">{s.name}</span>
                    <span className="text-xs text-slate-400 ml-auto">баланс: {s.lesson_balance || 0}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Дата *</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Время начала *</label>
              <input type="time" value={form.start_time} onChange={e => set("start_time", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Длительность (мин)</label>
              <select value={form.duration} onChange={e => set("duration", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
                {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} мин</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Формат</label>
              <select value={form.lesson_format} onChange={e => set("lesson_format", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400">
                <option value="online">Дистанционное</option>
                <option value="offline">Очное</option>
              </select>
            </div>
            {form.lesson_format === "online" && (
              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Ссылка на встречу</label>
                <input value={form.meeting_link} onChange={e => set("meeting_link", e.target.value)}
                  placeholder="https://zoom.us/j/... or meet.google.com/..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
              </div>
            )}
          </div>

          <div
            onClick={() => setRecurring(!recurring)}
            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              recurring ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${recurring ? "text-indigo-600" : "text-slate-400"}`} />
            <div>
              <p className={`text-xs font-semibold ${recurring ? "text-indigo-700" : "text-slate-600"}`}>Еженедельный повтор</p>
              <p className="text-[10px] text-slate-400">Создать повторяющиеся уроки каждую неделю</p>
            </div>
            <div className={`ml-auto w-4 h-4 rounded border-2 flex items-center justify-center ${recurring ? "border-indigo-600 bg-indigo-600" : "border-slate-300"}`}>
              {recurring && <span className="text-white text-[8px] font-bold">✓</span>}
            </div>
          </div>

          {recurring && (
            <div className="flex items-center gap-3 px-1">
              <label className="text-xs font-medium text-slate-600 whitespace-nowrap">Количество недель:</label>
              <input
                type="number"
                min={2}
                max={52}
                value={recurringWeeks}
                onChange={e => setRecurringWeeks(Math.max(2, Math.min(52, +e.target.value)))}
                onClick={e => e.stopPropagation()}
                className="w-20 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
              <span className="text-xs text-slate-400">= {recurringWeeks} уроков</span>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg">Отмена</button>
          <button onClick={handleSave}
            disabled={!form.teacher_id || form.student_ids.length === 0 || saving}
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40">
            {saving ? "Создание..." : recurring ? `Создать ${recurringWeeks} уроков` : "Создать урок"}
          </button>
        </div>
      </div>
    </div>
  );
}