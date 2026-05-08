import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import { supabase } from "../supabase";
import { Image, Video, X, Plus } from "lucide-react";
import "./CreatePost.css";

export default function CreatePost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  
  // Changed to an array to support multiple media items
  const [mediaItems, setMediaItems] = useState([]);
  const fileInputRef = useRef();

  if (!user) {
    navigate("/login");
    return null;
  }

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (!supabase) {
      alert("Media upload is currently disabled (Server configuration missing).");
      return;
    }

    setUploading(true);
    try {
      const newItems = [];
      for (const file of files) {
        const isVideo = file.type.startsWith("video/");
        const limit = isVideo ? 15 : 5; // MB

        if (file.size > limit * 1024 * 1024) {
          alert(`File ${file.name} too large! Limit is ${limit}MB.`);
          continue;
        }

        const fileName = `${Date.now()}_${file.name}`;
        const { data, error: uploadError } = await supabase.storage
          .from("media")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("media")
          .getPublicUrl(data.path);

        newItems.push({
          url: publicUrl,
          type: isVideo ? "video" : "image"
        });
      }
      setMediaItems(prev => [...prev, ...newItems]);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("One or more uploads failed.");
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (index) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
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
        media: mediaItems, // Send the whole array
        // Fallback for old single-media logic
        media_url: mediaItems[0]?.url || "",
        media_type: mediaItems[0]?.type || ""
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
          <div className="media-grid">
            {mediaItems.map((item, index) => (
              <div key={index} className="media-preview-item">
                <button type="button" className="remove-media" onClick={() => removeMedia(index)}>
                  <X size={14} />
                </button>
                {item.type === "video" ? (
                  <video src={item.url} muted />
                ) : (
                  <img src={item.url} alt="" />
                )}
              </div>
            ))}
            
            <button 
              type="button" 
              className="add-media-btn" 
              onClick={() => fileInputRef.current.click()}
              disabled={uploading}
            >
              {uploading ? (
                <div className="spinner-small"></div>
              ) : (
                <Plus size={24} />
              )}
              <span>{mediaItems.length > 0 ? "Add More" : "Add Media"}</span>
            </button>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: "none" }} 
            accept="image/*,video/*"
            multiple // Allow selecting multiple at once!
          />
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
