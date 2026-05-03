import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // For now, just check if token exists
      // In production, you'd validate the token with the server
      setUser({ username: "testuser" }); // Mock user for demo
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post("/auth-login", { username, password });
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      console.error("Login failed:", err);
      throw err;
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await api.post("/auth-register", { username, email, password });
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      console.error("Registration failed:", err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}