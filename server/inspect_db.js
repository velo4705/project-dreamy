require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function inspect() {
  try {
    const tables = ['users', 'posts', 'comments', 'friendships', 'notifications', 'messages'];
    console.log("--- DB INSPECTION START ---");
    for (const table of tables) {
      const res = await pool.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = $1",
        [table]
      );
      console.log(`Table [${table}]:`, res.rows.map(r => r.column_name).join(', '));
    }
    console.log("--- DB INSPECTION END ---");
  } catch (e) {
    console.error("Inspection Error:", e.message);
  } finally {
    process.exit(0);
  }
}

inspect();
