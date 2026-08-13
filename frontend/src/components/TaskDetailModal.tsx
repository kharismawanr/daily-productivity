import React, { useState, useEffect } from "react";
import { 
  X, 
  Trash2, 
  Calendar, 
  Clock, 
  ListTodo, 
  Activity, 
  ShieldAlert 
} from "lucide-react";
import { Task, Project, Subtask, TaskActivity } from "../types";
import { DateTimeInput } from "./DateTimeInput";
import { API_KEY, getApiUrl } from "../api";

interface TaskDetailModalProps {
  task: Task | null;
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task> & { id: number }) => Promise<void>;
  onDelete: (taskId: number) => Promise<void>;
  onRefreshParent: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  projects,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onRefreshParent
}) => {
  const [taskDetails, setTaskDetails] = useState<any>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const API_URL = getApiUrl();

  useEffect(() => {
    if (task && isOpen) {
      fetchTaskDetails();
    } else {
      setTaskDetails(null);
      setSubtasks([]);
      setActivities([]);
    }
  }, [task, isOpen]);

  const fetchTaskDetails = async () => {
    if (!task) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/tasks/${task.id}`, {
        headers: { "x-api-key": API_KEY }
      });
      const result = await response.json();
      if (result.success) {
        setTaskDetails(result.data);
        setSubtasks(result.data.subtasks || []);
        setActivities(result.data.activities || []);
      }
    } catch (err) {
      console.error("Failed to load task details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  const handleSaveChanges = async () => {
    if (!taskDetails) return;
    await onSave({
      id: taskDetails.id,
      title: taskDetails.title,
      description: taskDetails.description,
      status: taskDetails.status,
      priority: taskDetails.priority,
      project_id: taskDetails.project_id ? Number(taskDetails.project_id) : null,
      deadline: taskDetails.deadline ? taskDetails.deadline : null,
      estimated_minutes: taskDetails.estimated_minutes ? Number(taskDetails.estimated_minutes) : null,
      actual_minutes: taskDetails.actual_minutes ? Number(taskDetails.actual_minutes) : null,
      progress_percent: Number(taskDetails.progress_percent || 0),
      blocker_reason: taskDetails.blocker_reason || null
    });
    onClose();
    onRefreshParent();
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !taskDetails) return;
    try {
      const response = await fetch(`${API_URL}/tasks/${taskDetails.id}/subtasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        },
        body: JSON.stringify({ title: newSubtaskTitle })
      });
      const result = await response.json();
      if (result.success) {
        setNewSubtaskTitle("");
        fetchTaskDetails();
        onRefreshParent();
      }
    } catch (err) {
      console.error("Failed to add subtask:", err);
    }
  };

  const handleToggleSubtask = async (sub: Subtask) => {
    try {
      const nextStatus = sub.status === "DONE" ? "TODO" : "DONE";
      const response = await fetch(`${API_URL}/subtasks/${sub.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const result = await response.json();
      if (result.success) {
        fetchTaskDetails();
        onRefreshParent();
      }
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
    }
  };

  const handleDeleteSubtask = async (subId: number) => {
    try {
      const response = await fetch(`${API_URL}/subtasks/${subId}`, {
        method: "DELETE",
        headers: { "x-api-key": API_KEY }
      });
      const result = await response.json();
      if (result.success) {
        fetchTaskDetails();
        onRefreshParent();
      }
    } catch (err) {
      console.error("Failed to delete subtask:", err);
    }
  };

  const handleDeleteTask = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus tugas ini secara permanen?")) {
      await onDelete(task.id);
      onClose();
      onRefreshParent();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : taskDetails ? (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">{taskDetails.title}</h2>
              <p className="mt-1 text-xs text-zinc-500">Tugas ID: #{taskDetails.id} · Sumber pencatatan: <span className="font-bold text-zinc-400">{taskDetails.source || "WEB"}</span></p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Status */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</label>
                <select
                  value={taskDetails.status}
                  onChange={(e) => setTaskDetails({ ...taskDetails, status: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                >
                  <option value="BACKLOG">Backlog</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Prioritas</label>
                <select
                  value={taskDetails.priority}
                  onChange={(e) => setTaskDetails({ ...taskDetails, priority: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {/* Project */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Asosiasi Proyek</label>
                <select
                  value={taskDetails.project_id || ""}
                  onChange={(e) => setTaskDetails({ ...taskDetails, project_id: e.target.value ? Number(e.target.value) : null })}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                >
                  <option value="">(Tanpa Proyek)</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tenggat Waktu (Deadline)</label>
                <DateTimeInput
                  value={taskDetails.deadline ? taskDetails.deadline.replace(" ", "T").slice(0, 16) : ""}
                  onChange={(v) => setTaskDetails({ ...taskDetails, deadline: v ? v.replace("T", " ") : "" })}
                />
              </div>
            </div>

            {/* Progress bar and workloads */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Progres (%)</label>
                <div className="mt-1 flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={taskDetails.progress_percent}
                    onChange={(e) => setTaskDetails({ ...taskDetails, progress_percent: Number(e.target.value) })}
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="text-sm font-bold text-zinc-300 w-8 text-right">{taskDetails.progress_percent}%</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Estimasi Durasi (Menit)</label>
                <input
                  type="number"
                  placeholder="e.g. 120"
                  value={taskDetails.estimated_minutes || ""}
                  onChange={(e) => setTaskDetails({ ...taskDetails, estimated_minutes: e.target.value ? Number(e.target.value) : null })}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Durasi Aktual (Menit)</label>
                <input
                  type="number"
                  placeholder="e.g. 90"
                  value={taskDetails.actual_minutes || ""}
                  onChange={(e) => setTaskDetails({ ...taskDetails, actual_minutes: e.target.value ? Number(e.target.value) : null })}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>
            </div>

            {/* Blocker Reason */}
            {taskDetails.status === "BLOCKED" && (
              <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4">
                <label className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="h-4 w-4" /> Alasan Terhambat (Blocker Reason)
                </label>
                <textarea
                  placeholder="Sebutkan halangan eksternal mengapa tugas ini tidak bisa dilanjutkan..."
                  rows={2}
                  value={taskDetails.blocker_reason || ""}
                  onChange={(e) => setTaskDetails({ ...taskDetails, blocker_reason: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-red-500/10 bg-zinc-900 p-2.5 text-sm text-zinc-200 outline-none focus:border-red-500/30"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Deskripsi Tugas</label>
              <textarea
                placeholder="Tuliskan keterangan detail mengenai instruksi tugas..."
                rows={3}
                value={taskDetails.description || ""}
                onChange={(e) => setTaskDetails({ ...taskDetails, description: e.target.value })}
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
              />
            </div>

            {/* Subtasks */}
            <div className="pt-4 border-t border-zinc-800">
              <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-1.5">
                <ListTodo className="h-4 w-4 text-emerald-500" /> Checklist Subtask ({subtasks.filter(s => s.status === "DONE").length}/{subtasks.length})
              </h4>

              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {subtasks.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-900/30 border border-zinc-900 p-2.5 hover:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sub.status === "DONE"}
                        onChange={() => handleToggleSubtask(sub)}
                        className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                      />
                      <span className={`text-sm ${sub.status === "DONE" ? "line-through text-zinc-500" : "text-zinc-300"}`}>
                        {sub.title}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleDeleteSubtask(sub.id)}
                      className="text-zinc-600 hover:text-red-400 p-1 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Tambah subtask checklist baru..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                />
                <button
                  onClick={handleAddSubtask}
                  className="rounded-xl bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-300 px-4 text-sm font-bold transition"
                >
                  Tambah
                </button>
              </div>
            </div>

            {/* Task History Audit Trail */}
            <div className="pt-4 border-t border-zinc-800">
              <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-1.5 mb-3">
                <Activity className="h-4 w-4 text-zinc-500" /> Log Aktivitas Tugas (Audit Trail)
              </h4>
              <div className="space-y-3 max-h-36 overflow-y-auto pr-1">
                {activities.map(act => (
                  <div key={act.id} className="text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900/50 pb-2 gap-1">
                    <div>
                      <span className="font-semibold text-emerald-400">[{act.source}]</span>{" "}
                      <span className="text-zinc-300 font-medium">{act.action}</span>{" "}
                      {act.old_value && <span className="text-zinc-500">({act.old_value} ➔ {act.new_value})</span>}
                      {!act.old_value && act.new_value && <span className="text-zinc-400">· {act.new_value}</span>}
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(act.created_at).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal actions */}
            <div className="pt-4 border-t border-zinc-800 flex justify-between items-center gap-4">
              <button
                onClick={handleDeleteTask}
                className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition"
              >
                <Trash2 className="h-4 w-4" /> Hapus Tugas
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-4 py-2.5 text-sm font-semibold transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 py-2.5 text-sm font-bold transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
