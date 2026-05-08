import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/PostCard";
import "./UserProfile.css";

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [friendStatus, setFriendStatus] = useState("none"); // none, pending, accepted
  const [mutualCount, setMutualCount] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const userRes = await api.get(`/users/${username}`);
        setProfile(userRes.data);

        // Fetch Friendship Status if logged in
        if (currentUser && currentUser.username !== username) {
          const statusRes = await api.get(`/friends/status/${userRes.data.id}`);
          setFriendStatus(statusRes.data.status || "none");
          
          const mutualRes = await api.get(`/friends/mutual/${userRes.data.id}`);
          setMutualCount(mutualRes.data.count);
        }

        if (!userRes.data.is_private || currentUser?.username === username) {
          const postsRes = await api.get(`/posts?limit=100`);
          const allPosts = Array.isArray(postsRes.data.posts) ? postsRes.data.posts : [];
          setPosts(allPosts.filter((p) => p.author === username));
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("User not found.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username, currentUser]);

  const handleFriendAction = async () => {
    try {
      if (friendStatus === "none") {
        await api.post(`/friends/request/${profile.id}`);
        setFriendStatus("pending");
      } else {
        await api.delete(`/friends/remove/${profile.id}`);
        setFriendStatus("none");
      }
    } catch (err) {
      console.error("Friend action failed:", err);
    }
  };

  const handleVote = async (postId, value) => {
    try {
      const res = await api.post(`/posts/${postId}/vote`, { value });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, score: res.data.score, user_vote: res.data.user_vote }
            : p
        )
      );
    } catch (err) {
      console.error("Vote failed:", err);
    }
  };

  if (loading) return <div className="loading">Floating to the profile... ☁️</div>;
  if (error) return <div className="error-page">{error}</div>;

  const isOwner = currentUser?.username === username;
  const isOnline = new Date() - new Date(profile.last_seen) < 1000 * 60 * 5; // Online if active in last 5 mins

  return (
    <div className="user-profile-container">
      {/* 1. Banner Section */}
      <div 
        className="profile-banner" 
        style={{ backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : 'linear-gradient(135deg, var(--accent-light), var(--lavender-soft))' }}
      >
        {isOwner && (
          <Link to="/settings" className="edit-profile-btn glass-pill">
            <Settings size={16} />
            <span>Edit Profile</span>
          </Link>
        )}
      </div>

      <div className="profile-content container">
        {/* 2. Identity Section */}
        <div className="profile-identity">
          <div className="avatar-wrapper">
            <img 
              src={profile.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`} 
              alt={username} 
              className="profile-avatar"
            />
            <div className={`presence-indicator ${isOnline ? 'online' : 'offline'}`} title={isOnline ? 'Online' : 'Offline'}></div>
          </div>

          <div className="profile-names">
            <div className="username-row">
              <h1>{profile.username}</h1>
              {profile.status_emoji && <span className="status-emoji">{profile.status_emoji}</span>}
            </div>
            {profile.status_text && <p className="status-text">{profile.status_text}</p>}
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{profile.karma || 0}</span>
              <span className="stat-label">Karma</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{posts.length}</span>
              <span className="stat-label">Posts</span>
            </div>
            {!isOwner && mutualCount > 0 && (
              <div className="stat-item">
                <span className="stat-value">{mutualCount}</span>
                <span className="stat-label">Mutuals</span>
              </div>
            )}
          </div>

          {!isOwner && currentUser && (
            <div className="profile-actions">
              <button 
                className={`btn ${friendStatus === 'accepted' ? 'btn-secondary' : 'btn-primary'} friend-btn`}
                onClick={handleFriendAction}
              >
                {friendStatus === 'none' && "➕ Add Friend"}
                {friendStatus === 'pending' && "⏳ Pending"}
                {friendStatus === 'accepted' && "🤝 Friends"}
              </button>

              <button 
                className="btn btn-secondary message-user-btn"
                onClick={() => navigate('/messages')}
              >
                ✉️ Message
              </button>
            </div>
          )}
        </div>

        {/* 3. Bio Section */}
        <div className="profile-bio-card glass-panel">
          <h3>About</h3>
          <p>{profile.bio || "This user is still a mystery... ✨"}</p>
          <div className="profile-date">
            Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* 4. Posts Section */}
        <div className="profile-feed">
          <h2>{isOwner ? "Your Activity" : `${username}'s Activity`}</h2>
          {profile.is_private && !isOwner ? (
            <div className="private-notice glass-panel">
              <span>🔒</span>
              <p>This profile is private.</p>
            </div>
          ) : posts.length === 0 ? (
            <p className="empty">No posts to show yet. ☁️</p>
          ) : (
            <div className="post-list">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onVote={(value) => handleVote(post.id, value)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}