import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, minLevel, maxLevel }) => {
  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const level = user.permission_level

  // Redirect to their correct page if they don't meet the requirement
  if (level < minLevel || (maxLevel && level > maxLevel)) {
    if (level >= 3) return <Navigate to="/admin" replace />
    if (level === 2) return <Navigate to="/mentor" replace />
    return <Navigate to="/team" replace />
  }

  return children;
};

export default ProtectedRoute;