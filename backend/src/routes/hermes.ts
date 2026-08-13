import { Router, Request, Response } from "express";
import { pool } from "../db";
import { logActivity } from "../services/activity";

const router = Router();

// Helper to resolve project name to project_id or create if not exists
async function resolveProject(projectName: string | null): Promise<number | null> {
  if (!projectName || projectName.trim() === "") return null;
  const name = projectName.trim();

  // Check if project exists by name (case-insensitive)
  const [rows] = await pool.execute(
    "SELECT id FROM projects WHERE LOWER(name) = LOWER(?) LIMIT 1",
    [name]
  );

  const match = rows as { id: number }[];
  if (match.length > 0) {
    return match[0].id;
  }

  // Create new project with this name
  const [insertResult] = await pool.execute(
    "INSERT INTO projects (name, description, status, priority) VALUES (?, ?, 'ACTIVE', 'MEDIUM')",
    [name, `Project created automatically by Hermes Agent for task association.`]
  );
  
  return (insertResult as any).insertId;
}

// POST /api/hermes/task/create - Create a task from natural language extraction
router.post("/task/create", async (req: Request, res: Response) => {
  const { title, description, status, priority, deadline, estimated_minutes, project } = req.body;
  const source = "HERMES"; // Hardcoded for this endpoint since it's the Hermes endpoint

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ success: false, error: "Task title is required" });
  }

  try {
    const projectId = await resolveProject(project || null);

    const [result] = await pool.execute(
      `INSERT INTO tasks (project_id, title, description, status, priority, deadline, estimated_minutes, progress_percent, last_activity_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
      [
        projectId,
        title.trim(),
        description || null,
        status || "TODO",
        priority || "MEDIUM",
        deadline || null,
        estimated_minutes !== undefined ? Number(estimated_minutes) : null
      ]
    );

    const insertId = (result as any).insertId;

    // Log creation activity
    await logActivity(
      insertId,
      "TASK_CREATED",
      null,
      `Task created via Hermes Agent. Title: "${title.trim()}"`,
      source
    );

    res.status(201).json({
      success: true,
      data: {
        id: insertId,
        project_id: projectId,
        title: title.trim(),
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        deadline: deadline || null,
        estimated_minutes: estimated_minutes || null,
        progress_percent: 0
      }
    });
  } catch (error) {
    console.error("Hermes failed to create task:", error);
    res.status(500).json({ success: false, error: "Failed to create task" });
  }
});

// POST /api/hermes/task/update - Update a task status, progress or deadline
router.post("/task/update", async (req: Request, res: Response) => {
  const { id, title, status, progress_percent, deadline, priority } = req.body;
  const source = "HERMES";

  let taskId: number | null = id ? Number(id) : null;

  try {
    // If no ID is provided, try to search for the task by title (case-insensitive fuzzy match)
    if (!taskId && title && typeof title === "string") {
      const [rows] = await pool.execute(
        "SELECT id FROM tasks WHERE LOWER(title) LIKE LOWER(?) AND status != 'DONE' LIMIT 1",
        [`%${title.trim()}%`]
      );
      const match = rows as { id: number }[];
      if (match.length > 0) {
        taskId = match[0].id;
      }
    }

    if (!taskId) {
      return res.status(404).json({ success: false, error: "Task not found to update" });
    }

    const [taskRows] = await pool.execute("SELECT * FROM tasks WHERE id = ? LIMIT 1", [taskId]);
    const task = (taskRows as any[])[0];

    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    const updatedStatus = status !== undefined ? status : task.status;
    const updatedProg = progress_percent !== undefined ? Number(progress_percent) : task.progress_percent;
    const updatedDeadline = deadline !== undefined ? deadline : task.deadline;
    const updatedPriority = priority !== undefined ? priority : task.priority;

    let completedAt = task.completed_at;
    if (updatedStatus === "DONE" && task.status !== "DONE") {
      completedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
    } else if (updatedStatus !== "DONE" && task.status === "DONE") {
      completedAt = null;
    }

    await pool.execute(
      `UPDATE tasks 
       SET status = ?, progress_percent = ?, deadline = ?, priority = ?, completed_at = ?, last_activity_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [updatedStatus, updatedProg, updatedDeadline, updatedPriority, completedAt, taskId]
    );

    // Logging Activities
    if (updatedStatus !== task.status) {
      await logActivity(
        taskId,
        updatedStatus === "DONE" ? "TASK_COMPLETED" : (task.status === "DONE" ? "TASK_REOPENED" : "STATUS_CHANGED"),
        task.status,
        updatedStatus,
        source
      );
    }
    if (updatedProg !== task.progress_percent) {
      await logActivity(taskId, "PROGRESS_UPDATED", String(task.progress_percent), String(updatedProg), source);
    }
    if (updatedPriority !== task.priority) {
      await logActivity(taskId, "PRIORITY_CHANGED", task.priority, updatedPriority, source);
    }
    if (updatedDeadline !== task.deadline) {
      await logActivity(taskId, "DEADLINE_CHANGED", task.deadline, updatedDeadline, source);
    }

    res.json({
      success: true,
      data: {
        id: taskId,
        title: task.title,
        status: updatedStatus,
        progress_percent: updatedProg,
        deadline: updatedDeadline,
        priority: updatedPriority
      }
    });
  } catch (error) {
    console.error("Hermes failed to update task:", error);
    res.status(500).json({ success: false, error: "Failed to update task" });
  }
});

