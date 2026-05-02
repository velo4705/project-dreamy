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
    onVote(value);
  };

  return (
    <div className="vote-buttons">
      <button
        className={`vote-btn upvote ${userVote === 1 ? "active" : ""}`}
        onClick={() => handleVote(1)}
        title="Upvote"
      >
        &#9650;
      </button>
      <span className="vote-score">{score}</span>
      <button
        className={`vote-btn downvote ${userVote === -1 ? "active" : ""}`}
        onClick={() => handleVote(-1)}
        title="Downvote"
      >
        &#9660;
      </button>
    </div>
  );
}
