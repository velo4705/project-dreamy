const express = require("express");
const pool = require("../db/pool");
const auth = require("../middleware/auth");
const router = express.Router();

// GET /api/messages/conversations - Get list of users the current user has chatted with
router.get("/conversations", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (other_id) 
              other_id, 
              u.username AS other_username, 
              u.avatar_url AS other_avatar,
              m.body AS last_message,
              m.created_at AS last_message_time
       FROM (
         SELECT receiver_id AS other_id, body, created_at FROM messages WHERE sender_id = $1
         UNION
         SELECT sender_id AS other_id, body, created_at FROM messages WHERE receiver_id = $1
       ) m
       JOIN users u ON m.other_id = u.id
       ORDER BY other_id, m.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get conversations error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/messages/:otherUserId - Get chat history with a specific user
router.get("/:otherUserId", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, u_send.username AS sender_name, u_recv.username AS receiver_name
       FROM messages m
       JOIN users u_send ON m.sender_id = u_send.id
       JOIN users u_recv ON m.receiver_id = u_recv.id
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [req.user.id, req.params.otherUserId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/messages - Send a message
router.post("/", auth, async (req, res) => {
  try {
    const { receiver_id, body } = req.body;
    if (!body || !receiver_id) return res.status(400).json({ error: "Missing data" });

    const result = await pool.query(
      "INSERT INTO messages (sender_id, receiver_id, body) VALUES ($1, $2, $3) RETURNING *",
      [req.user.id, receiver_id, body]
    );

    const message = result.rows[0];

    // Create Notification for receiver
    await pool.query(
      "INSERT INTO notifications (user_id, type, data) VALUES ($1, $2, $3)",
      [receiver_id, "message", JSON.stringify({ 
        senderId: req.user.id, 
        senderName: req.user.username,
        messagePreview: body.substring(0, 50)
      })]
    );

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
