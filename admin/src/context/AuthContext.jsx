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

const parseJsonSafely = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const findFirstStringValue = (input, keys, depth = 0) => {
  if (depth > 6 || !input || typeof input !== "object") return "";

  for (const key of keys) {
    const direct = String(input?.[key] || "").trim();
    if (direct) return direct;
  }

  for (const value of Object.values(input)) {
    if (!value || typeof value !== "object") continue;
    const nested = findFirstStringValue(value, keys, depth + 1);
    if (nested) return nested;
  }

  return "";
};

const findFirstObjectValue = (input, keys, depth = 0) => {
  if (depth > 6 || !input || typeof input !== "object") return null;

  for (const key of keys) {
    const direct = input?.[key];
    if (direct && typeof direct === "object" && !Array.isArray(direct)) {
      return direct;
    }
  }

  for (const value of Object.values(input)) {
    if (!value || typeof value !== "object") continue;
    const nested = findFirstObjectValue(value, keys, depth + 1);
    if (nested) return nested;
  }

  return null;
};

const extractAuthPayload = (response) => {
  const root = parseJsonSafely(response?.data);
  const nested = parseJsonSafely(root?.data);
  const payload = nested && typeof nested === "object" ? nested : root;
  const authHeader = String(
    response?.headers?.authorization ||
      response?.headers?.Authorization ||
      "",
  ).trim();
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { token: bearerToken, user: null };
  }

  const nextToken =
    bearerToken ||
    findFirstStringValue(payload, [
      "token",
      "accessToken",
      "access_token",
      "jwt",
      "jwtToken",
      "idToken",
    ]);

  const nextUser = findFirstObjectValue(payload, ["user", "authUser", "profile"]);
  return {
    token: nextToken || "",
    user: nextUser,
  };
};

const sanitizeSessionUser = (rawUser) => {
  if (!rawUser || typeof rawUser !== "object") return null;
  const role = String(rawUser?.role || "viewer").trim();
  const permissions = Array.isArray(rawUser?.permissions) ? rawUser.permissions : [];
  return {
    ...rawUser,
    role,
    permissions,
  };
};

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
        // Ignore failures here; the session stays active until the user
        // explicitly logs out or a real API request comes back unauthorized.
      }
    };

    hydrateUser();

    return () => {
      ignore = true;
    };
  }, [token]);

  const login = async (email, password) => {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const response = await loginUser({ email: normalizedEmail, password });
    const { token: nextToken, user: rawSessionUser } = extractAuthPayload(response);
    let sessionUser = sanitizeSessionUser(rawSessionUser);

    if (!nextToken) {
      throw new Error("Invalid login response from server.");
    }

    if (!sessionUser) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
      try {
        const profileResponse = await getMe();
        sessionUser = sanitizeSessionUser(profileResponse?.data || null);
      } catch {
        clearSession();
        throw new Error("Could not load user profile after login.");
      }
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
