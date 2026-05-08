const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db/pool");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Database is connected!", time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: "Database failed: " + err.message });
  }
});

/*
// Import Routers
...
*/

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}