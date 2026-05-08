import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../api";
import "./Settings.css";

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme, accent, setAccent } = useTheme();
  
  // Profile state
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [bannerUrl, setBannerUrl] = useState(user?.banner_url || "");
  const [statusText, setStatusText] = useState(user?.status_text || "");
  const [statusEmoji, setStatusEmoji] = useState(user?.status_emoji || "");
  const [isPrivate, setIsPrivate] = useState(user?.is_private || false);
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const VIBRANT_ACCENTS = [
    { name: "Dreamy Pink", color: "#d4829c" },
    { name: "Ocean Blue", color: "#4ecdc4" },
    { name: "Royal Purple", color: "#a29bfe" },
    { name: "Sunlight Gold", color: "#fdcb6e" },
    { name: "Leaf Green", color: "#55efc4" },
    { name: "Sunset Orange", color: "#ff7675" },
  ];

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await api.put("/auth/profile", {
        bio,
        avatar_url: avatarUrl,
        banner_url: bannerUrl,
        status_text: statusText,
        status_emoji: statusEmoji,
        is_private: isPrivate
      });
      const updatedUser = { ...user, ...res.data };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setMessage("Profile updated successfully! ✨");
    } catch (err) {
      console.error("Save failed:", err);
      setMessage("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-page">
      <h1>Settings & Credits</h1>

      {/* --- Theme Customizer --- */}
      <section className="settings-section">
        <h2>Appearance</h2>
        <div className="theme-customizer">
          <div className="customizer-group">
            <label>Base Theme</label>
            <div className="theme-select-grid">
              <button 
                className={`theme-btn light ${theme === 'light' ? 'active' : ''}`}
                onClick={() => setTheme('light')}
              >Light</button>
              <button 
                className={`theme-btn dark ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => setTheme('dark')}
              >Dark</button>
              <button 
                className={`theme-btn amoled ${theme === 'amoled' ? 'active' : ''}`}
                onClick={() => setTheme('amoled')}
              >AMOLED</button>
            </div>
          </div>

          <div className="customizer-group">
            <label>Accent Color</label>
            <div className="accent-grid">
              {VIBRANT_ACCENTS.map((a) => (
                <button
                  key={a.color}
                  className={`accent-btn ${accent === a.color ? 'active' : ''}`}
                  style={{ backgroundColor: a.color }}
                  onClick={() => setAccent(a.color)}
                  title={a.name}
                />
              ))}
            </div>
          </div>

          <div className={`customizer-group ${theme === 'amoled' ? 'disabled' : ''}`}>
            <label>Preset Variations {theme === 'amoled' && '(Not available in AMOLED)'}</label>
            <select disabled={theme === 'amoled'}>
              <option>Default Theme</option>
              <option>Pastel Dream</option>
              <option>Ocean Mist</option>
              <option>Midnight Rose</option>
            </select>
          </div>
        </div>
      </section>
      
      {user && (
        <section className="settings-section">
          <h2>Customize Your Profile</h2>
          <form onSubmit={handleSave} className="settings-form">
            <div className="form-group">
              <label>Status</label>
              <div className="status-inputs">
                <input 
                  type="text" 
                  placeholder="✨" 
                  className="emoji-input"
                  value={statusEmoji}
                  onChange={(e) => setStatusEmoji(e.target.value)}
                  maxLength={2}
                />
                <input 
                  type="text" 
                  placeholder="What's happening?" 
                  value={statusText}
                  onChange={(e) => setStatusText(e.target.value)}
                  maxLength={50}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the world your story..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Avatar URL (Animated GIFs supported!)</label>
              <input 
                type="text" 
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label>Banner URL</label>
              <input 
                type="text" 
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="form-group checkbox">
              <label>
                <input 
                  type="checkbox" 
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                />
                Make profile private
              </label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {message && <p className="settings-msg">{message}</p>}
          </form>
        </section>
      )}

      <section className="settings-section">
        <h2>Credits</h2>
        <p>Developed with ❤️ as a DBMS Course Project.</p>
        <div className="credits-list">
          <div className="credit-item"><strong>Frontend:</strong> React 19, Vite, Outfit Font</div>
          <div className="credit-item"><strong>Backend:</strong> Node.js, Express, Supabase</div>
        </div>
      </section>

      <footer className="settings-footer">
        <p>&copy; 2026 Dreamy. All rights reserved.</p>
      </footer>
    </div>
  );
}
