import { Router, Request, Response } from "express";
import { pool } from "../db";
import { logActivity } from "../services/activity";

const router = Router();

// Helper to resolve project name to project_id or create if not exists
async function resolveProject(projectInput: unknown): Promise<number | null> {
  if (!projectInput) return null;

  // If it's already a number, return it
  if (typeof projectInput === "number") {
    return projectInput;
  }

  // If it's a numeric string, convert and return
  if (typeof projectInput === "string" && !isNaN(Number(projectInput))) {
    return Number(projectInput);
  }

  // If it's a project name string
  if (typeof projectInput === "string" && projectInput.trim() !== "") {
    const name = projectInput.trim();
    
    // Check if project exists by name (case-insensitive)
    const [rows] = await pool.execute(
      "SELECT id FROM projects WHERE LOWER(name) = LOWER(?) LIMIT 1",
      [name]
    );

    const match = rows as { id: number }[];
    if (match.length > 0) {
      return match[0].id;
    }

    // Create a new project with this name
    const [insertResult] = await pool.execute(
      "INSERT INTO projects (name, description, status, priority) VALUES (?, ?, 'ACTIVE', 'MEDIUM')",
      [name, `Project created automatically by Hermes for task association.`]
    );
    
    return (insertResult as any).insertId;
  }

  return null;
}

// Compute deadline state helper
function getDeadlineStatus(status: string, deadline: string | null): string {
  if (!deadline) return "NO_DEADLINE";
  if (status === "DONE") return "COMPLETED";

  const now = new Date();
  const dl = new Date(deadline);

  if (dl < now) {
    return "OVERDUE";
  }

  // Due soon: within 2 hours
  const diffMs = dl.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours >= 0 && diffHours <= 2) {
    return "DUE_SOON";
  }

  return "UPCOMING";
}

// GET /api/tasks - Get all tasks with project name and deadline_status
router.get("/", async (req: Request, res: Response) => {
  const { project_id, status } = req.query;

  try {
    let query = `
      SELECT t.*, p.name as project_name 
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
    `;
    const params: any[] = [];

    const conditions: string[] = [];
    if (project_id) {
      conditions.push("t.project_id = ?");
      params.push(Number(project_id));
    }
    if (status) {
      conditions.push("t.status = ?");
      params.push(String(status));
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY t.deadline ASC, t.id DESC";

    const [rows] = await pool.query(query, params);

    const tasks = (rows as any[]).map(t => ({
      ...t,
      deadline_status: getDeadlineStatus(t.status, t.deadline)
    }));

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    res.status(500).json({ success: false, error: "Database query failed" });
  }
});

// POST /api/tasks - Create a task
router.post("/", async (req: Request, res: Response) => {
  const { title, description, status, priority, deadline, estimated_minutes, project } = req.body;
  const source = req.apiSource || "WEB";

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ success: false, error: "Task title is required" });
  }

  try {
    // Resolve project name/id
    const projectId = await resolveProject(project);

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
      `Task created with title: "${title.trim()}"`,
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
        progress_percent: 0,
        deadline_status: getDeadlineStatus(status || "TODO", deadline || null)
      }
    });
  } catch (error) {
    console.error("Failed to create task:", error);
    res.status(500).json({ success: false, error: "Failed to create task" });
  }
});

// GET /api/tasks/:id - Get a task with its subtasks and activities
router.get("/:id", async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId)) {
    return res.status(400).json({ success: false, error: "Invalid task ID" });
  }

  try {
    const [taskRows] = await pool.execute(
      `SELECT t.*, p.name as project_name 
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = ? LIMIT 1`,
      [taskId]
    );
    const task = (taskRows as any[])[0];

    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    const [subtasks] = await pool.execute(
      "SELECT * FROM subtasks WHERE task_id = ? ORDER BY id ASC",
      [taskId]
    );

    const [activities] = await pool.execute(
      "SELECT * FROM task_activity WHERE task_id = ? ORDER BY created_at DESC",
      [taskId]
    );

    res.json({
      success: true,
      data: {
        ...task,
        deadline_status: getDeadlineStatus(task.status, task.deadline),
        subtasks,
        activities
      }
    });
  } catch (error) {
    console.error("Failed to fetch task details:", error);
    res.status(500).json({ success: false, error: "Database query failed" });
  }
});

