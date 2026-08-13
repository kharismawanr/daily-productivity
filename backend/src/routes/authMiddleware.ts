import { Request, Response, NextFunction } from "express";
import { pool } from "../db";
import { config } from "../config";

// Extend Express Request interface to store authorized label
declare global {
  namespace Express {
    interface Request {
      apiKeyLabel?: string;
      apiSource?: "WEB" | "HERMES" | "SYSTEM";
    }
  }
}

export async function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 1. Get API Key from header X-API-KEY or Authorization Bearer
  let apiKey = req.headers["x-api-key"] as string | undefined;
  
  if (!apiKey) {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      apiKey = authHeader.substring(7);
    }
  }

  // 2. Fallback: Allow localhost in local dev (for convenience of manual debugging)
  const isLocalhost = 
    req.hostname === "localhost" || 
    req.hostname === "127.0.0.1";
  
  // In development, if no API key is specified and it is local, let it slide or use fallback
  if (!apiKey && isLocalhost && process.env.NODE_ENV !== "production") {
    req.apiKeyLabel = "Local Dev Fallback";
    req.apiSource = "WEB";
    return next();
  }

  if (!apiKey) {
    return res.status(401).json({ success: false, error: "API Key is required" });
  }

  // 3. Query MariaDB to check if the key is active
  try {
    const [rows] = await pool.execute(
      "SELECT label FROM api_keys WHERE api_key = ? AND is_active = 1 LIMIT 1",
      [apiKey]
    );

    const keyRows = rows as { label: string }[];
    if (keyRows.length > 0) {
      req.apiKeyLabel = keyRows[0].label;
      // Determine source based on key name or headers
      req.apiSource = keyRows[0].label.toLowerCase().includes("hermes") ? "HERMES" : "WEB";
      return next();
    }
  } catch (error) {
    console.error("API Key authentication error:", error);
    return res.status(500).json({ success: false, error: "Internal server authentication error" });
  }

  return res.status(401).json({ success: false, error: "Invalid or inactive API Key" });
}
