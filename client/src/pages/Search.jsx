import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api";
import PostCard from "../components/PostCard";
import "./Home.css";

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    api
      .get(`/search?q=${encodeURIComponent(query)}&page=${page}&limit=10`)
      .then((res) => {
        setPosts(res.data.posts || []);
        setTotalPages(res.data.totalPages || 1);
        setTotal(res.data.total || 0);
      })
      .catch((err) => {
        console.error("Search failed:", err);
        setPosts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [query, page]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const handleVote = async (postId, value) => {
    try {
      const res = await api.post(`/post?id=${postId}`, { value });
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

  if (!query) return <p className="loading">Enter a search query.</p>;

  return (
    <div className="home">
      <div className="home-header">
        <h2>
          Search: "{query}" ({total} result{total !== 1 ? "s" : ""})
        </h2>
      </div>

      {loading ? (
        <p className="loading">Searching...</p>
      ) : posts.length === 0 ? (
        <p className="empty">No posts found for "{query}".</p>
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