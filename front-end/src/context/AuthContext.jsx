import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("inventory_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("inventory_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyUser() {
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          localStorage.setItem("inventory_user", JSON.stringify(profile));
        } catch {
          logout();
        }
      }
      setLoading(false);
    }

    verifyUser();

    const handleLogoutEvent = () => logout();
    window.addEventListener("auth_logout", handleLogoutEvent);
    return () => window.removeEventListener("auth_logout", handleLogoutEvent);
  }, [token]);

  const login = async (identifier, password) => {
    const res = await api.login({ email: identifier, password });
    localStorage.setItem("inventory_token", res.token);
    localStorage.setItem("inventory_user", JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem("inventory_token");
    localStorage.removeItem("inventory_user");
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === "admin";
  const isManager = user?.role === "manager";

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
