const { getPool } = require("../../db");
const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    const pool = getPool();

    // Get comments with nested structure
    const commentsQuery = `
      WITH RECURSIVE comment_tree AS (
        -- Base case: root comments
        SELECT
          c.id,
          c.body,
          c.author_id,
          c.post_id,
          c.parent_id,
          c.created_at,
          u.username as author,
          0 as depth,
          ARRAY[c.id] as path
        FROM comments c
        JOIN users u ON c.author_id = u.id
        WHERE c.post_id = $1 AND c.parent_id IS NULL

        UNION ALL

        -- Recursive case: child comments
        SELECT
          c.id,
          c.body,
          c.author_id,
          c.post_id,
          c.parent_id,
          c.created_at,
          u.username as author,
          ct.depth + 1,
          ct.path || c.id
        FROM comments c
        JOIN users u ON c.author_id = u.id
        JOIN comment_tree ct ON c.parent_id = ct.id
      )
      SELECT * FROM comment_tree
      ORDER BY path, created_at
    `;

    const result = await pool.query(commentsQuery, [id]);

    // Transform flat results into nested structure
    const commentsMap = {};
    const rootComments = [];

    result.rows.forEach(comment => {
      const commentObj = {
        id: comment.id,
        body: comment.body,
        author: comment.author,
        author_id: comment.author_id,
        created_at: comment.created_at,
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
};