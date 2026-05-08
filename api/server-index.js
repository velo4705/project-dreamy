const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db/pool");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import Routers
const authRouter = require("./routes/auth");
const postsRouter = require("./routes/posts");
const commentsRouter = require("./routes/comments");
const usersRouter = require("./routes/users");
const notificationsRouter = require("./routes/notifications");
const messagesRouter = require("./routes/messages");
const friendsRouter = require("./routes/friends");
const votesRouter = require("./routes/votes");
const searchRouter = require("./routes/search");

// --- API Route Mounting ---
app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/users", usersRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/votes", votesRouter);
app.use("/api/search", searchRouter);

// Standard Debug Endpoint
app.get("/api/debug", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW(), version()");
    res.json({
      status: "success",
      message: "Database connected",
      timestamp: result.rows[0].now,
      postgres_version: result.rows[0].version
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}