import mysql from "mysql2/promise";
import { config } from "./config";

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  dateStrings: true,
});

export async function testConnection(): Promise<boolean> {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log("MariaDB/MySQL database connected successfully.");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    return false;
  }
}
