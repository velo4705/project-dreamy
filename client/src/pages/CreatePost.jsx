import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { supabase } from "../supabase";
import { Image, Video, X } from "lucide-react";
import "./CreatePost.css";

export default function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("");
  const fileInputRef = useRef();

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const limit = isVideo ? 15 : 5; // MB

    if (file.size > limit * 1024 * 1024) {
      alert(`File too large! Limit is ${limit}MB.`);
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("media")
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(data.path);

      setMediaUrl(publicUrl);
      setMediaType(isVideo ? "video" : "image");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Media upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    let finalParentId = parentId.trim();
    if (finalParentId.includes("/post/")) {
      const parts = finalParentId.split("/post/");
      finalParentId = parts[parts.length - 1].split(/[?#]/)[0];
    }

    try {
      const res = await api.post("/posts", { 
        title, 
        body, 
        parent_post_id: finalParentId ? parseInt(finalParentId) : null,
        media_url: mediaUrl,
        media_type: mediaType
      });
      navigate(`/post/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create post");
    }
  };

  return (
    <div className="create-post container">
      <h1>Create a Post</h1>
      <form onSubmit={handleSubmit} className="create-post-form glass-panel">
        {error && <div className="auth-error">{error}</div>}
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        
        <div className="media-upload-section">
          {mediaUrl ? (
            <div className="media-preview">
              <button className="remove-media" onClick={() => { setMediaUrl(""); setMediaType(""); }}>
                <X size={18} />
              </button>
              {mediaType === "video" ? (
                <video src={mediaUrl} controls />
              ) : (
                <img src={mediaUrl} alt="Preview" />
              )}
            </div>
          ) : (
            <div className="media-buttons">
              <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current.click()} disabled={uploading}>
                {uploading ? "Uploading..." : <><Image size={20} /> Add Image/GIF</>}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current.click()} disabled={uploading}>
                <Video size={20} /> Add Video
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: "none" }} 
                accept="image/*,video/*"
              />
            </div>
          )}
        </div>

        <textarea
          placeholder="Body (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
        />
        <input
          type="text"
          placeholder="Replying to another post? (ID or Link)"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={uploading}>
          Post
        </button>
      </form>
    </div>
  );
}
