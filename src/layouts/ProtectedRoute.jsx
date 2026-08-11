import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/contexts";
import { Loading } from "../components/ui/States";

/** Blocks unauthenticated access to owner/staff routes. */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, booting } = useAuth();
  const location = useLocation();

  if (booting) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Loading />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