// POST /api/hermes/task/complete - Quick complete a task by ID or title
router.post("/task/complete", async (req: Request, res: Response) => {
  const { id, title } = req.body;
  const source = "HERMES";

  let taskId: number | null = id ? Number(id) : null;

  try {
    if (!taskId && title && typeof title === "string") {
      const [rows] = await pool.execute(
        "SELECT id FROM tasks WHERE LOWER(title) LIKE LOWER(?) AND status != 'DONE' LIMIT 1",
        [`%${title.trim()}%`]
      );
      const match = rows as { id: number }[];
      if (match.length > 0) {
        taskId = match[0].id;
      }
    }

    if (!taskId) {
      return res.status(404).json({ success: false, error: "Task not found to complete" });
    }

    const [taskRows] = await pool.execute("SELECT status, title FROM tasks WHERE id = ? LIMIT 1", [taskId]);
    const task = (taskRows as any[])[0];

    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    if (task.status === "DONE") {
      return res.json({ success: true, message: `Task "${task.title}" is already completed.`, already_done: true });
    }

    const completedAt = new Date().toISOString().slice(0, 19).replace("T", " ");

    await pool.execute(
      "UPDATE tasks SET status = 'DONE', progress_percent = 100, completed_at = ?, last_activity_at = CURRENT_TIMESTAMP WHERE id = ?",
      [completedAt, taskId]
    );

    // Log Activity
    await logActivity(taskId, "TASK_COMPLETED", task.status, "DONE", source);

    res.json({
      success: true,
      message: `Task "${task.title}" marked as COMPLETED.`,
      data: { id: taskId, title: task.title, status: "DONE" }
    });
  } catch (error) {
    console.error("Hermes failed to complete task:", error);
    res.status(500).json({ success: false, error: "Failed to complete task" });
  }
});

// GET /api/hermes/tasks/today - Get tasks due today
router.get("/tasks/today", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.id, t.title, t.priority, t.deadline, p.name as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE DATE(t.deadline) = CURRENT_DATE AND t.status != 'DONE'
      ORDER BY t.deadline ASC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Hermes failed to fetch today's tasks:", error);
    res.status(500).json({ success: false, error: "Database query failed" });
  }
});

// GET /api/hermes/tasks/overdue - Get overdue tasks
router.get("/tasks/overdue", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.id, t.title, t.priority, t.deadline, p.name as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.deadline < CURRENT_TIMESTAMP AND t.status != 'DONE' AND t.deadline IS NOT NULL
      ORDER BY t.deadline ASC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Hermes failed to fetch overdue tasks:", error);
    res.status(500).json({ success: false, error: "Database query failed" });
  }
});

// GET /api/hermes/tasks/inactive - Get inactive tasks (> 48 hours without update)
router.get("/tasks/inactive", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.id, t.title, t.last_activity_at, p.name as project_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.status = 'IN_PROGRESS' AND t.last_activity_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 48 HOUR)
      ORDER BY t.last_activity_at ASC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Hermes failed to fetch inactive tasks:", error);
    res.status(500).json({ success: false, error: "Database query failed" });
  }
});

