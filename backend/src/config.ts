import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3001),
  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "casaos",
    password: process.env.DB_PASS ?? "",
    database: process.env.DB_NAME ?? "daily_productivity",
  },
  apiKey: process.env.API_KEY ?? "",
};
