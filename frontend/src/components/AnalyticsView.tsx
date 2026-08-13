import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Task } from "../types";
import { Award, Zap, TrendingUp, CheckCircle2 } from "lucide-react";

interface AnalyticsViewProps {
  tasks: Task[];
  loading: boolean;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ tasks, loading }) => {
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  // Calculate stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "DONE").length;
  const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS").length;
  const blockedTasks = tasks.filter(t => t.status === "BLOCKED").length;
  const todoTasks = tasks.filter(t => t.status === "TODO").length;
  const backlogTasks = tasks.filter(t => t.status === "BACKLOG").length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / (totalTasks - backlogTasks)) * 100) : 0;

  // 1. Data for Status Chart
  const statusData = [
    { name: "Backlog", value: backlogTasks, color: "#52525b" },
    { name: "To Do", value: todoTasks, color: "#3b82f6" },
    { name: "In Progress", value: inProgressTasks, color: "#f59e0b" },
    { name: "Blocked", value: blockedTasks, color: "#ef4444" },
    { name: "Done", value: completedTasks, color: "#10b981" }
  ].filter(d => d.value > 0);

  // 2. Data for Priority Chart
  const urgentCount = tasks.filter(t => t.priority === "URGENT").length;
  const highCount = tasks.filter(t => t.priority === "HIGH").length;
  const mediumCount = tasks.filter(t => t.priority === "MEDIUM").length;
  const lowCount = tasks.filter(t => t.priority === "LOW").length;

  const priorityData = [
    { name: "Low", jumlah: lowCount, fill: "#10b981" },
    { name: "Medium", jumlah: mediumCount, fill: "#71717a" },
    { name: "High", jumlah: highCount, fill: "#f97316" },
    { name: "Urgent", jumlah: urgentCount, fill: "#ef4444" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-zinc-400">Statistik performa dan produktivitas harian Anda.</p>
      </div>

      {/* Grid Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 flex items-center gap-4">
          <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Rasio Penyelesaian</p>
            <h3 className="text-2xl font-bold text-zinc-100 mt-1">{completionRate}%</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">(Selesai vs Aktif Planned)</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 flex items-center gap-4">
          <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Tugas Diselesaikan</p>
            <h3 className="text-2xl font-bold text-zinc-100 mt-1">{completedTasks} <span className="text-sm font-normal text-zinc-500">/ {totalTasks}</span></h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">tugas selesai di database</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 flex items-center gap-4">
          <div className="rounded-xl bg-amber-500/10 p-3 text-amber-400">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Sedang Dikerjakan</p>
            <h3 className="text-2xl font-bold text-zinc-100 mt-1">{inProgressTasks}</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">tugas fokus saat ini</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Breakdown Chart */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 flex flex-col h-[350px]">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4">Proporsi Status Tugas</h3>
          {statusData.length > 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }}
                    itemStyle={{ color: "#fafafa" }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(value) => <span className="text-xs text-zinc-400 font-medium">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs">
              Belum ada data untuk ditampilkan.
            </div>
          )}
        </div>

        {/* Priority Counts Chart */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 flex flex-col h-[350px]">
          <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider mb-4">Jumlah Tugas Berdasarkan Prioritas</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priorityData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                  contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a" }}
                  itemStyle={{ color: "#fafafa" }}
                  labelStyle={{ color: "#71717a" }}
                />
                <Bar dataKey="jumlah" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
