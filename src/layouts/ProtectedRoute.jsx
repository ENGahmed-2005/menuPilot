import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/contexts";
import { Loading } from "../components/ui/States";

/** Blocks unauthenticated access to owner/staff routes and preserves the full return URL. */
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
    const returnTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from: returnTo }} />;
  }

  return children;
}
