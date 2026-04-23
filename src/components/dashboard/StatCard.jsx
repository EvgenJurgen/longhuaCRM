import React from "react";
import { Card } from "@/components/ui/card";

export default function StatCard({ title, value, icon: Icon, color = "indigo", subtitle }) {
  const colorMap = {
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", ring: "ring-indigo-100" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-100" },
    amber: { bg: "bg-amber-50", icon: "text-amber-600", ring: "ring-amber-100" },
    rose: { bg: "bg-rose-50", icon: "text-rose-600", ring: "ring-rose-100" },
    sky: { bg: "bg-sky-50", icon: "text-sky-600", ring: "ring-sky-100" },
  };
  const c = colorMap[color] || colorMap.indigo;

  return (
    <Card className="p-5 bg-white border-slate-200/70 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`h-10 w-10 rounded-xl ${c.bg} ring-1 ${c.ring} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${c.icon}`} />
        </div>
      </div>
    </Card>
  );
}