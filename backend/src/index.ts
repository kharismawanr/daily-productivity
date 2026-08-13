import express from "express";
import cors from "cors";
import { config } from "./config";
import { testConnection } from "./db";
import { authenticateApiKey } from "./routes/authMiddleware";

// Import Routers
import projectRouter from "./routes/projects";
import taskRouter from "./routes/tasks";
import subtaskRouter from "./routes/subtasks";
import dashboardRouter from "./routes/dashboard";
import hermesRouter from "./routes/hermes";

const app = express();

// Middlewares
app.use(cors({ origin: "*" })); // Allow all origins for dev/production local LAN integration
app.use(express.json());

// Public Health Check
app.get("/health", async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    success: true,
    message: "Hermes Work Management API is healthy",
    timestamp: new Date().toISOString(),
    database_connected: dbConnected
  });
});

// Mounted Routes (All protected by API Key authentication)
app.use("/api/v1/projects", authenticateApiKey, projectRouter);
app.use("/api/v1/tasks", authenticateApiKey, taskRouter);
app.use("/api/v1/dashboard", authenticateApiKey, dashboardRouter);
app.use("/api/v1/hermes", authenticateApiKey, hermesRouter);
app.use("/api/v1", authenticateApiKey, subtaskRouter); // Subtasks matching /tasks/:id/subtasks and /subtasks/:id

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Exception:", err);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    details: process.env.NODE_ENV !== "production" ? err.message : undefined
  });
});

// Start Server and Test DB
async function bootstrap() {
  const dbOk = await testConnection();
  if (!dbOk) {
    console.warn("WARNING: Database connection failed. Backend starting anyway, please verify database is running.");
  }

  app.listen(config.port, "0.0.0.0", () => {
    console.log(`===================================================`);
    console.log(`  Hermes Work Management API Server Running!`);
    console.log(`  Port: http://localhost:${config.port}`);
    console.log(`  Endpoint prefix: /api/v1`);
    console.log(`===================================================`);
  });
}

bootstrap();
