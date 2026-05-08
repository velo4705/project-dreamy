import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./CommentSection.css";

export default function CommentSection({ comments, onAdd, onDelete }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyBody, setReplyBody] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login");
      return;
    }
    if (body.trim()) {
      onAdd(body.trim(), null);
      setBody("");
    }
  };

  const handleReply = (parentId) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (replyBody.trim()) {
      onAdd(replyBody.trim(), parentId);
      setReplyBody("");
      setReplyTo(null);
    }
  };

  const buildTree = (comments) => {
    if (!comments || !Array.isArray(comments)) return [];
    const map = {};
    const roots = [];
    comments.forEach((c) => (map[c.id] = { ...c, children: [] }));
    comments.forEach((c) => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].children.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });
    return roots;
  };

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

  const renderComment = (comment, depth = 0) => (
    <div
      key={comment.id}
      className="comment"
      style={{ marginLeft: depth * 24 }}
    >
      <div className="comment-meta">
        <span className="comment-author">{comment?.author}</span>
        <span className="comment-time">{comment?.created_at ? timeAgo(comment.created_at) : ""}</span>
      </div>
      <p className="comment-body">{comment?.body}</p>
      <div className="comment-actions">
        <button
          className="comment-action-btn"
          onClick={() => {
            setReplyTo(replyTo === comment.id ? null : comment.id);
            setReplyBody("");
          }}
        >
          Reply
        </button>
        {user && user.id === comment.author_id && (
          <button
            className="comment-action-btn delete"
            onClick={() => onDelete(comment.id)}
          >
            Delete
          </button>
        )}
      </div>
      {replyTo === comment.id && (
        <div className="reply-form">
          <textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
          />
          <div className="reply-form-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleReply(comment.id)}
            >
              Reply
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setReplyTo(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {comment.children && comment.children.map((child) => renderComment(child, depth + 1))}
    </div>
  );

  const safeComments = comments || [];
  const tree = buildTree(safeComments);

  return (
    <div className="comment-section">
      <h3>{safeComments.length} Comment{safeComments.length !== 1 ? "s" : ""}</h3>

      <form className="comment-form" onSubmit={handleSubmit}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={user ? "Write a comment..." : "Login to comment"}
          rows={3}
          disabled={!user}
        />
        <button type="submit" className="btn btn-primary" disabled={!user}>
          Comment
        </button>
      </form>

      <div className="comments-list">{tree.map((c) => renderComment(c))}</div>
    </div>
  );
}