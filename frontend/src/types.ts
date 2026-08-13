export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: "ACTIVE" | "ON_HOLD" | "COMPLETED" | "ARCHIVED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  deadline: string | null;
  progress_percent?: number;
  total_tasks?: number;
  completed_tasks?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: number;
  project_id: number | null;
  project_name: string | null;
  title: string;
  description: string | null;
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  deadline: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  progress_percent: number;
  blocker_reason: string | null;
  last_activity_at: string;
  completed_at: string | null;
  deadline_status: "NO_DEADLINE" | "UPCOMING" | "DUE_SOON" | "OVERDUE" | "COMPLETED";
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  status: "TODO" | "DONE";
  completed_at: string | null;
}

export interface TaskActivity {
  id: number;
  task_id: number;
  action: string;
  old_value: string | null;
  new_value: string | null;
  source: "WEB" | "HERMES" | "SYSTEM";
  created_at: string;
}

export interface DashboardData {
  task_summary: {
    total: number;
    completed: number;
    in_progress: number;
    todo: number;
    blocked: number;
    backlog: number;
    due_today: number;
    overdue: number;
  };
  workload: {
    minutes: number;
    hours: number;
    capacity_minutes: number;
    capacity_hours: number;
    is_overloaded: boolean;
  };
  recently_completed: Array<{
    id: number;
    title: string;
    completed_at: string;
    project_name: string | null;
  }>;
  hermes_alerts: string[];
}
