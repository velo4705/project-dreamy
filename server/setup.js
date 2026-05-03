const pool = require("./db/pool");

async function setupDatabase() {
  try {
    console.log("Setting up database...");

    // Read and execute schema
    const fs = require("fs");
    const schema = fs.readFileSync("./db/schema.sql", "utf8");
    await pool.query(schema);
    console.log("✅ Schema created");

    // Read and execute seed data
    const seed = fs.readFileSync("./db/seed.sql", "utf8");
    await pool.query(seed);
    console.log("✅ Seed data inserted");

    console.log("🎉 Database setup complete!");
  } catch (err) {
    console.error("❌ Database setup failed:", err);
  } finally {
    pool.end();
  }
}

setupDatabase();