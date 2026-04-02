import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, minLevel }) => {
  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;

  // If no user is found in localStorage, send them back to Login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If the user's permission level is lower than the page requirement, 
  // redirect them to the basic team page
  if (user.permission_level < minLevel) {
    return <Navigate to="/team" replace />;
  }

  return children;
};

export default ProtectedRoute;