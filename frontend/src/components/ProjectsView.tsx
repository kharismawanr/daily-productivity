import React, { useState } from "react";
import { Plus, X, Trash2, Calendar, Folder, MoreVertical, Briefcase } from "lucide-react";
import { Project } from "../types";
import { DateTimeInput } from "./DateTimeInput";

interface ProjectsViewProps {
  projects: Project[];
  loading: boolean;
  onRefresh: () => void;
  onSaveProject: (projectData: Partial<Project> & { id?: number }) => Promise<void>;
  onDeleteProject: (projectId: number) => Promise<void>;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  loading,
  onRefresh,
  onSaveProject,
  onDeleteProject
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState<Project["priority"]>("MEDIUM");
  const [status, setStatus] = useState<Project["status"]>("ACTIVE");
  const [deadline, setDeadline] = useState("");

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setDesc(project.description || "");
    setPriority(project.priority);
    setStatus(project.status);
    setDeadline(project.deadline ? project.deadline.substring(0, 16) : "");
  };

  const handleCloseForm = () => {
    setIsCreating(false);
    setEditingProject(null);
    setName("");
    setDesc("");
    setPriority("MEDIUM");
    setStatus("ACTIVE");
    setDeadline("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: Partial<Project> & { id?: number } = {
      name: name.trim(),
      description: desc || null,
      priority,
      status,
      deadline: deadline ? deadline.replace("T", " ") : null
    };

    if (editingProject) {
      payload.id = editingProject.id;
    }

    await onSaveProject(payload);
    handleCloseForm();
    onRefresh();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin mengarsipkan proyek ini? Semua tugas akan tetap ada tetapi status proyek akan menjadi ARCHIVED.")) {
      await onDeleteProject(id);
      handleCloseForm();
      onRefresh();
    }
  };

  const getPriorityColor = (p: Project["priority"]) => {
    switch (p) {
      case "URGENT": return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "HIGH": return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      case "MEDIUM": return "bg-zinc-800 text-zinc-300 border border-zinc-700";
      case "LOW": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    }
  };

  const getStatusColor = (s: Project["status"]) => {
    switch (s) {
      case "ACTIVE": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "ON_HOLD": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "COMPLETED": return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "ARCHIVED": return "bg-zinc-800 text-zinc-500 border border-zinc-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-zinc-400">Atur dan pantau progres proyek aktif Anda.</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-emerald-400 transition"
        >
          <Plus className="h-4 w-4" /> Proyek Baru
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.filter(p => p.status !== "ARCHIVED").map(project => (
            <div 
              key={project.id} 
              className="group flex flex-col rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-5 hover:border-zinc-700 hover:bg-zinc-900/50 transition cursor-pointer"
              onClick={() => handleOpenEdit(project)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-xl bg-zinc-850 p-2 border border-zinc-800 text-zinc-400 group-hover:text-emerald-400 transition">
                    <Folder className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-zinc-200 group-hover:text-emerald-400 transition truncate max-w-[180px]">
                    {project.name}
                  </h3>
                </div>
                <div className="flex gap-1.5">
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                </div>
              </div>

              {project.description && (
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Progress Fraction and bar */}
              <div className="mt-auto pt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-zinc-500 font-medium">Progres: {project.progress_percent}%</span>
                  <span className="text-zinc-400 font-bold">{project.completed_tasks}/{project.total_tasks} Tugas</span>
                </div>
                {/* Progress bar */}
                <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress_percent}%` }}
                  />
                </div>
              </div>

              {/* Deadline & Priority footer */}
              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                {project.deadline ? (
                  <span className="text-zinc-500 font-medium flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(project.deadline).toLocaleDateString("id-ID", { month: "short", day: "numeric" })}
                  </span>
                ) : (
                  <span className="text-zinc-600 font-medium">Sore/Tanpa Deadline</span>
                )}
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${getPriorityColor(project.priority)}`}>
                  {project.priority}
                </span>
              </div>
            </div>
          ))}

          {projects.filter(p => p.status !== "ARCHIVED").length === 0 && (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
              <Folder className="mb-2 h-10 w-10 text-zinc-700" />
              <p className="text-sm">Belum ada proyek aktif. Klik 'Proyek Baru' untuk membuat.</p>
            </div>
          )}
        </div>
      )}

      {/* Slideover / Modal Overlay for creating/editing project */}
      {(isCreating || editingProject) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:p-8">
            <button 
              onClick={handleCloseForm}
              className="absolute right-4 top-4 rounded-xl p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold mb-4">
              {editingProject ? "Edit Proyek" : "Buat Proyek Baru"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Nama Proyek *</label>
                <input
                  type="text"
                  placeholder="e.g. MRP Automation"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Prioritas</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Project["priority"])}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {editingProject && (
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Status Proyek</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Project["status"])}
                    className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tenggat Waktu Proyek</label>
                <DateTimeInput
                  value={deadline}
                  onChange={setDeadline}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Deskripsi Proyek</label>
                <textarea
                  placeholder="Keterangan mengenai lingkup pekerjaan proyek..."
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-900 p-2.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
                />
              </div>

              <div className="pt-4 flex justify-between gap-2 border-t border-zinc-800">
                {editingProject ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingProject.id)}
                    className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="h-4 w-4" /> Arsipkan
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 px-4 py-2.5 text-sm font-semibold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-5 py-2.5 text-sm font-bold transition"
                  >
                    {editingProject ? "Simpan" : "Buat Proyek"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