// GET /api/hermes/daily-summary - Highly convenient endpoint returning text briefing
router.get("/daily-summary", async (req: Request, res: Response) => {
  try {
    // Today's counts
    const [todayCountRows] = await pool.query(`
      SELECT 
        SUM(CASE WHEN priority = 'HIGH' OR priority = 'URGENT' THEN 1 ELSE 0 END) as urgent_high,
        SUM(CASE WHEN priority = 'MEDIUM' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN priority = 'LOW' THEN 1 ELSE 0 END) as low
      FROM tasks
      WHERE DATE(deadline) = CURRENT_DATE AND status != 'DONE'
    `);
    const todayCounts = (todayCountRows as any[])[0];

    // Today's closest deadline
    const [nearestDlRows] = await pool.query(`
      SELECT t.title, DATE_FORMAT(t.deadline, '%H:%i') as time
      FROM tasks t
      WHERE DATE(t.deadline) = CURRENT_DATE AND t.status != 'DONE'
      ORDER BY t.deadline ASC LIMIT 1
    `);
    const nearest = (nearestDlRows as any[])[0];

    // Overdue count
    const [overdueRows] = await pool.query(`
      SELECT COUNT(*) as count FROM tasks WHERE deadline < CURRENT_TIMESTAMP AND status != 'DONE' AND deadline IS NOT NULL
    `);
    const overdueCount = (overdueRows as any[])[0].count;

    // Inactive count
    const [inactiveRows] = await pool.query(`
      SELECT COUNT(*) as count FROM tasks WHERE status = 'IN_PROGRESS' AND last_activity_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 48 HOUR)
    `);
    const inactiveCount = (inactiveRows as any[])[0].count;

    // Workload minutes
    const [workloadRows] = await pool.query(`
      SELECT SUM(COALESCE(estimated_minutes, 0)) as total_minutes
      FROM tasks
      WHERE status != 'DONE' AND (DATE(deadline) = CURRENT_DATE OR status = 'IN_PROGRESS')
    `);
    const workloadMin = Number((workloadRows as any[])[0].total_minutes || 0);
    const workloadHours = Math.round(workloadMin / 60 * 10) / 10;

    let summaryText = `Today you have:\n\n`;
    summaryText += `🔴 ${todayCounts.urgent_high || 0} urgent/high priority\n`;
    summaryText += `🟠 ${todayCounts.medium || 0} medium priority\n`;
    summaryText += `🟢 ${todayCounts.low || 0} low priority\n\n`;
    
    if (nearest) {
      summaryText += `Closest deadline:\n👉 "${nearest.title}" at ${nearest.time}\n\n`;
    } else {
      summaryText += `No specific deadlines due today!\n\n`;
    }
    
    summaryText += `Overdue: ${overdueCount} task${overdueCount !== 1 ? 's' : ''}\n`;
    summaryText += `Inactive: ${inactiveCount} task${inactiveCount !== 1 ? 's' : ''}\n`;
    summaryText += `Estimated workload: ${Math.floor(workloadMin / 60)}h ${workloadMin % 60}m (${workloadHours} hours)`;

    res.json({
      success: true,
      text_summary: summaryText,
      data: {
        urgent_high: Number(todayCounts.urgent_high || 0),
        medium: Number(todayCounts.medium || 0),
        low: Number(todayCounts.low || 0),
        nearest_deadline: nearest || null,
        overdue_count: Number(overdueCount || 0),
        inactive_count: Number(inactiveCount || 0),
        workload_minutes: workloadMin
      }
    });
  } catch (error) {
    console.error("Hermes failed to fetch daily summary:", error);
    res.status(500).json({ success: false, error: "Database query failed" });
  }
});

// POST /api/hermes/check-in - Record a dialogue in conversations history (optional context)
router.post("/check-in", async (req: Request, res: Response) => {
  const { session_id, role, message } = req.body;

  if (!session_id || !role || !message) {
    return res.status(400).json({ success: false, error: "session_id, role, and message are required" });
  }

  const allowedRoles = ["USER", "ASSISTANT", "SYSTEM"];
  if (!allowedRoles.includes(String(role).toUpperCase())) {
    return res.status(400).json({ success: false, error: "role must be USER, ASSISTANT, or SYSTEM" });
  }
  const normalizedRole = String(role).toUpperCase();

  try {
    await pool.execute(
      "INSERT INTO hermes_conversations (session_id, role, message) VALUES (?, ?, ?)",
      [session_id, normalizedRole, message]
    );

    res.json({ success: true, message: "Conversation recorded successfully" });
  } catch (error) {
    console.error("Failed to record conversation history:", error);
    res.status(500).json({ success: false, error: "Database save failed" });
  }
});

export default router;
