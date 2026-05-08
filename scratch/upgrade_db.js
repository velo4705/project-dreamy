const pool = require("../api/db/pool");

async function upgrade() {
  try {
    console.log("Checking database...");
    await pool.query(`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS media JSONB DEFAULT '[]'::jsonb;
    `);
    console.log("✅ Success! The 'media' column has been added to support multiple uploads.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error upgrading database:", err);
    process.exit(1);
  }
}

upgrade();
