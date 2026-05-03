const { getPool } = require("../../db");
const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { id } = req.query;
    const { body, parent_id } = req.body;

    if (!id || !body || body.trim().length === 0) {
      return res.status(400).json({ error: "Post ID and comment body are required" });
    }

    const pool = getPool();
    const userId = decoded.id;

    // Insert comment
    const result = await pool.query(
      `INSERT INTO comments (body, author_id, post_id, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, body, author_id, post_id, parent_id, created_at`,
      [body.trim(), userId, id, parent_id || null]
    );

    const comment = result.rows[0];

    // Get author username
    const userResult = await pool.query(
      "SELECT username FROM users WHERE id = $1",
      [userId]
    );

    comment.author = userResult.rows[0].username;

    res.status(201).json(comment);

  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
};