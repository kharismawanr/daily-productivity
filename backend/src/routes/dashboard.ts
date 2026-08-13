import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

// GET /api/dashboard - Get aggregated stats and active Hermes alert flags
router.get("/", async (req: Request, res: Response) => {
  try {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // 1. Fetch general task counts
    const [taskCountsRows] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'DONE' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'TODO' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN status = 'BLOCKED' THEN 1 ELSE 0 END) as blocked,
        SUM(CASE WHEN status = 'BACKLOG' THEN 1 ELSE 0 END) as backlog
      FROM tasks
    `);
    const counts = (taskCountsRows as any[])[0];

    // 2. Tasks due today (and not done)
    const [dueTodayRows] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM tasks 
      WHERE DATE(deadline) = CURRENT_DATE AND status != 'DONE'
    `);
    const dueTodayCount = (dueTodayRows as any[])[0].count;

    // 3. Overdue tasks (deadline passed, not completed)
    const [overdueRows] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM tasks 
      WHERE deadline < CURRENT_TIMESTAMP AND status != 'DONE' AND deadline IS NOT NULL
    `);
    const overdueCount = (overdueRows as any[])[0].count;

    // 4. Recently completed tasks (last 5 completed tasks)
    const [recentlyCompletedRows] = await pool.query(`
      SELECT t.id, t.title, t.completed_at, p.name as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.status = 'DONE'
      ORDER BY t.completed_at DESC
      LIMIT 5
    `);

    // 5. Calculate workload today
    // Workload includes tasks due today OR currently in_progress
    const [workloadRows] = await pool.query(`
      SELECT SUM(COALESCE(estimated_minutes, 0)) as total_minutes
      FROM tasks
      WHERE status != 'DONE' AND (DATE(deadline) = CURRENT_DATE OR status = 'IN_PROGRESS')
    `);
    const workloadMinutes = Number((workloadRows as any[])[0].total_minutes || 0);

    // 6. HERMES ALERT: Inactivity check (tasks in progress and not modified for > 48 hours)
    const [inactiveTasksRows] = await pool.query(`
      SELECT t.id, t.title, t.last_activity_at, p.name as project_name,
             TIMESTAMPDIFF(HOUR, t.last_activity_at, CURRENT_TIMESTAMP) as inactive_hours
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.status = 'IN_PROGRESS' AND t.last_activity_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 48 HOUR)
    `);

    // 7. HERMES ALERT: Project deadline approaching (active projects with deadline within next 48 hours)
    const [approachingProjectsRows] = await pool.query(`
      SELECT id, name, deadline,
             TIMESTAMPDIFF(HOUR, CURRENT_TIMESTAMP, deadline) as hours_left
      FROM projects
      WHERE status = 'ACTIVE' AND deadline BETWEEN CURRENT_TIMESTAMP AND DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 48 HOUR)
    `);

    // 8. Workload Warning
    // Configure default daily working capacity: 8 hours (480 minutes)
    const DAILY_CAPACITY_MINUTES = 480; 
    const isOverloaded = workloadMinutes > DAILY_CAPACITY_MINUTES;

    // Compile Hermes alerts
    const alerts: string[] = [];
    (inactiveTasksRows as any[]).forEach(t => {
      alerts.push(`⚠️ Task "${t.title}" (${t.project_name || 'Standalone'}) is IN_PROGRESS but has not been updated for ${Math.floor(t.inactive_hours / 24)} days.`);
    });
    (approachingProjectsRows as any[]).forEach(p => {
      alerts.push(`⚠️ Project "${p.name}" deadline is approaching in ${Math.round(p.hours_left)} hours.`);
    });
    if (isOverloaded) {
      alerts.push(`💡 Today's planned workload (${Math.round(workloadMinutes / 60 * 10) / 10} hours) exceeds your 8-hour capacity.`);
    }

    res.json({
      success: true,
      data: {
        task_summary: {
          total: Number(counts.total || 0),
          completed: Number(counts.completed || 0),
          in_progress: Number(counts.in_progress || 0),
          todo: Number(counts.todo || 0),
          blocked: Number(counts.blocked || 0),
          backlog: Number(counts.backlog || 0),
          due_today: Number(dueTodayCount || 0),
          overdue: Number(overdueCount || 0)
        },
        workload: {
          minutes: workloadMinutes,
          hours: Math.round(workloadMinutes / 60 * 10) / 10,
          capacity_minutes: DAILY_CAPACITY_MINUTES,
          capacity_hours: 8,
          is_overloaded: isOverloaded
        },
        recently_completed: recentlyCompletedRows,
        hermes_alerts: alerts,
        raw_alerts: {
          inactive_tasks: inactiveTasksRows,
          approaching_projects: approachingProjectsRows
        }
      }
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    res.status(500).json({ success: false, error: "Database query failed" });
  }
});

export default router;
