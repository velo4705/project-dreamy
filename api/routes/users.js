const express = require("express");
const pool = require("../db/pool");
const router = express.Router();

// GET /api/users/:username - Get public profile
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const userResult = await pool.query(
      `SELECT id, username, bio, avatar_url, banner_url, status_text, status_emoji, is_private, last_seen, created_at,
              (SELECT COALESCE(SUM(v.value), 0)::int FROM votes v JOIN posts p ON v.post_id = p.id WHERE p.author_id = users.id) AS karma
       FROM users
       WHERE username = $1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    if (user.is_private) {
      return res.json({
        username: user.username,
        is_private: true,
        avatar_url: user.avatar_url,
        last_seen: user.last_seen,
        karma: user.karma
      });
    }

    res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
