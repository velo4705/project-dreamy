const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db/pool");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Debug endpoint to check database connection
app.get("/api/debug", async (req, res) => {
  try {
    console.log("🔍 Debug endpoint called");
    console.log("Environment variables:", {
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
      DB_USER: process.env.DB_USER ? "SET" : "NOT SET",
      DB_HOST: process.env.DB_HOST || "NOT SET",
      DB_NAME: process.env.DB_NAME || "NOT SET",
    });

    const result = await pool.query("SELECT NOW(), version()");
    console.log("✅ Database connection successful");

    res.json({
      status: "success",
      message: "Database connected",
      timestamp: result.rows[0].now,
      postgres_version: result.rows[0].version,
      env_vars: {
        database_url: !!process.env.DATABASE_URL,
        db_user: !!process.env.DB_USER,
        db_host: !!process.env.DB_HOST,
        db_name: !!process.env.DB_NAME,
      }
    });
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    const dbUrl = process.env.DATABASE_URL || "";
    const hostMatch = dbUrl.match(/@([^:/]+)/);
    const host = hostMatch ? hostMatch[1] : "NOT FOUND";

    res.json({
      status: "error",
      message: "Database connection failed",
      error: err.message,
      debug: {
        detected_host: host,
        url_length: dbUrl.length,
        starts_with_postgres: dbUrl.startsWith("postgresql://")
      },
      env_vars: {
        database_url: !!process.env.DATABASE_URL,
      }
    });
  }
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ status: "ok", time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api", require("./routes/comments"));
app.use("/api/posts", require("./routes/posts"));

module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}