// PATCH /api/tasks/:id - Update a task
router.patch("/:id", async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId)) {
    return res.status(400).json({ success: false, error: "Invalid task ID" });
  }

  const {
    title,
    description,
    status,
    priority,
    deadline,
    estimated_minutes,
    actual_minutes,
    progress_percent,
    blocker_reason,
    project
  } = req.body;
  const source = req.apiSource || "WEB";

  try {
    const [taskRows] = await pool.execute("SELECT * FROM tasks WHERE id = ? LIMIT 1", [taskId]);
    const task = (taskRows as any[])[0];

    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    const projectId = project !== undefined ? await resolveProject(project) : task.project_id;
    const updatedTitle = title !== undefined ? title.trim() : task.title;
    const updatedDesc = description !== undefined ? description : task.description;
    const updatedStatus = status !== undefined ? status : task.status;
    const updatedPriority = priority !== undefined ? priority : task.priority;
    const updatedDeadline = deadline !== undefined ? deadline : task.deadline;
    const updatedEst = estimated_minutes !== undefined ? Number(estimated_minutes) : task.estimated_minutes;
    const updatedAct = actual_minutes !== undefined ? Number(actual_minutes) : task.actual_minutes;
    const updatedProg = progress_percent !== undefined ? Number(progress_percent) : task.progress_percent;
    const updatedBlocker = blocker_reason !== undefined ? blocker_reason : task.blocker_reason;

    if (updatedTitle === "") {
      return res.status(400).json({ success: false, error: "Task title cannot be empty" });
    }

    // Determine completed_at date
    let completedAt = task.completed_at;
    if (updatedStatus === "DONE" && task.status !== "DONE") {
      completedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
    } else if (updatedStatus !== "DONE" && task.status === "DONE") {
      completedAt = null;
    }

    // Perform update
    await pool.execute(
      `UPDATE tasks 
       SET project_id = ?, title = ?, description = ?, status = ?, priority = ?, 
           deadline = ?, estimated_minutes = ?, actual_minutes = ?, progress_percent = ?, 
           blocker_reason = ?, completed_at = ?, last_activity_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        projectId,
        updatedTitle,
        updatedDesc,
        updatedStatus,
        updatedPriority,
        updatedDeadline,
        updatedEst,
        updatedAct,
        updatedProg,
        updatedBlocker,
        completedAt,
        taskId
      ]
    );

    // Logging Activities elegantly
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
        project_id: projectId,
        title: updatedTitle,
        description: updatedDesc,
        status: updatedStatus,
        priority: updatedPriority,
        deadline: updatedDeadline,
        estimated_minutes: updatedEst,
        actual_minutes: updatedAct,
        progress_percent: updatedProg,
        blocker_reason: updatedBlocker,
        completed_at: completedAt,
        deadline_status: getDeadlineStatus(updatedStatus, updatedDeadline)
      }
    });
  } catch (error) {
    console.error("Failed to update task:", error);
    res.status(500).json({ success: false, error: "Failed to update task" });
  }
});

// PATCH /api/tasks/:id/status - Update task status directly (for Kanban DnD)
router.patch("/:id/status", async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const { status } = req.body;
  const source = req.apiSource || "WEB";

  if (!status) {
    return res.status(400).json({ success: false, error: "Status is required" });
  }

  try {
    const [taskRows] = await pool.execute("SELECT status, completed_at FROM tasks WHERE id = ? LIMIT 1", [taskId]);
    const task = (taskRows as any[])[0];

    if (!task) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    let completedAt = task.completed_at;
    let progress = status === "DONE" ? 100 : (task.status === "DONE" ? 0 : null);

    if (status === "DONE" && task.status !== "DONE") {
      completedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
    } else if (status !== "DONE" && task.status === "DONE") {
      completedAt = null;
    }

    let updateQuery = "UPDATE tasks SET status = ?, completed_at = ?, last_activity_at = CURRENT_TIMESTAMP";
    const updateParams: any[] = [status, completedAt];

    if (progress !== null) {
      updateQuery += ", progress_percent = ?";
      updateParams.push(progress);
    }

    updateQuery += " WHERE id = ?";
    updateParams.push(taskId);

    await pool.execute(updateQuery, updateParams);

    // Log Activity
    await logActivity(
      taskId,
      status === "DONE" ? "TASK_COMPLETED" : (task.status === "DONE" ? "TASK_REOPENED" : "STATUS_CHANGED"),
      task.status,
      status,
      source
    );

    res.json({
      success: true,
      data: {
        id: taskId,
        status,
        completed_at: completedAt,
        progress_percent: progress !== null ? progress : undefined
      }
    });
  } catch (error) {
    console.error("Failed to update task status:", error);
    res.status(500).json({ success: false, error: "Failed to update task status" });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete("/:id", async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId)) {
    return res.status(400).json({ success: false, error: "Invalid task ID" });
  }

  try {
    const [taskRows] = await pool.execute("SELECT id FROM tasks WHERE id = ? LIMIT 1", [taskId]);
    if ((taskRows as any[]).length === 0) {
      return res.status(404).json({ success: false, error: "Task not found" });
    }

    await pool.execute("DELETE FROM tasks WHERE id = ?", [taskId]);

    res.json({
      success: true,
      message: "Task deleted successfully"
    });
  } catch (error) {
    console.error("Failed to delete task:", error);
    res.status(500).json({ success: false, error: "Failed to delete task" });
  }
});

export default router;
