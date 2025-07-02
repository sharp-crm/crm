import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const accessToken = useAuthStore((s) => s.accessToken);

  if (!accessToken) return <Navigate to="/login" />;
  return children;
};

export default ProtectedRoute;
