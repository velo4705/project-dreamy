const { getPool } = require("../../db");
const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
  if (req.method !== "DELETE") {
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

    if (!id) {
      return res.status(400).json({ error: "Comment ID is required" });
    }

    const pool = getPool();
    const userId = decoded.id;

    // Check if comment exists and belongs to user
    const commentResult = await pool.query(
      "SELECT id, author_id FROM comments WHERE id = $1",
      [id]
    );

    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const comment = commentResult.rows[0];
    if (comment.author_id !== userId) {
      return res.status(403).json({ error: "You can only delete your own comments" });
    }

    // Delete the comment
    await pool.query("DELETE FROM comments WHERE id = $1", [id]);

    res.json({ message: "Comment deleted successfully" });

  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};