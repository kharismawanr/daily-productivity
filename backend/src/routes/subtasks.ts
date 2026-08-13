import { Router, Request, Response } from "express";
import { pool } from "../db";
import { logActivity } from "../services/activity";

const router = Router();

// GET /api/tasks/:id/subtasks - List all subtasks for a task
router.get("/tasks/:id/subtasks", async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  if (isNaN(taskId)) {
    return res.status(400).json({ success: false, error: "Invalid task ID" });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM subtasks WHERE task_id = ? ORDER BY id ASC",
      [taskId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error("Failed to fetch subtasks:", error);
    res.status(500).json({ success: false, error: "Database query failed" });
  }
});

// POST /api/tasks/:id/subtasks - Create a subtask
router.post("/tasks/:id/subtasks", async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const { title } = req.body;
  const source = req.apiSource || "WEB";

  if (isNaN(taskId)) {
    return res.status(400).json({ success: false, error: "Invalid task ID" });
  }
  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ success: false, error: "Subtask title is required" });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO subtasks (task_id, title, status) VALUES (?, ?, 'TODO')",
      [taskId, title.trim()]
    );

    const insertId = (result as any).insertId;

    // Log Activity
    await logActivity(
      taskId,
      "SUBTASK_CREATED",
      null,
      `Subtask created: "${title.trim()}"`,
      source
    );

    res.status(201).json({
      success: true,
      data: {
        id: insertId,
        task_id: taskId,
        title: title.trim(),
        status: "TODO"
      }
    });
  } catch (error) {
    console.error("Failed to create subtask:", error);
    res.status(500).json({ success: false, error: "Failed to create subtask" });
  }
});

// PATCH /api/subtasks/:id - Update subtask status or title
router.patch("/subtasks/:id", async (req: Request, res: Response) => {
  const subtaskId = Number(req.params.id);
  const { title, status } = req.body;
  const source = req.apiSource || "WEB";

  if (isNaN(subtaskId)) {
    return res.status(400).json({ success: false, error: "Invalid subtask ID" });
  }

  try {
    const [rows] = await pool.execute("SELECT * FROM subtasks WHERE id = ? LIMIT 1", [subtaskId]);
    const subtask = (rows as any[])[0];

    if (!subtask) {
      return res.status(404).json({ success: false, error: "Subtask not found" });
    }

    const updatedTitle = title !== undefined ? title.trim() : subtask.title;
    const updatedStatus = status !== undefined ? status : subtask.status;

    if (updatedTitle === "") {
      return res.status(400).json({ success: false, error: "Subtask title cannot be empty" });
    }

    let completedAt = subtask.completed_at;
    if (updatedStatus === "DONE" && subtask.status !== "DONE") {
      completedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
    } else if (updatedStatus !== "DONE" && subtask.status === "DONE") {
      completedAt = null;
    }

    await pool.execute(
      "UPDATE subtasks SET title = ?, status = ?, completed_at = ? WHERE id = ?",
      [updatedTitle, updatedStatus, completedAt, subtaskId]
    );

    // Log Activity if status changed
    if (updatedStatus !== subtask.status) {
      await logActivity(
        subtask.task_id,
        updatedStatus === "DONE" ? "SUBTASK_COMPLETED" : "SUBTASK_REOPENED",
        subtask.title,
        updatedStatus,
        source
      );
    }

    res.json({
      success: true,
      data: {
        id: subtaskId,
        task_id: subtask.task_id,
        title: updatedTitle,
        status: updatedStatus,
        completed_at: completedAt
      }
    });
  } catch (error) {
    console.error("Failed to update subtask:", error);
    res.status(500).json({ success: false, error: "Failed to update subtask" });
  }
});

// DELETE /api/subtasks/:id - Delete subtask
router.delete("/subtasks/:id", async (req: Request, res: Response) => {
  const subtaskId = Number(req.params.id);
  if (isNaN(subtaskId)) {
    return res.status(400).json({ success: false, error: "Invalid subtask ID" });
  }

  try {
    const [rows] = await pool.execute("SELECT task_id, title FROM subtasks WHERE id = ? LIMIT 1", [subtaskId]);
    const subtask = (rows as any[])[0];

    if (!subtask) {
      return res.status(404).json({ success: false, error: "Subtask not found" });
    }

    await pool.execute("DELETE FROM subtasks WHERE id = ?", [subtaskId]);

    res.json({
      success: true,
      message: "Subtask deleted successfully"
    });
  } catch (error) {
    console.error("Failed to delete subtask:", error);
    res.status(500).json({ success: false, error: "Failed to delete subtask" });
  }
});

export default router;
