const { getPool } = require("../db");

module.exports = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    const pool = getPool();

    // Get post with author info and metadata
    const postQuery = `
      SELECT
        p.id,
        p.title,
        p.body,
        p.created_at,
        p.updated_at,
        u.username as author,
        u.id as author_id,
        COALESCE(v.score, 0) as score,
        COALESCE(c.comment_count, 0) as comment_count,
        COALESCE(uv.user_vote, 0) as user_vote
      FROM posts p
      JOIN users u ON p.author_id = u.id
      LEFT JOIN (
        SELECT post_id, SUM(value) as score
        FROM votes
        GROUP BY post_id
      ) v ON p.id = v.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as comment_count
        FROM comments
        GROUP BY post_id
      ) c ON p.id = c.post_id
      LEFT JOIN (
        SELECT post_id, value as user_vote
        FROM votes
        WHERE user_id = $2
      ) uv ON p.id = uv.post_id
      WHERE p.id = $1
    `;

    // Try to get user ID from JWT if available
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
        userId = decoded.id;
      } catch (err) {
        // Token invalid, continue without user context
      }
    }

    const postResult = await pool.query(postQuery, [id, userId]);

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(postResult.rows[0]);

  } catch (err) {
    console.error("Post fetch error:", err);
    res.status(500).json({ error: "Failed to fetch post" });
  }
};