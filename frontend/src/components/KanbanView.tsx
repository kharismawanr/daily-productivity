import React, { useState } from "react";
import { 
  Plus, 
  Calendar, 
  Clock, 
  X, 
  Trash2,
  Briefcase,
  ShieldAlert
} from "lucide-react";
import { Task, Project } from "../types";
import { DateTimeInput } from "./DateTimeInput";

interface KanbanViewProps {
  tasks: Task[];
  projects: Project[];
  loading: boolean;
  onRefresh: () => void;
  onUpdateTaskStatus: (taskId: number, newStatus: Task["status"]) => Promise<void>;
  onSaveTask: (taskData: Partial<Task> & { id?: number }) => Promise<void>;
  onOpenTaskDetail: (task: Task) => void;
}

const COLUMNS: Array<{ id: Task["status"]; title: string; color: string; border: string }> = [
  { id: "BACKLOG", title: "Backlog", color: "bg-zinc-950/40 text-zinc-400", border: "border-zinc-800" },
  { id: "TODO", title: "To Do", color: "bg-blue-950/10 text-blue-400", border: "border-blue-900/30" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-amber-950/10 text-amber-400", border: "border-amber-900/30" },
  { id: "BLOCKED", title: "Blocked", color: "bg-red-950/10 text-red-400", border: "border-red-900/30" },
  { id: "DONE", title: "Done", color: "bg-emerald-950/10 text-emerald-400", border: "border-emerald-900/30" }
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  tasks,
  projects,
  loading,
  onRefresh,
  onUpdateTaskStatus,
  onSaveTask,
  onOpenTaskDetail
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState<Task["status"]>("TODO");

  // Form states for creating a new task
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newProjId, setNewProjId] = useState<string>("");
  const [newPriority, setNewPriority] = useState<Task["priority"]>("MEDIUM");
  const [newDeadline, setNewDeadline] = useState("");
  const [newEst, setNewEst] = useState("");

  // Draggable Handlers
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData("text/plain", taskId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Task["status"]) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData("text/plain");
    if (!taskIdStr) return;
    const taskId = Number(taskIdStr);
    await onUpdateTaskStatus(taskId, targetStatus);
  };

  // Create Task Action
  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await onSaveTask({
      title: newTitle,
      description: newDesc,
      status: newTaskColumn,
      priority: newPriority,
      project_id: newProjId ? Number(newProjId) : null,
      deadline: newDeadline ? newDeadline : null,
      estimated_minutes: newEst ? Number(newEst) : null,
    });

    // Reset Form
    setNewTitle("");
    setNewDesc("");
    setNewProjId("");
    setNewPriority("MEDIUM");
    setNewDeadline("");
    setNewEst("");
    setIsCreating(false);
    onRefresh();
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "URGENT": return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "HIGH": return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      case "MEDIUM": return "bg-zinc-800 text-zinc-300 border border-zinc-700";
      case "LOW": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
  };

  const formatDeadlineDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleString("id-ID", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-sm text-zinc-400">Atur dan geser tugas antar status (Kanban Board).</p>
        </div>
        <button
          onClick={() => {
            setNewTaskColumn("TODO");
            setIsCreating(true);
          }}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition"
        >
          <Plus className="h-4 w-4" /> Tambah Tugas
        </button>
      </div>

      {/* Columns Container */}
      <div className="flex flex-1 gap-4 overflow-x-auto pb-4 h-[calc(100vh-210px)] select-none">
        {COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          
          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="flex flex-col flex-shrink-0 w-80 rounded-2xl border border-zinc-800/80 bg-zinc-900/10 p-4"
            >
              {/* Header Column */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${col.color}`}>
                    {col.title}
                  </span>
                  <span className="text-xs text-zinc-500 font-bold">{colTasks.length}</span>
                </div>
                <button 
                  onClick={() => {
                    setNewTaskColumn(col.id);
                    setIsCreating(true);
                  }}
                  className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="flex flex-col flex-1 gap-3 overflow-y-auto pr-1">
                {colTasks.length > 0 ? (
                  colTasks.map(task => {
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => onOpenTaskDetail(task)}
                        className={`group relative flex flex-col rounded-xl border bg-zinc-900/40 p-4 hover:bg-zinc-900/80 transition cursor-pointer hover:shadow-lg ${
                          task.status === "BLOCKED" 
                            ? "border-red-500/20 shadow-red-500/[0.01]" 
                            : task.deadline_status === "OVERDUE"
                            ? "border-red-500/30 animate-glow-red"
                            : "border-zinc-800/80"
                        }`}
                      >
                        {/* Priority & Project */}
                        <div className="flex items-center justify-between gap-2">
                          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          {task.project_name && (
                            <span className="text-[10px] font-bold text-zinc-500 truncate max-w-[140px]">
                              📁 {task.project_name}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className={`mt-3 text-sm font-semibold tracking-tight text-zinc-200 group-hover:text-emerald-400 transition ${task.status === "DONE" ? "line-through text-zinc-500 decoration-zinc-600" : ""}`}>
                          {task.title}
                        </h3>

                        {/* Blocker Reason if Blocked */}
                        {task.status === "BLOCKED" && task.blocker_reason && (
                          <div className="mt-2 rounded-lg bg-red-950/10 border border-red-500/10 p-2 text-[11px] text-red-300 flex items-start gap-1.5">
                            <ShieldAlert className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="line-clamp-2 leading-relaxed">{task.blocker_reason}</p>
                          </div>
                        )}

                        {/* Deadline */}
                        {task.deadline && (
                          <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-zinc-500">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className={task.deadline_status === "OVERDUE" ? "text-red-400 font-bold" : task.deadline_status === "DUE_SOON" ? "text-amber-400 font-bold" : ""}>
                              {formatDeadlineDate(task.deadline)}
                              {task.deadline_status === "OVERDUE" && " (TERLAMBAT)"}
                            </span>
                          </div>
                        )}

                        {/* Footer - Progress & Subtask count */}
                        {task.status !== "DONE" && (task.progress_percent > 0 || task.estimated_minutes) && (
                          <div className="mt-3.5 pt-3 border-t border-zinc-800/50 flex items-center justify-between">
                            <div className="flex-1 max-w-[120px] mr-4">
                              {/* Progress mini bar */}
                              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${task.progress_percent}%` }} />
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1">{task.progress_percent}% Progres</p>
                            </div>

                            {task.estimated_minutes && (
                              <div className="flex items-center gap-0.5 text-[10px] text-zinc-500">
                                <Clock className="h-3 w-3" />
                                {Math.round(task.estimated_minutes / 60 * 10) / 10}h
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-600 border border-dashed border-zinc-800/80 rounded-xl">
                    <p className="text-xs">Kosong</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Slideover / Modal Overlay */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:p-8">
            <button 
              onClick={() => setIsCreating(false)}
              className="absolute right-4 top-4 rounded-xl p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold mb-4">Buat Tugas Baru</h2>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Judul Tugas *</label>
                <input
                  type="text"
                  placeholder="e.g. Kirim report SLA vendor"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Asosiasi Proyek</label>
                <select
                  value={newProjId}
                  onChange={(e) => setNewProjId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                >
                  <option value="">(Tanpa Proyek / Standalone)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Prioritas</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as Task["priority"])}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Estimasi Menit</label>
                  <input
                    type="number"
                    placeholder="e.g. 120"
                    value={newEst}
                    onChange={(e) => setNewEst(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tenggat Waktu (Deadline)</label>
                <DateTimeInput
                  value={newDeadline}
                  onChange={setNewDeadline}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Deskripsi</label>
                <textarea
                  placeholder="Keterangan singkat tugas..."
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-4 py-2.5 text-sm font-semibold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 py-2.5 text-sm font-bold transition"
                >
                  Tambah Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
