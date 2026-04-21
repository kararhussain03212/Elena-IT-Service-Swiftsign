import { useEffect, useState } from "react";
import AuthContext from "./authContext";
import {
  changeMyPassword as changeMyPasswordRequest,
  getMe,
  loginUser,
  updateMe as updateMeRequest,
} from "../api/authApi";

const TOKEN_KEY = "token";
const AUTH_USER_KEY = "authUser";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(AUTH_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setToken(null);
    setUser(null);
  };

  const persistUser = (profile) => {
    setUser(profile);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
  };

  useEffect(() => {
    if (!token) return;

    let ignore = false;

    const hydrateUser = async () => {
      try {
        const response = await getMe();
        if (ignore) return;
        const profile = response.data || null;
        persistUser(profile);
      } catch {
        if (ignore) return;
        clearSession();
      }
    };

    hydrateUser();
    const intervalId = setInterval(hydrateUser, 15000);

    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, [token]);

  const login = async (email, password) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const response = await loginUser({ email: normalizedEmail, password });

    const nextToken = response?.data?.token;
    const sessionUser = response?.data?.user;

    if (!nextToken || !sessionUser) {
      throw new Error("Invalid login response from server.");
    }

    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    persistUser(sessionUser);
  };

  const updateProfile = async ({
    name,
    email,
    designation = "",
    phone = "",
    location = "",
    bio = "",
    avatarFile,
    removeAvatar = false,
  }) => {
    if (!user) {
      throw new Error("Not authenticated");
    }

    const nextName = (name || "").trim();
    const nextEmail = (email || "").trim().toLowerCase();

    if (!nextName) {
      throw new Error("Name is required");
    }

    if (!nextEmail) {
      throw new Error("Email is required");
    }

    const payload = new FormData();
    payload.append("name", nextName);
    payload.append("email", nextEmail);
    payload.append("designation", String(designation || "").trim());
    payload.append("phone", String(phone || "").trim());
    payload.append("location", String(location || "").trim());
    payload.append("bio", String(bio || "").trim());

    if (avatarFile) {
      payload.append("avatar", avatarFile);
    }

    if (removeAvatar && !avatarFile) {
      payload.append("avatar", "");
    }

    const response = await updateMeRequest(payload);
    const profile = response?.data?.user;

    if (!profile) {
      throw new Error("Invalid profile response from server.");
    }

    persistUser(profile);
    return response?.data;
  };

  const changePassword = async ({ currentPassword, nextPassword }) => {
    if (!user) {
      throw new Error("Not authenticated");
    }

    const current = (currentPassword || "").trim();
    const next = (nextPassword || "").trim();

    if (!current || !next) {
      throw new Error("Current and new password are required");
    }

    if (next.length < 8) {
      throw new Error("New password must be at least 8 characters");
    }
    if (current === next) {
      throw new Error("New password must be different from current password");
    }

    const response = await changeMyPasswordRequest({
      currentPassword: current,
      newPassword: next,
    });
    return response?.data;
  };

  const createUser = () => {
    throw new Error("Use User Management page to create accounts.");
  };

  const logout = () => {
    clearSession();
  };

  const publicUsers = user ? [user] : [];

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        users: publicUsers,
        login,
        logout,
        createUser,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
