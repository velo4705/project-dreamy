import { useState, useEffect } from "react";
import api from "../api";
import PostCard from "../components/PostCard";
import { Sparkles, TrendingUp, Ghost } from "lucide-react";
import "./Home.css";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState("new");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get(`/posts?sort=${sort}&page=${page}&limit=10`)
      .then((res) => {
        setPosts(res.data.posts || []);
        setTotalPages(res.data.totalPages || 1);
      })
      .catch((err) => {
        console.error("Failed to load posts:", err);
        const serverError = err.response?.data?.error || err.message;
        setError(`SQL Error: ${serverError}`);
        setPosts([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [sort, page]);

  const handleVote = async (postId, value) => {
    try {
      const res = await api.post(`/posts/${postId}/vote`, { value });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, score: res.data.score, user_vote: res.data.user_vote }
            : p
        )
      );
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  return (
    <div className="home container">
      <div className="home-header">
        <h1 className="home-title">Feed</h1>
        <div className="sort-group glass-panel">
          <button
            className={`sort-tab ${sort === "new" ? "active" : ""}`}
            onClick={() => { setSort("new"); setPage(1); }}
          >
            <Sparkles size={18} />
            <span>New</span>
          </button>
          <button
            className={`sort-tab ${sort === "top" ? "active" : ""}`}
            onClick={() => { setSort("top"); setPage(1); }}
          >
            <TrendingUp size={18} />
            <span>Top</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Floating into the feed...</p>
        </div>
      ) : error ? (
        <div className="empty-state centered">
          <div className="empty-icon">🌸</div>
          <h3>Welcome to Dreamy!</h3>
          <p>We are currently experiencing a database connection issue (500 Error).</p>
          <p>Please wait a moment for the sync to finish or try refreshing.</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state centered">
          <Ghost size={48} className="empty-icon" />
          <h3>No posts yet.</h3>
          <p>Be the first one to share a dreamy thought!</p>
        </div>
      ) : (
        <>
          <div className="post-list">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onVote={(value) => handleVote(post.id, value)}
                onDelete={(deletedId) => {
                  setPosts(prev => prev.filter(p => p.id !== deletedId));
                }}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Prev
              </button>
              <span className="page-info">
                {page} / {totalPages}
              </span>
              <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}