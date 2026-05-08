import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "./Messages.css";

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.other_id);
    }
  }, [activeChat]);

  const fetchData = async () => {
    try {
      // Load both conversations AND friends list in parallel
      const [convRes, friendsRes] = await Promise.all([
        api.get("/messages/conversations"),
        api.get("/friends/list")
      ]);
      setConversations(convRes.data);

      // Merge friends into conversation list so new chats can be started
      const existingIds = new Set(convRes.data.map(c => c.other_id));
      const newFriends = friendsRes.data
        .filter(f => !existingIds.has(f.id))
        .map(f => ({
          other_id: f.id,
          other_username: f.username,
          other_avatar: f.avatar_url,
          last_message: null,
          is_new: true
        }));
      setFriends(newFriends);
    } catch (err) {
      console.error("Fetch data failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (otherId) => {
    try {
      const res = await api.get(`/messages/${otherId}`);
      setMessages(res.data);
    } catch (err) {
      console.error("Fetch messages failed:", err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    try {
      const res = await api.post("/messages", {
        receiver_id: activeChat.other_id,
        body: newMessage
      });
      setMessages([...messages, { ...res.data, sender_name: user.username }]);
      setNewMessage("");
      // Move this friend to conversations if they were new
      if (activeChat.is_new) fetchData();
    } catch (err) {
      console.error("Send message failed:", err);
    }
  };

  const allChats = [...conversations, ...friends];

  if (!user) return <div className="error-page">Please login to chat.</div>;

  return (
    <div className="messages-container container">
      <div className="messages-layout glass-panel">
        {/* Sidebar */}
        <div className="conversations-sidebar">
          <h3>Messages</h3>
          <div className="conversations-list">
            {loading ? (
              <p className="empty-msg">Loading...</p>
            ) : allChats.length === 0 ? (
              <p className="empty-msg">Add friends to start chatting! 🌸</p>
            ) : (
              allChats.map((conv) => (
                <div
                  key={conv.other_id}
                  className={`conv-item ${activeChat?.other_id === conv.other_id ? "active" : ""}`}
                  onClick={() => setActiveChat(conv)}
                >
                  <img
                    src={conv.other_avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${conv.other_username}`}
                    alt=""
                  />
                  <div className="conv-info">
                    <span className="conv-name">{conv.other_username}</span>
                    <span className="conv-preview">
                      {conv.is_new ? "Start a conversation" : (conv.last_message || "No messages yet")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {activeChat ? (
            <>
              <div className="chat-header">
                <img
                  src={activeChat.other_avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${activeChat.other_username}`}
                  alt=""
                />
                <h4>{activeChat.other_username}</h4>
              </div>
              <div className="chat-history">
                {messages.length === 0 && (
                  <p className="empty-msg">No messages yet. Say hello! 👋</p>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={`message-bubble ${m.sender_id === user.id ? "sent" : "received"}`}>
                    <p>{m.body}</p>
                    <span className="msg-time">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
              <form className="chat-input" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="Type a dreamy message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Send</button>
              </form>
            </>
          ) : (
            <div className="chat-placeholder">
              <span>✉️</span>
              <p>Select a friend to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
