import { Navigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";

const AuthRedirect = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  // If still loading, don't render anything (handled by App.js)
  if (isLoading) {
    return null;
  }

  // Redirect to dashboard if authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Render children if not authenticated
  return children;
};

export default AuthRedirect;
