import { Navigate } from 'react-router-dom';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const userId = localStorage.getItem('futures-wheel-hub-user-id');
  if (!userId) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}