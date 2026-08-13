import React from "react";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Layers, 
  Briefcase 
} from "lucide-react";
import { DashboardData, Task } from "../types";

interface DashboardViewProps {
  data: DashboardData | null;
  tasks: Task[];
  loading: boolean;
  onNavigate: (view: string) => void;
  onOpenTaskDetail: (task: Task) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  data, 
  tasks, 
  loading, 
  onNavigate, 
  onOpenTaskDetail 
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-zinc-400">
        <AlertTriangle className="mb-4 h-12 w-12 text-zinc-600" />
        <p>No dashboard data available. Connect to database and seed data.</p>
      </div>
    );
  }

  const { task_summary: summary, workload, recently_completed: completed, hermes_alerts: alerts } = data;

  // Workload bar percentage
  const workloadPercent = Math.min(Math.round((workload.minutes / workload.capacity_minutes) * 100), 100);

  // Filter tasks to show today's focus (deadline is today, not done)
  const todayFocusTasks = tasks.filter(t => {
    if (t.status === "DONE" || !t.deadline) return false;
    const todayStr = new Date().toISOString().slice(0, 10);
    return t.deadline.startsWith(todayStr);
  });

  // Filter tasks to show active overdue
  const overdueTasks = tasks.filter(t => t.status !== "DONE" && t.deadline_status === "OVERDUE");

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="rounded-2xl border border-zinc-800 bg-gradient-to-r from-emerald-950/20 via-zinc-900 to-zinc-900 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-white">
              {getGreeting()}, Aris 👋
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Sistem bekerja memantau produktivitas Anda. <span className="font-semibold text-emerald-400">You work. Alkhasya remembers.</span>
            </p>
          </div>
          <button 
            onClick={() => onNavigate("tasks")}
            className="self-start rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition"
          >
            Buka Kanban Board
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Tasks */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition cursor-pointer" onClick={() => onNavigate("tasks")}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-zinc-800 p-2 text-zinc-400">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-zinc-400">Total Tugas</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold">{summary.total}</span>
            <span className="text-xs text-zinc-500">{summary.completed} selesai</span>
          </div>
        </div>

        {/* Due Today */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition cursor-pointer" onClick={() => onNavigate("tasks")}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-zinc-400">Hari Ini</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400">{summary.due_today}</span>
            <span className="text-xs text-zinc-500">tenggat hari ini</span>
          </div>
        </div>

        {/* Overdue */}
        <div 
          onClick={() => onNavigate("tasks")}
          className={`rounded-xl border p-4 hover:border-zinc-700 transition cursor-pointer ${summary.overdue > 0 ? "border-red-500/20 bg-red-950/5" : "border-zinc-800 bg-zinc-900/50"}`}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${summary.overdue > 0 ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-400"}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-zinc-400">Terlambat (Overdue)</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${summary.overdue > 0 ? "text-red-400" : ""}`}>{summary.overdue}</span>
            <span className="text-xs text-zinc-500">lewat deadline</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition cursor-pointer" onClick={() => onNavigate("tasks")}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-zinc-400">Dikerjakan</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400">{summary.in_progress}</span>
            <span className="text-xs text-zinc-500">dalam pengerjaan</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Left Column: Alerts & Workload */}
        <div className="space-y-6 md:col-span-3">
          {/* Alkhasya Watching Alarms */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <span className="text-emerald-400">⚡</span> Alkhasya Watching
            </h2>
            <div className="mt-4 space-y-3">
              {alerts.length > 0 ? (
                alerts.map((alert, idx) => {
                  const isWarning = alert.includes("⚠️");
                  const isInfo = alert.includes("💡");
                  
                  // Clean naming from Hermes to Alkhasya inside logs dynamically
                  const cleanAlert = alert
                    .replace(/Hermes/g, "Alkhasya")
                    .replace(/^[⚠️💡]\s*/, "");

                  return (
                    <div 
                      key={idx} 
                      className={`flex gap-3 rounded-xl border p-4 text-sm ${
                        isWarning 
                          ? "border-red-500/20 bg-red-950/10 text-red-200" 
                          : isInfo 
                          ? "border-amber-500/20 bg-amber-950/10 text-amber-200"
                          : "border-zinc-800 bg-zinc-900 text-zinc-300"
                      }`}
                    >
                      <div className="mt-0.5 select-none">
                        {isWarning ? "🔴" : isInfo ? "🍊" : "🔵"}
                      </div>
                      <p className="leading-relaxed">{cleanAlert}</p>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="mb-2 h-10 w-10 text-emerald-500" />
                  <p className="text-sm text-zinc-400">Semua aman! Alkhasya tidak mendeteksi anomali deadline maupun inaktivitas saat ini.</p>
                </div>
              )}
            </div>
          </div>

          {/* Today's Focus Clickable Tasks */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
            <h2 className="text-lg font-bold text-white">Fokus Hari Ini ({todayFocusTasks.length})</h2>
            <div className="mt-4 space-y-3">
              {todayFocusTasks.length > 0 ? (
                todayFocusTasks.map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => onOpenTaskDetail(task)}
                    className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 hover:border-zinc-700 hover:bg-zinc-900/50 transition cursor-pointer"
                  >
                    <div className="flex items-start gap-3 truncate">
                      <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 mt-0.5">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="truncate text-left">
                        <h4 className="text-sm font-bold text-zinc-200 truncate">{task.title}</h4>
                        {task.project_name && <p className="text-[10px] text-zinc-500">📁 {task.project_name}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-400">
                        {task.deadline ? new Date(task.deadline).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 text-center py-4">Tidak ada tugas dengan tenggat waktu hari ini. Anda santai atau bebas merencanakan!</p>
              )}
            </div>
          </div>

          {/* Overdue Clickable Tasks */}
          {overdueTasks.length > 0 && (
            <div className="rounded-2xl border border-red-500/20 bg-red-950/5 p-6 animate-pulse-glow">
              <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Tugas Terlambat ({overdueTasks.length})
              </h2>
              <div className="mt-4 space-y-3">
                {overdueTasks.map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => onOpenTaskDetail(task)}
                    className="flex items-center justify-between gap-4 rounded-xl border border-red-500/10 bg-red-950/10 p-4 hover:border-red-500/30 transition cursor-pointer"
                  >
                    <div className="flex items-start gap-3 truncate text-left">
                      <div className="rounded-lg bg-red-500/10 p-2 text-red-400 mt-0.5">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-sm font-bold text-red-200 truncate">{task.title}</h4>
                        {task.project_name && <p className="text-[10px] text-red-400/60">📁 {task.project_name}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-red-400 font-bold">OVERDUE</p>
                      <p className="text-[9px] text-red-400/60">
                        {task.deadline ? new Date(task.deadline).toLocaleDateString("id-ID", { month: "short", day: "numeric" }) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workload Capacity Gauge */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Rencana Beban Kerja Hari Ini</h2>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${workload.is_overloaded ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"}`}>
                {workload.is_overloaded ? "Overloaded" : "Optimal"}
              </span>
            </div>
            
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Total estimasi:</span>
                <span className="font-bold text-zinc-200">{workload.hours} Jam <span className="font-normal text-zinc-500">/ {workload.capacity_hours} Jam kerja</span></span>
              </div>
              
              {/* Progress Bar Container */}
              <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${workload.is_overloaded ? "bg-red-500" : "bg-emerald-500"}`}
                  style={{ width: `${workloadPercent}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
                *Beban kerja dihitung dari total estimasi waktu tugas yang tenggat hari ini ditambah tugas yang statusnya sedang dikerjakan (IN_PROGRESS). Kapasitas harian disetel 8 Jam.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Recently Completed Clickable */}
        <div className="md:col-span-2">
          <div className="h-full rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6">
            <h2 className="text-lg font-bold text-white">Selesai Baru-baru Ini</h2>
            
            <div className="mt-4 space-y-4">
              {completed.length > 0 ? (
                completed.map((compTask) => {
                  // Find the matched task row from the global tasks list to obtain complete details
                  const taskRow = tasks.find(t => t.id === compTask.id);
                  
                  return (
                    <div 
                      key={compTask.id} 
                      onClick={() => taskRow && onOpenTaskDetail(taskRow)}
                      className="flex gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/20 p-3 hover:border-zinc-700 hover:bg-zinc-900/50 transition cursor-pointer text-left"
                    >
                      <div className="mt-0.5 text-emerald-400 flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-sm font-semibold text-zinc-100 line-through decoration-zinc-600 truncate">
                          {compTask.title}
                        </h4>
                        {compTask.project_name && (
                          <p className="mt-1 text-xs text-zinc-500 flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> {compTask.project_name}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-zinc-500">
                          Selesai: {new Date(compTask.completed_at).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-40 flex-col items-center justify-center text-center text-zinc-500">
                  <CheckCircle2 className="mb-2 h-8 w-8 text-zinc-700" />
                  <p className="text-xs">Belum ada tugas yang diselesaikan hari ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
