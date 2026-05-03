const { Pool } = require("pg");

let pool;

function getPool() {
  if (!pool) {
    let poolConfig;

    // Check if DATABASE_URL is provided (Vercel Neon integration)
    if (process.env.DATABASE_URL) {
      poolConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false, // Required for Neon
        },
      };
    } else {
      // Fallback to individual environment variables (manual setup)
      poolConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        ssl: {
          rejectUnauthorized: false, // Required for Neon
        },
      };
    }

    pool = new Pool(poolConfig);
  }

  return pool;
}

module.exports = { getPool };