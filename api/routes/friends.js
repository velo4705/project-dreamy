const express = require("express");
const pool = require("../db/pool");
const auth = require("../middleware/auth");
const router = express.Router();

// GET /api/friends/status/:otherUserId - Check friendship status with a user
router.get("/status/:otherUserId", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM friendships 
       WHERE (requester_id = $1 AND receiver_id = $2) 
          OR (requester_id = $2 AND receiver_id = $1)`,
      [req.user.id, req.params.otherUserId]
    );
    res.json(result.rows[0] || { status: "none" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/friends/request/:receiverId - Send a friend request
router.post("/request/:receiverId", auth, async (req, res) => {
  try {
    const receiverId = req.params.receiverId;
    if (receiverId == req.user.id) return res.status(400).json({ error: "Cannot add yourself" });

    await pool.query(
      "INSERT INTO friendships (requester_id, receiver_id) VALUES ($1, $2)",
      [req.user.id, receiverId]
    );

    // Create Notification
    await pool.query(
      "INSERT INTO notifications (user_id, type, data) VALUES ($1, $2, $3)",
      [receiverId, "friend_request", JSON.stringify({ senderId: req.user.id, senderName: req.user.username })]
    );

    res.json({ message: "Request sent" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send request" });
  }
});

// PUT /api/friends/accept/:requesterId - Accept a friend request
router.put("/accept/:requesterId", auth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE friendships SET status = 'accepted' WHERE requester_id = $1 AND receiver_id = $2",
      [req.params.requesterId, req.user.id]
    );
    res.json({ message: "Request accepted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to accept" });
  }
});

// DELETE /api/friends/remove/:otherUserId - Remove a friend or cancel request
router.delete("/remove/:otherUserId", auth, async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM friendships 
       WHERE (requester_id = $1 AND receiver_id = $2) 
          OR (requester_id = $2 AND receiver_id = $1)`,
      [req.user.id, req.params.otherUserId]
    );
    res.json({ message: "Friend removed" });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove" });
  }
});

// GET /api/friends/mutual/:otherUserId - Get mutual friends count
router.get("/mutual/:otherUserId", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `WITH user1_friends AS (
        SELECT receiver_id as friend_id FROM friendships WHERE requester_id = $1 AND status = 'accepted'
        UNION
        SELECT requester_id as friend_id FROM friendships WHERE receiver_id = $1 AND status = 'accepted'
      ),
      user2_friends AS (
        SELECT receiver_id as friend_id FROM friendships WHERE requester_id = $2 AND status = 'accepted'
        UNION
        SELECT requester_id as friend_id FROM friendships WHERE receiver_id = $2 AND status = 'accepted'
      )
      SELECT COUNT(*)::int FROM user1_friends JOIN user2_friends USING (friend_id)`,
      [req.user.id, req.params.otherUserId]
    );
    res.json({ count: result.rows[0].count });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/friends/requests - Get pending incoming friend requests
router.get("/requests", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.id, f.requester_id, u.username, u.avatar_url, f.created_at
       FROM friendships f
       JOIN users u ON f.requester_id = u.id
       WHERE f.receiver_id = $1 AND f.status = 'pending'`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/friends/list - Get all friends
router.get("/list", auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.username, u.avatar_url, u.status_text, u.status_emoji, u.last_seen
       FROM users u
       JOIN friendships f ON (f.requester_id = u.id OR f.receiver_id = u.id)
       WHERE ((f.requester_id = $1 AND f.receiver_id = u.id) OR (f.receiver_id = $1 AND f.requester_id = u.id))
         AND f.status = 'accepted'
         AND u.id != $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

