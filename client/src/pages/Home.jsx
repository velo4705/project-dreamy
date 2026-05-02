import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import PostCard from "../components/PostCard";
import "./Home.css";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState("new");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/posts?sort=${sort}&page=${page}&limit=10`)
      .then((res) => {
        setPosts(res.data.posts);
        setTotalPages(res.data.totalPages);
      })
      .catch(console.error)
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
    <div className="home">
      <div className="home-header">
        <h2>Posts</h2>
        <div className="sort-buttons">
          <button
            className={`sort-btn ${sort === "new" ? "active" : ""}`}
            onClick={() => {
              setSort("new");
              setPage(1);
            }}
          >
            New
          </button>
          <button
            className={`sort-btn ${sort === "top" ? "active" : ""}`}
            onClick={() => {
              setSort("top");
              setPage(1);
            }}
          >
            Top
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="empty">No posts yet. Be the first to post!</p>
      ) : (
        <>
          <div className="post-list">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onVote={(value) => handleVote(post.id, value)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
