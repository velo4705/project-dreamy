const express = require("express");
const pool = require("../db/pool");
const auth = require("../middleware/auth");
const router = express.Router();

// GET /api/notifications - Get user notifications
router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put("/:id/read", auth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2",
      [req.params.id, req.user.id]
    );
    res.json({ message: "Marked as read" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/notifications - Clear all notifications
router.delete("/", auth, async (req, res) => {
  try {
    await pool.query("DELETE FROM notifications WHERE user_id = $1", [req.user.id]);
    res.json({ message: "Notifications cleared" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
