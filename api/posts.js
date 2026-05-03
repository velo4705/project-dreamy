const pool = require("../../server/db/pool");

module.exports = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "new" } = req.query;

    const offset = (page - 1) * limit;
    let orderBy;

    switch (sort) {
      case "top":
        orderBy = "p.score DESC";
        break;
      case "new":
      default:
        orderBy = "p.created_at DESC";
        break;
    }

    // Get posts with author info and vote counts
    const postsQuery = `
      SELECT
        p.id,
        p.title,
        p.body,
        p.created_at,
        p.updated_at,
        u.username as author,
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
      ORDER BY ${orderBy}
      LIMIT $1 OFFSET $2
    `;

    const postsResult = await pool.query(postsQuery, [limit, offset]);

    // Get total count for pagination
    const countResult = await pool.query("SELECT COUNT(*) as total FROM posts");
    const totalPosts = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      posts: postsResult.rows,
      totalPages,
      currentPage: parseInt(page),
      totalPosts
    });

  } catch (err) {
    console.error("Posts API error:", err);
    res.status(500).json({
      error: "Failed to fetch posts",
      details: err.message
    });
  }
};