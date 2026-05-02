import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import PostCard from "../components/PostCard";
import "./UserProfile.css";

export default function UserProfile() {
  const { username } = useParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/posts?limit=50`)
      .then((res) => {
        const userPosts = res.data.posts.filter(
          (p) => p.author === username
        );
        setPosts(userPosts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [username]);

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
    <div className="user-profile">
      <div className="user-header">
        <h2>{username}'s Posts</h2>
        <span className="user-post-count">
          {posts.length} post{posts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : posts.length === 0 ? (
        <p className="empty">No posts by {username} yet.</p>
      ) : (
        <div className="post-list">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onVote={(value) => handleVote(post.id, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
