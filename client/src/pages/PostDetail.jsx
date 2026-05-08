import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import VoteButtons from "../components/VoteButtons";
import CommentSection from "../components/CommentSection";
import "./PostDetail.css";

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  useEffect(() => {
    Promise.all([
      api.get(`/posts/${id}`),
      api.get(`/posts/${id}/comments`)
    ])
      .then(([postRes, commentsRes]) => {
        setPost(postRes.data);
        setComments(commentsRes.data);
        setEditTitle(postRes.data.title);
        setEditBody(postRes.data.body || "");
      })
      .catch((err) => {
        console.error("Failed to load post:", err);
        setPost(null);
        setComments([]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleVote = async (value) => {
    try {
      const res = await api.post(`/posts/${id}/vote`, { value });
      setPost((p) => ({
        ...p,
        score: res.data.score,
        user_vote: res.data.user_vote,
      }));
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  const handleAddComment = async (body, parentId) => {
    try {
      const res = await api.post(`/posts/${id}/comments`, {
        body,
        parent_id: parentId,
      });
      setComments((prev) => [...prev, res.data]);
      setPost((p) => ({
        ...p,
        comment_count: (p.comment_count || 0) + 1,
      }));
    } catch (err) {
      console.error("Add comment failed:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setPost((p) => ({
        ...p,
        comment_count: Math.max(0, (p.comment_count || 0) - 1),
      }));
    } catch (err) {
      console.error("Delete comment failed:", err);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/posts/${id}`, {
        title: editTitle,
        body: editBody,
      });
      setPost((p) => ({ ...p, ...res.data }));
      setEditing(false);
    } catch (err) {
      console.error("Edit failed:", err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${id}`);
      navigate("/");
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading) return <p className="loading">Loading...</p>;
  if (!post) return <p className="loading">Post not found.</p>;

  const isOwner = user && user.id === post.author_id;

  const timeAgo = (dateStr) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="post-detail">
      <div className="post-detail-main">
        <VoteButtons
          score={post.score}
          userVote={post.user_vote}
          onVote={handleVote}
        />
        <div className="post-detail-content">
          {editing ? (
            <form className="edit-form" onSubmit={handleEdit}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={5}
              />
              <div className="edit-actions">
                <button type="submit" className="btn btn-primary btn-sm">
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="post-detail-title">{post.title}</h1>
              <div className="post-detail-meta">
                Posted by{" "}
                <Link to={`/user/${post.author}`}>{post.author}</Link>{" "}
                {timeAgo(post.created_at)}
                {post.updated_at !== post.created_at && " (edited)"}
              </div>
              {post.body && <p className="post-detail-body">{post.body}</p>}
              {isOwner && (
                <div className="post-owner-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditing(true)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-secondary btn-sm delete"
                    onClick={handleDelete}
                  >
                    Delete
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <hr className="divider" />

      <CommentSection
        comments={comments}
        onAdd={handleAddComment}
        onDelete={handleDeleteComment}
      />
    </div>
  );
}