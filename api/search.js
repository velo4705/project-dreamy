const { getPool } = require("./db");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { q: query, page = 1, limit = 10 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: "Search query is required" });
    }

    const offset = (page - 1) * limit;
    const pool = getPool();

    const searchQuery = `
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
      WHERE
        p.title ILIKE $1 OR
        p.body ILIKE $1 OR
        u.username ILIKE $1
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const searchTerm = `%${query.trim()}%`;
    const postsResult = await pool.query(searchQuery, [searchTerm, limit, offset]);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM posts p
      JOIN users u ON p.author_id = u.id
      WHERE
        p.title ILIKE $1 OR
        p.body ILIKE $1 OR
        u.username ILIKE $1
    `;
    const countResult = await pool.query(countQuery, [searchTerm]);
    const totalPosts = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalPosts / limit);

    res.status(200).json({
      posts: postsResult.rows,
      totalPages,
      currentPage: parseInt(page),
      totalPosts,
      query: query.trim()
    });

  } catch (err) {
    console.error("Search API error:", err);
    res.status(500).json({
      error: "Search failed",
      details: err.message
    });
  }
};