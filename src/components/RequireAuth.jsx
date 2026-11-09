import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import StatusMessage from "./StatusMessage.jsx";

// Wrap a page so only logged-in users can see it. Add the "admin" prop to allow only the admin.
export default function RequireAuth({ children, admin = false }) {
  const { user, isAdmin } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && !isAdmin) {
    return (
      <section className="container section narrow">
        <StatusMessage type="error" title="Admin only.">You do not have permission to view this page.</StatusMessage>
      </section>
    );
  }
  return children;
}
