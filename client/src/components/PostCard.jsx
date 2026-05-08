import { Link } from "react-router-dom";
import { MessageSquare, Share2, CornerUpRight, Trash2 } from "lucide-react";
import VoteButtons from "./VoteButtons";
import MediaGallery from "./MediaGallery";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "./PostCard.css";

export default function PostCard({ post, onVote, onDelete }) {
  const { user } = useAuth();
  
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

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post? ✨")) return;
    try {
      await api.delete(`/posts/${post.id}`);
      if (onDelete) onDelete(post.id);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed: " + (err.response?.data?.error || err.message));
    }
  };

  const isAuthor = user && user.username === post.author;

  return (
    <div className="post-card glass-panel">
      <div className="post-card-sidebar">
        <VoteButtons
          score={post.score}
          userVote={post.user_vote}
          onVote={onVote}
        />
      </div>
      <div className="post-card-content">
        <Link to={`/post/${post.id}`} className="post-card-title">
          {post.title}
        </Link>

        <MediaGallery
          media={post.media}
          mediaUrl={post.media_url}
          mediaType={post.media_type}
        />

        {post.parent_post_id && (
          <div className="crosspost-banner">
            <CornerUpRight size={14} />
            Responding to: <Link to={`/post/${post.parent_post_id}`}>{post.parent_title || "Post"}</Link>
          </div>
        )}

        <div className="post-card-meta">
          {post.author_avatar ? (
            <img src={post.author_avatar} className="post-card-avatar" alt="" />
          ) : (
            <div className="post-card-avatar-placeholder">
              {post.author ? post.author[0].toUpperCase() : "?"}
            </div>
          )}
          <Link to={`/user/${post.author}`} className="post-card-author">{post.author}</Link>
          <span className="dot">·</span>
          <span className="post-card-time">{timeAgo(post.created_at)}</span>
        </div>

        {post.body && (
          <p className="post-card-body">
            {post.body.length > 300 ? `${post.body.substring(0, 300)}…` : post.body}
          </p>
        )}

        <div className="post-card-footer">
          <Link to={`/post/${post.id}`} className="footer-action">
            <MessageSquare size={16} />
            <span>{post.comment_count || 0} comments</span>
          </Link>
          
          <button
            className="footer-action"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
              alert("Link copied!");
            }}
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>

          {isAuthor && (
            <button className="footer-action delete-action" onClick={handleDelete}>
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
