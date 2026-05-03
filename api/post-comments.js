const { getPool } = require("./db");

module.exports = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Post ID is required" });
  }

  if (req.method === "GET") {
    // Get comments for post
    try {
      const pool = getPool();

      const commentsQuery = `
        SELECT
          c.id,
          c.body,
          c.author_id,
          c.post_id,
          c.parent_id,
          c.created_at,
          u.username as author
        FROM comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.post_id = $1
        ORDER BY c.created_at ASC
      `;

      const result = await pool.query(commentsQuery, [id]);

      // Group comments by parent
      const commentsMap = {};
      const rootComments = [];

      result.rows.forEach(comment => {
        const commentObj = {
          id: comment.id,
          body: comment.body,
          author: comment.author,
          author_id: comment.author_id,
          created_at: comment.created_at,
          parent_id: comment.parent_id,
          children: []
        };

        commentsMap[comment.id] = commentObj;

        if (comment.parent_id) {
          if (commentsMap[comment.parent_id]) {
            commentsMap[comment.parent_id].children.push(commentObj);
          }
        } else {
          rootComments.push(commentObj);
        }
      });

      res.json(rootComments);

    } catch (err) {
      console.error("Comments fetch error:", err);
      res.status(500).json({ error: "Failed to fetch comments" });
    }

  } else if (req.method === "POST") {
    // Add comment to post
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
      }

      const jwt = require("jsonwebtoken");
      const token = authHeader.split(" ")[1];
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
      } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
      }

      const { body, parent_id } = req.body;

      if (!body || body.trim().length === 0) {
        return res.status(400).json({ error: "Comment body is required" });
      }

      const pool = getPool();
      const userId = decoded.id;

      const result = await pool.query(
        `INSERT INTO comments (body, author_id, post_id, parent_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, body, author_id, post_id, parent_id, created_at`,
        [body.trim(), userId, id, parent_id || null]
      );

      const comment = result.rows[0];
      const userResult = await pool.query("SELECT username FROM users WHERE id = $1", [userId]);
      comment.author = userResult.rows[0].username;

      res.status(201).json(comment);

    } catch (err) {
      console.error("Add comment error:", err);
      res.status(500).json({ error: "Failed to add comment" });
    }

  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};