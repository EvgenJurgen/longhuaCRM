import React, { useState } from "react";
import { X, Share2, Eye, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ModernMaterialActionModal({ 
  selectedCount, 
  onClose, 
  onGrantAccess, 
  loading 
}) {
  const [action, setAction] = useState(null); // null | "grant" | "success"

  const handleAction = (type) => {
    setAction(type);
    if (type === "grant") {
      onGrantAccess?.();
    }
  };

  if (action === "success") {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Готово!</h3>
          <p className="text-sm text-slate-600 mb-6">
            {selectedCount} материал{selectedCount % 10 === 1 ? "" : "ов"} успешно обработано
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header - Windows Fluent Design */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Управление материалами</h2>
            <p className="text-xs text-slate-500 mt-1">
              Выбрано {selectedCount} {selectedCount % 10 === 1 ? "материал" : "материалов"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors text-slate-500 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-3">
            {/* Grant access action */}
            <button
              onClick={() => handleAction("grant")}
              disabled={loading}
              className="w-full group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all duration-200 disabled:opacity-50 text-left"
            >
              <div className="relative z-10 flex items-start gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                  <Share2 className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">Выдать доступ ученикам</p>
                  <p className="text-xs text-slate-600 mt-0.5">Предоставить право на просмотр выбранных файлов</p>
                </div>
                {loading && <Loader2 className="h-4 w-4 animate-spin text-indigo-600 ml-auto" />}
              </div>
            </button>

            {/* View details action */}
            <button
              disabled
              className="w-full group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 opacity-50 cursor-not-allowed text-left"
            >
              <div className="relative z-10 flex items-start gap-3">
                <div className="p-2.5 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <Eye className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 text-sm">Просмотреть детали</p>
                  <p className="text-xs text-slate-600 mt-0.5">Информация по каждому файлу</p>
                </div>
              </div>
            </button>

            {/* Download action */}
            <button
              disabled
              className="w-full group relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 opacity-50 cursor-not-allowed text-left"
            >
              <div className="relative z-10 flex items-start gap-3">
                <div className="p-2.5 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                  <Download className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-700 text-sm">Скачать архив</p>
                  <p className="text-xs text-slate-600 mt-0.5">ZIP файл со всеми материалами</p>
                </div>
              </div>
            </button>
          </div>

          {/* Info box */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200 flex gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Действия применяются только к выбранным материалам
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => setAction("success")}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}