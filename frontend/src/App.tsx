import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Layers, 
  FolderKanban, 
  LineChart, 
  MessageSquareCode, 
  Settings as SettingsIcon,
  RefreshCw,
  Zap,
  Menu,
  X
} from "lucide-react";
import { DashboardView } from "./components/DashboardView";
import { KanbanView } from "./components/KanbanView";
import { ProjectsView } from "./components/ProjectsView";
import { AnalyticsView } from "./components/AnalyticsView";
import { AlkhasyaChatView } from "./components/AlkhasyaChatView";
import { SettingsView } from "./components/SettingsView";
import { Task, Project, DashboardData } from "./types";
import { TaskDetailModal } from "./components/TaskDetailModal";

import { API_KEY, getApiUrl } from "./api";

const API_URL = getApiUrl();

export default function App() {
  const [activeView, setActiveView] = useState<string>("dashboard");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Task Detail Modal States
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { "x-api-key": API_KEY };

      const [dashRes, tasksRes, projRes] = await Promise.all([
        fetch(`${API_URL}/dashboard`, { headers }),
        fetch(`${API_URL}/tasks`, { headers }),
        fetch(`${API_URL}/projects`, { headers })
      ]);

      const [dash, t, p] = await Promise.all([
        dashRes.json(),
        tasksRes.json(),
        projRes.json()
      ]);

      if (dash.success) setDashboardData(dash.data);
      if (t.success) setTasks(t.data);
      if (p.success) setProjects(p.data);

    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleOpenTaskDetail = (task: Task) => {
    setSelectedTask(task);
    setIsDetailOpen(true);
  };

  const handleCloseTaskDetail = () => {
    setSelectedTask(null);
    setIsDetailOpen(false);
  };

  // Update Task Status Mutation (Kanban Drag and Drop)
  const handleUpdateTaskStatus = async (taskId: number, newStatus: Task["status"]) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        },
        body: JSON.stringify({ status: newStatus })
      });
      const result = await response.json();
      if (result.success) {
        fetchAllData(); // Refresh UI
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
    }
  };

  // Save / Update Task Mutation
  const handleSaveTask = async (taskData: Partial<Task> & { id?: number }) => {
    const isEdit = !!taskData.id;
    const url = isEdit ? `${API_URL}/tasks/${taskData.id}` : `${API_URL}/tasks`;
    const method = isEdit ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        },
        body: JSON.stringify(taskData)
      });
      const result = await response.json();
      if (result.success) {
        fetchAllData();
      }
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  };

  // Delete Task Mutation
  const handleDeleteTask = async (taskId: number) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "x-api-key": API_KEY }
      });
      const result = await response.json();
      if (result.success) {
        fetchAllData();
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  // Save / Update Project Mutation
  const handleSaveProject = async (projectData: Partial<Project> & { id?: number }) => {
    const isEdit = !!projectData.id;
    const url = isEdit ? `${API_URL}/projects/${projectData.id}` : `${API_URL}/projects`;
    const method = isEdit ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY
        },
        body: JSON.stringify(projectData)
      });
      const result = await response.json();
      if (result.success) {
        fetchAllData();
      }
    } catch (error) {
      console.error("Failed to save project:", error);
    }
  };

  // Delete/Archive Project Mutation
  const handleDeleteProject = async (projectId: number) => {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}`, {
        method: "DELETE",
        headers: { "x-api-key": API_KEY }
      });
      const result = await response.json();
      if (result.success) {
        fetchAllData();
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "tasks", label: "My Tasks", icon: Layers },
    { id: "projects", label: "Projects", icon: FolderKanban },
    { id: "analytics", label: "Analytics", icon: LineChart },
    { id: "hermes", label: "Alkhasya Console", icon: MessageSquareCode },
    { id: "settings", label: "Settings", icon: SettingsIcon }
  ];

  return (
    <div className="flex h-screen bg-[#09090b] text-[#fafafa] overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-zinc-900 flex-shrink-0">
        <div className="h-16 px-6 border-b border-zinc-900 flex items-center gap-2.5">
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
            <Zap className="h-5 w-5 fill-emerald-400/10" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">Alkhasya Workspace</span>
            <span className="text-[10px] text-zinc-500 font-bold block leading-none">DAILY PRODUCTIVITY</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map(item => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition ${
                  active 
                    ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/10" 
                    : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold border border-zinc-700">
              AR
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-zinc-200">Aris</p>
              <p className="text-[9px] text-zinc-500 leading-none">Administrator</p>
            </div>
          </div>
          <button 
            onClick={fetchAllData}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 transition"
            title="Refresh All Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </aside>

      {/* Mobile Header and Drawer */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <header className="md:hidden h-16 border-b border-zinc-900 bg-zinc-950 px-6 flex items-center justify-between z-40">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-400" />
            <span className="font-bold text-sm tracking-tight text-white">Alkhasya Workspace</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchAllData}
              className="text-zinc-400 hover:text-zinc-200 transition"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-zinc-400 hover:text-zinc-200 transition"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-30 md:hidden bg-zinc-950/95 backdrop-blur-md pt-20 px-6 flex flex-col space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-base font-semibold tracking-wide transition ${
                    active 
                      ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/10" 
                      : "text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeView === "dashboard" && (
            <DashboardView 
              data={dashboardData} 
              tasks={tasks}
              loading={loading} 
              onNavigate={setActiveView} 
              onOpenTaskDetail={handleOpenTaskDetail}
            />
          )}
          {activeView === "tasks" && (
            <KanbanView 
              tasks={tasks} 
              projects={projects} 
              loading={loading} 
              onRefresh={fetchAllData}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onSaveTask={handleSaveTask}
              onOpenTaskDetail={handleOpenTaskDetail}
            />
          )}
          {activeView === "projects" && (
            <ProjectsView 
              projects={projects} 
              loading={loading} 
              onRefresh={fetchAllData}
              onSaveProject={handleSaveProject}
              onDeleteProject={handleDeleteProject}
            />
          )}
          {activeView === "analytics" && (
            <AnalyticsView 
              tasks={tasks} 
              loading={loading} 
            />
          )}
          {activeView === "hermes" && (
            <AlkhasyaChatView 
              onRefreshAll={fetchAllData} 
            />
          )}
          {activeView === "settings" && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Global Shared Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        projects={projects}
        isOpen={isDetailOpen}
        onClose={handleCloseTaskDetail}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onRefreshParent={fetchAllData}
      />
    </div>
  );
}
