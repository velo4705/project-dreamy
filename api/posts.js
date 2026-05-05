    const pool = getPool();

    // Base query
    let postsQuery = `
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
    `;

    // Add sorting
    if (sort === "top") {
      postsQuery += " ORDER BY COALESCE(v.score, 0) DESC, p.created_at DESC";
    } else {
      postsQuery += " ORDER BY p.created_at DESC";
    }

    postsQuery += " LIMIT $1 OFFSET $2";

    const postsResult = await pool.query(postsQuery, [limit, offset]);