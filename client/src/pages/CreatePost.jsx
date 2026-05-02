import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "./CreatePost.css";

export default function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await api.post("/posts", { title, body });
      navigate(`/post/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create post");
    }
  };

  return (
    <div className="create-post">
      <h2>Create a Post</h2>
      <form onSubmit={handleSubmit}>
        {error && <div className="auth-error">{error}</div>}
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={300}
          required
        />
        <textarea
          placeholder="Body (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
        />
        <button type="submit" className="btn btn-primary">
          Post
        </button>
      </form>
    </div>
  );
}
