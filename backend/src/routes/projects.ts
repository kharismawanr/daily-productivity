import { Router, Request, Response } from "express";
import { pool } from "../db";

const router = Router();

// GET /api/projects - List all projects with automated progress calculation
router.get("/", async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.*,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'DONE' THEN 1 ELSE 0 END) as completed_tasks
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    const projects = (rows as any[]).map(p => {
      const total = Number(p.total_tasks);
      const completed = Number(p.completed_tasks);
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        priority: p.priority,
        deadline: p.deadline,
        progress_percent: progress,
        total_tasks: total,
        completed_tasks: completed,
        created_at: p.created_at,
        updated_at: p.updated_at,
        archived_at: p.archived_at
      };
    });

    res.json({ success: true, data: projects });
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    res.status(500).json({ success: false, error: "Database query failed" });
  }
});

// POST /api/projects - Create a new project
router.post("/", async (req: Request, res: Response) => {
  const { name, description, status, priority, deadline } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return res.status(400).json({ success: false, error: "Project name is required" });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO projects (name, description, status, priority, deadline) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        name.trim(),
        description || null,
        status || "ACTIVE",
        priority || "MEDIUM",
        deadline || null
      ]
    );

    const insertId = (result as any).insertId;
    res.status(201).json({
      success: true,
      data: {
        id: insertId,
        name: name.trim(),
        description,
        status: status || "ACTIVE",
        priority: priority || "MEDIUM",
        deadline: deadline || null
      }
    });
  } catch (error) {
    console.error("Failed to create project:", error);
    res.status(500).json({ success: false, error: "Failed to create project" });
  }
});

// GET /api/projects/:id - Get detailed project and its tasks
router.get("/:id", async (req: Request, res: Response) => {
  const projectId = Number(req.params.id);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: "Invalid project ID" });
  }

  try {
    const [projRows] = await pool.execute("SELECT * FROM projects WHERE id = ? LIMIT 1", [projectId]);
    const project = (projRows as any[])[0];

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const [taskRows] = await pool.execute(
      "SELECT * FROM tasks WHERE project_id = ? ORDER BY deadline ASC, id DESC",
      [projectId]
    );

    res.json({
      success: true,
      data: {
        ...project,
        tasks: taskRows
      }
    });
  } catch (error) {
    console.error("Failed to fetch project details:", error);
    res.status(500).json({ success: false, error: "Database query failed" });
  }
});

// PATCH /api/projects/:id - Update a project
router.patch("/:id", async (req: Request, res: Response) => {
  const projectId = Number(req.params.id);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: "Invalid project ID" });
  }

  const { name, description, status, priority, deadline } = req.body;

  try {
    const [projRows] = await pool.execute("SELECT * FROM projects WHERE id = ? LIMIT 1", [projectId]);
    const project = (projRows as any[])[0];

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    const updatedName = name !== undefined ? name.trim() : project.name;
    const updatedDesc = description !== undefined ? description : project.description;
    const updatedStatus = status !== undefined ? status : project.status;
    const updatedPriority = priority !== undefined ? priority : project.priority;
    const updatedDeadline = deadline !== undefined ? deadline : project.deadline;

    if (updatedName === "") {
      return res.status(400).json({ success: false, error: "Project name cannot be empty" });
    }

    await pool.execute(
      `UPDATE projects 
       SET name = ?, description = ?, status = ?, priority = ?, deadline = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [updatedName, updatedDesc, updatedStatus, updatedPriority, updatedDeadline, projectId]
    );

    res.json({
      success: true,
      data: {
        id: projectId,
        name: updatedName,
        description: updatedDesc,
        status: updatedStatus,
        priority: updatedPriority,
        deadline: updatedDeadline
      }
    });
  } catch (error) {
    console.error("Failed to update project:", error);
    res.status(500).json({ success: false, error: "Failed to update project" });
  }
});

// DELETE /api/projects/:id - Archive project (soft delete)
router.delete("/:id", async (req: Request, res: Response) => {
  const projectId = Number(req.params.id);
  if (isNaN(projectId)) {
    return res.status(400).json({ success: false, error: "Invalid project ID" });
  }

  try {
    const [projRows] = await pool.execute("SELECT * FROM projects WHERE id = ? LIMIT 1", [projectId]);
    const project = (projRows as any[])[0];

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" });
    }

    // Archive: set status = 'ARCHIVED' and archived_at = NOW()
    await pool.execute(
      "UPDATE projects SET status = 'ARCHIVED', archived_at = CURRENT_TIMESTAMP WHERE id = ?",
      [projectId]
    );

    res.json({
      success: true,
      message: "Project archived successfully",
      data: { id: projectId, status: "ARCHIVED" }
    });
  } catch (error) {
    console.error("Failed to archive project:", error);
    res.status(500).json({ success: false, error: "Failed to archive project" });
  }
});

export default router;
