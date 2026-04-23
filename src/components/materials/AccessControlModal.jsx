import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Users, Lock, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccessControlModal({ material, course, onClose, onSave }) {
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [accessType, setAccessType] = useState("student");

  useEffect(() => {
    const load = async () => {
      const me = await base44.auth.me();
      setUser(me);
      
      const [sts, trs, accesses] = await Promise.all([
        base44.entities.Student.list(),
        base44.entities.Teacher.list(),
        base44.entities.MaterialAccess.filter({ material_id: material.id }),
      ]);

      setStudents(sts);
      setTeachers(trs);

      if (accesses.length > 0) {
        const acc = accesses[0];
        setAccess(acc);
        setAccessType(acc.access_type);
        setSelectedStudents(acc.student_ids || []);
        setSelectedTeachers(acc.teacher_ids || []);
      } else {
        setAccess(null);
        setAccessType("student");
      }
      setLoading(false);
    };
    load();
  }, [material.id]);

  const toggleStudent = (id) => {
    setSelectedStudents(s =>
      s.includes(id) ? s.filter(x => x !== id) : [...s, id]
    );
  };

  const toggleTeacher = (id) => {
    setSelectedTeachers(s =>
      s.includes(id) ? s.filter(x => x !== id) : [...s, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const accessData = {
        material_id: material.id,
        access_type: accessType,
        student_ids: accessType === "student" ? selectedStudents : [],
        teacher_ids: accessType === "teacher" ? selectedTeachers : [],
        course_id: course?.id,
        granted_by: user.email,
        granted_date: new Date().toISOString(),
      };

      if (access) {
        await base44.entities.MaterialAccess.update(access.id, accessData);
      } else {
        await base44.entities.MaterialAccess.create(accessData);
      }
      onSave();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Управление доступом</h2>
            <p className="text-xs text-slate-500 mt-0.5">{material.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Access type selector */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700">Тип доступа</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "student", label: "Ученики", icon: "👤" },
                { value: "teacher", label: "Учителя", icon: "👨‍🏫" },
                { value: "public", label: "Публичный", icon: "🌐" },
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => {
                    setAccessType(value);
                    setSelectedStudents([]);
                    setSelectedTeachers([]);
                  }}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${
                    accessType === value
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-2xl mb-1 block">{icon}</span>
                  <p className="text-xs font-semibold text-slate-700">{label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Students selector */}
          {accessType === "student" && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Users className="h-4 w-4" /> Выберите учеников
              </p>
              <div className="border border-slate-200 rounded-xl divide-y max-h-64 overflow-y-auto">
                {students.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">Нет учеников</div>
                ) : (
                  students.map(s => (
                    <label key={s.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(s.id)}
                        onChange={() => toggleStudent(s.id)}
                        className="rounded accent-indigo-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-400">{s.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-slate-500">
                Выбрано: {selectedStudents.length} из {students.length}
              </p>
            </div>
          )}

          {/* Teachers selector */}
          {accessType === "teacher" && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Users className="h-4 w-4" /> Выберите учителей
              </p>
              <div className="border border-slate-200 rounded-xl divide-y max-h-64 overflow-y-auto">
                {teachers.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">Нет учителей</div>
                ) : (
                  teachers.map(t => (
                    <label key={t.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedTeachers.includes(t.id)}
                        onChange={() => toggleTeacher(t.id)}
                        className="rounded accent-indigo-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800">{t.name}</p>
                        {t.email && <p className="text-xs text-slate-400">{t.email}</p>}
                      </div>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-slate-500">
                Выбрано: {selectedTeachers.length} из {teachers.length}
              </p>
            </div>
          )}

          {/* Public notice */}
          {accessType === "public" && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-sm text-blue-700 flex items-start gap-2">
              <Lock className="h-4 w-4 mt-0.5 shrink-0" />
              <p>Материал будет доступен всем, кто имеет доступ к библиотеке</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Сохранить доступ
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}