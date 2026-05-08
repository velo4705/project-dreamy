import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./VoteButtons.css";

export default function VoteButtons({ score, userVote, onVote }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleVote = (value) => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Toggle: if same value is clicked, send 0 to remove vote
    const newValue = userVote === value ? 0 : value;
    onVote(newValue);
  };

  return (
    <div className="vote-buttons">
      <button
        className={`vote-btn upvote ${userVote === 1 ? "active" : ""}`}
        onClick={() => handleVote(1)}
        title="Upvote"
      >
        <ArrowBigUp size={24} fill={userVote === 1 ? "currentColor" : "none"} />
      </button>
      <span className="vote-score">{score}</span>
      <button
        className={`vote-btn downvote ${userVote === -1 ? "active" : ""}`}
        onClick={() => handleVote(-1)}
        title="Downvote"
      >
        <ArrowBigDown size={24} fill={userVote === -1 ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
