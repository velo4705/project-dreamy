import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import "./Friends.css";

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        api.get("/friends/list"),
        api.get("/friends/requests")
      ]);
      setFriends(friendsRes.data);
      setRequests(requestsRes.data);
    } catch (err) {
      console.error("Failed to fetch friends data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requesterId) => {
    try {
      await api.put(`/friends/accept/${requesterId}`);
      fetchData(); // Refresh list
    } catch (err) {
      console.error("Failed to accept request:", err);
    }
  };

  const handleRemove = async (otherUserId) => {
    if (!window.confirm("Are you sure you want to remove this friend?")) return;
    try {
      await api.delete(`/friends/remove/${otherUserId}`);
      fetchData(); // Refresh list
    } catch (err) {
      console.error("Failed to remove friend:", err);
    }
  };

  if (loading) return <div className="loading">Gathering your friends... 🌸</div>;

  return (
    <div className="friends-page container">
      <header className="friends-header">
        <h1>Friendship Ecosystem</h1>
        <p>Connect and share your dreams with others.</p>
      </header>

      <div className="friends-grid">
        {/* Friend Requests Section */}
        <section className="friends-section requests-section">
          <h2>Pending Requests {requests.length > 0 && <span className="badge">{requests.length}</span>}</h2>
          {requests.length === 0 ? (
            <p className="empty-msg">No pending requests. Why not reach out? ✨</p>
          ) : (
            <div className="request-list">
              {requests.map((req) => (
                <div key={req.id} className="request-card glass-panel">
                  <div className="user-info">
                    <img 
                      src={req.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${req.username}`} 
                      alt="" 
                      className="avatar-sm"
                    />
                    <Link to={`/user/${req.username}`} className="username">{req.username}</Link>
                  </div>
                  <div className="actions">
                    <button onClick={() => handleAccept(req.requester_id)} className="btn btn-primary btn-sm">Accept</button>
                    <button onClick={() => handleRemove(req.requester_id)} className="btn btn-secondary btn-sm">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Friends List Section */}
        <section className="friends-section list-section">
          <h2>Your Friends {friends.length > 0 && <span className="badge">{friends.length}</span>}</h2>
          {friends.length === 0 ? (
            <p className="empty-msg">You haven't added any friends yet. ☁️</p>
          ) : (
            <div className="friends-list-grid">
              {friends.map((friend) => (
                <div key={friend.id} className="friend-card glass-panel">
                  <div className="friend-card-top">
                    <div className="avatar-wrapper">
                      <img 
                        src={friend.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${friend.username}`} 
                        alt="" 
                        className="avatar-md"
                      />
                      {new Date() - new Date(friend.last_seen) < 1000 * 60 * 5 && (
                        <div className="online-dot" title="Online"></div>
                      )}
                    </div>
                    <div className="friend-info">
                      <Link to={`/user/${friend.username}`} className="username">
                        {friend.username} {friend.status_emoji}
                      </Link>
                      {friend.status_text && <p className="status-text">{friend.status_text}</p>}
                    </div>
                  </div>
                  <div className="friend-card-actions">
                    <Link to={`/messages`} className="btn btn-primary btn-sm">Message</Link>
                    <button onClick={() => handleRemove(friend.id)} className="btn btn-secondary btn-sm">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
