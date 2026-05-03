const { getPool } = require("../db");
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
    const { value } = req.body;

    if (!id || value === undefined) {
      return res.status(400).json({ error: "Post ID and vote value are required" });
    }

    if (value !== -1 && value !== 1) {
      return res.status(400).json({ error: "Vote value must be -1 or 1" });
    }

    const pool = getPool();
    const userId = decoded.id;

    // Check if user already voted on this post
    const existingVote = await pool.query(
      "SELECT id, value FROM votes WHERE user_id = $1 AND post_id = $2",
      [userId, id]
    );

    if (existingVote.rows.length > 0) {
      const currentVote = existingVote.rows[0];

      if (currentVote.value === value) {
        // User is trying to vote the same way again - remove the vote
        await pool.query("DELETE FROM votes WHERE id = $1", [currentVote.id]);
      } else {
        // User is changing their vote
        await pool.query(
          "UPDATE votes SET value = $1 WHERE id = $2",
          [value, currentVote.id]
        );
      }
    } else {
      // New vote
      await pool.query(
        "INSERT INTO votes (user_id, post_id, value) VALUES ($1, $2, $3)",
        [userId, id, value]
      );
    }

    // Calculate new score
    const scoreResult = await pool.query(
      "SELECT COALESCE(SUM(value), 0) as score FROM votes WHERE post_id = $1",
      [id]
    );

    const newScore = parseInt(scoreResult.rows[0].score);

    res.json({
      message: "Vote recorded",
      score: newScore,
      user_vote: value
    });

  } catch (err) {
    console.error("Vote error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};