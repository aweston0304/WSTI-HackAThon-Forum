import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  // Only show the Navbar if a user is actually logged in
  if (!user) return null;

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      padding: '10px 40px', 
      background: '#fff', 
      borderBottom: '1px solid #e5e7eb',
      alignItems: 'center' 
    }}>
      <div style={{ fontWeight: 'bold', color: '#4f46e5' }}>Hackathon Dashboard</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span>{user.full_name}</span>
        <button 
          onClick={handleLogout}
          style={{ 
            padding: '6px 12px', 
            background: '#ef4444', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;