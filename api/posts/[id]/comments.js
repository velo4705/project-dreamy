const { getPool } = require("../../db");

module.exports = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Post ID is required" });
    }

    const pool = getPool();

    // Get all comments for this post, ordered by creation time
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

    // Group comments by parent_id
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
        // This is a reply
        if (commentsMap[comment.parent_id]) {
          commentsMap[comment.parent_id].children.push(commentObj);
        }
      } else {
        // This is a root comment
        rootComments.push(commentObj);
      }
    });

    res.json(rootComments);

  } catch (err) {
    console.error("Comments fetch error:", err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};