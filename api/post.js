const { getPool } = require("./db");
const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Post ID is required" });
  }

  if (req.method === "GET") {
    // Get single post
    try {
      const pool = getPool();

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
          COALESCE(c.comment_count, 0) as comment_count
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
        WHERE p.id = $1
      `;

      const postResult = await pool.query(postQuery, [id]);

      if (postResult.rows.length === 0) {
        return res.status(404).json({ error: "Post not found" });
      }

      res.json(postResult.rows[0]);

    } catch (err) {
      console.error("Post fetch error:", err);
      res.status(500).json({ error: "Failed to fetch post" });
    }

  } else if (req.method === "POST") {
    // Vote on post
    try {
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

      const { value } = req.body;

      if (value === undefined || (value !== -1 && value !== 1)) {
        return res.status(400).json({ error: "Vote value must be -1 or 1" });
      }

      const pool = getPool();
      const userId = decoded.id;

      // Check existing vote
      const existingVote = await pool.query(
        "SELECT id, value FROM votes WHERE user_id = $1 AND post_id = $2",
        [userId, id]
      );

      if (existingVote.rows.length > 0) {
        const currentVote = existingVote.rows[0];
        if (currentVote.value === value) {
          // Remove vote
          await pool.query("DELETE FROM votes WHERE id = $1", [currentVote.id]);
        } else {
          // Change vote
          await pool.query("UPDATE votes SET value = $1 WHERE id = $2", [value, currentVote.id]);
        }
      } else {
        // New vote
        await pool.query("INSERT INTO votes (user_id, post_id, value) VALUES ($1, $2, $3)", [userId, id, value]);
      }

      // Get new score
      const scoreResult = await pool.query(
        "SELECT COALESCE(SUM(value), 0) as score FROM votes WHERE post_id = $1",
        [id]
      );

      res.json({
        message: "Vote recorded",
        score: parseInt(scoreResult.rows[0].score),
        user_vote: value
      });

    } catch (err) {
      console.error("Vote error:", err);
      res.status(500).json({ error: "Internal server error" });
    }

  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};