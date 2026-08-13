import { pool } from "../db";

export type ActivitySource = "WEB" | "HERMES" | "SYSTEM";

export async function logActivity(
  taskId: number,
  action: string,
  oldValue: string | null,
  newValue: string | null,
  source: ActivitySource
): Promise<void> {
  try {
    await pool.execute(
      "INSERT INTO task_activity (task_id, action, old_value, new_value, source) VALUES (?, ?, ?, ?, ?)",
      [taskId, action, oldValue, newValue, source]
    );
  } catch (error) {
    console.error(`Failed to log activity for task ${taskId}:`, error);
  }
}
