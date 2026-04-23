import { useState } from "react";
import { CreditCard, TrendingUp, DollarSign, Download, ShoppingBag, FileText, Settings, Send } from "lucide-react";

// Import content from existing pages (inline as tabs)
import Payments from "./Payments";
import Analytics from "./Analytics";
import Salary from "./Salary";
import ExportData from "./ExportData";
import ShopSettingsAdmin from "./ShopSettingsAdmin";
import WelcomePageEditor from "./WelcomePageEditor";
import AdminSettings from "./AdminSettings";
import TelegramSettings from "./TelegramSettings";

const TABS = [
  { id: "payments",   label: "Платежи",            icon: CreditCard },
  { id: "analytics",  label: "Аналитика",           icon: TrendingUp },
  { id: "salary",     label: "Зарплата",            icon: DollarSign },
  { id: "export",     label: "Экспорт",             icon: Download },
  { id: "shop",       label: "Магазин",             icon: ShoppingBag },
  { id: "welcome",    label: "Страница встречи",    icon: FileText },
  { id: "telegram",   label: "Telegram Bot",        icon: Send },
  { id: "integrations", label: "Интеграции",        icon: Settings },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("payments");

  return (
    <div className="flex flex-col h-full min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top tab bar */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 lg:px-8 overflow-x-auto">
        <div className="flex gap-1 py-2 min-w-max">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "payments"      && <Payments />}
        {activeTab === "analytics"     && <Analytics />}
        {activeTab === "salary"        && <Salary />}
        {activeTab === "export"        && <ExportData />}
        {activeTab === "shop"          && <ShopSettingsAdmin />}
        {activeTab === "welcome"       && <WelcomePageEditor />}
        {activeTab === "telegram"      && <TelegramSettings />}
        {activeTab === "integrations"  && <AdminSettings />}
      </div>
    </div>
  );
}