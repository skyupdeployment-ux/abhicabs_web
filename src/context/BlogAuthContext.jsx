// src/context/BlogAuthContext.jsx
//
// Blog Builder auth — uses SEPARATE blog_users table, NOT the admin system.
//
// Endpoints:
//   POST /api/v1/blog/auth/login  { email, password }
//   GET  /api/v1/blog/auth/me     Authorization: Bearer <token>
//
// On first login, if no blog users exist, the backend auto-seeds:
//   Email:    blog@abhicabs.in  (or BLOG_ADMIN_EMAIL env var)
//   Password: AbhiBlog@2025    (or BLOG_ADMIN_PASSWORD env var)

import { createContext, useContext, useState, useEffect } from "react";

import { API_ROOT } from "../lib/apiBase";

const API_BASE = API_ROOT;

const TOKEN_KEY = "abhicabsBlogAuth";

// ── SSR-safe localStorage helpers ─────────────────────────────────────────
const getStoredSession = () => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const setStoredSession = (s) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, JSON.stringify(s));
};
const clearStoredSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
};

// ── Context ───────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getStoredSession();
    if (!session?.user || !session?.token) { setLoading(false); return; }

    setUser(session.user);
    setToken(session.token);

    // Dev tokens (from dev mode login) skip backend validation
    if (session.token.startsWith("dev-token-")) {
      setLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/v1/blog/auth/me`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then((res) => res.status === 401 ? Promise.reject(new Error("invalid")) : res.json())
      .then((data) => {
        const u = data?.user;
        if (u) { setUser(u); setStoredSession({ user: u, token: session.token }); }
      })
      .catch((e) => {
        if (e.message === "invalid") { clearStoredSession(); setUser(null); setToken(null); }
      })
      .finally(() => setLoading(false));
  }, []);

  const DEV_MODE = import.meta.env.DEV || String(import.meta.env.VITE_USE_MOCK).toLowerCase() === "true";
  const DEV_EMAIL = "admin@abhicabs.in";
  const DEV_PASS = "admin123";

  const login = async (email, password) => {
    // Try real backend first
    try {
      const res = await fetch(`${API_BASE}/api/v1/blog/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        const u = json.user;
        const accessToken = json.token;
        if (u && accessToken) {
          setStoredSession({ user: u, token: accessToken });
          setUser(u);
          setToken(accessToken);
          return { success: true, user: u };
        }
      }

      // If backend responded but rejected, and NOT dev mode, show the error
      if (!DEV_MODE) {
        return { success: false, message: json.message || "Invalid email or password." };
      }
    } catch {
      // Backend unreachable — fall through to dev login if in dev mode
      if (!DEV_MODE) {
        return { success: false, message: "Could not reach the server. Please try again." };
      }
    }

    // ── Dev mode fallback login (no backend needed) ──
    if (DEV_MODE && email.trim() === DEV_EMAIL && password === DEV_PASS) {
      const devUser = { id: "dev-admin", email: DEV_EMAIL, name: "Dev Admin", role: "admin" };
      const devToken = "dev-token-" + Date.now();
      setStoredSession({ user: devUser, token: devToken });
      setUser(devUser);
      setToken(devToken);
      console.info("[CMS] Dev mode login — no backend required. Use admin@abhicabs.in / admin123");
      return { success: true, user: devUser };
    }

    return {
      success: false,
      message: DEV_MODE
        ? `Backend unreachable. For dev mode use: ${DEV_EMAIL} / ${DEV_PASS}`
        : "Invalid email or password.",
    };
  };

  const logout = () => {
    clearStoredSession();
    setToken(null);
    setUser(null);
  };

  const role = user?.role || "";

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated:    !!token && !!user,
    isAdmin:            role === "admin",
    isEditor:           role === "editor" || role === "admin",
    isViewer:           role === "viewer",
    canEdit:            role === "editor" || role === "admin",
    canPublish:         role === "editor" || role === "admin",
    canManageUsers:     role === "admin",
    canManageRedirects: role === "admin",
    canView:            !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
