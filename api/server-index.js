const express = require("express");
const cors = require("cors");
require("dotenv").config();

// const pool = require("./db/pool");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.get("/api/test-skeleton", (req, res) => {
  res.json({ message: "Skeleton is online!" });
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