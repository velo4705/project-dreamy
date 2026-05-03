const pool = require("../../server/db/pool");

module.exports = async (req, res) => {
  try {
    console.log("🔍 Debug endpoint called");
    console.log("Environment variables:", {
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
      DB_USER: process.env.DB_USER ? "SET" : "NOT SET",
      DB_HOST: process.env.DB_HOST || "NOT SET",
    });

    const result = await pool.query("SELECT NOW(), version()");
    console.log("✅ Database connection successful");

    res.status(200).json({
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
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: err.message,
      env_vars: {
        database_url: !!process.env.DATABASE_URL,
        db_user: !!process.env.DB_USER,
        db_host: !!process.env.DB_HOST,
        db_name: !!process.env.DB_NAME,
      }
    });
  }
};