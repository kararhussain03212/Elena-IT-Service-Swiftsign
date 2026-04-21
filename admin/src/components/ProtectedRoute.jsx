import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { normalizeUserRole } from "../modules/users/constants";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (adminOnly && normalizeUserRole(user?.role) !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
