import { Link } from "react-router-dom";
import VoteButtons from "./VoteButtons";
import "./PostCard.css";

export default function PostCard({ post, onVote }) {
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
    <div className="post-card">
      <VoteButtons
        score={post.score}
        userVote={post.user_vote}
        onVote={onVote}
      />
      <div className="post-card-content">
        <Link to={`/post/${post.id}`} className="post-card-title">
          {post.title}
        </Link>
        <div className="post-card-meta">
          Posted by{" "}
          <Link to={`/user/${post.author}`} className="post-card-author">
            {post.author}
          </Link>{" "}
          {timeAgo(post.created_at)}
        </div>
        {post.body && (
          <p className="post-card-body">
            {post.body.length > 200
              ? post.body.substring(0, 200) + "..."
              : post.body}
          </p>
        )}
        <div className="post-card-footer">
          <Link to={`/post/${post.id}`} className="post-card-comments">
            {post.comment_count} comment{post.comment_count !== 1 ? "s" : ""}
          </Link>
        </div>
      </div>
    </div>
  );
}
