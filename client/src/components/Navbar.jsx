import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Search, Plus, Mail, Settings } from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          Dreamy
        </Link>

        <form className="navbar-search-pill" onSubmit={handleSearch}>
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search dreamy posts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <div className="navbar-links">
          {user ? (
            <>
              <Link to="/create" className="btn btn-primary create-btn">
                <Plus size={18} /> <span>New Post</span>
              </Link>
              <Link to={`/user/${user.username}`} className="navbar-user">
                <img 
                  src={user.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`} 
                  alt="" 
                  className="navbar-avatar" 
                />
                <span className="navbar-username">{user.username}</span>
              </Link>
              <button onClick={logout} className="btn btn-secondary logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}
          <Link to="/messages" className="navbar-icon" title="Messages">
            <Mail size={22} />
          </Link>
          <Link to="/settings" className="navbar-settings" title="Settings & Credits">
            <Settings size={22} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
