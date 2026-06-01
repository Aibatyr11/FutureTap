import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuth, loading } = useAuth();

  if (loading) return null; // можешь заменить на Loader
  if (!isAuth) return <Navigate to="/login" replace />;

  return children;
}
