import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const stored = localStorage.getItem('user');
  const user = stored ? JSON.parse(stored) : null;
  console.log('user object:', user);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleGoHome = () => {
    if (!user) {
      navigate('/');
      return;
    }

    const role = user.role_name?.toLowerCase();
    
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'mentor') {
      navigate('/mentor');
    } else {
      navigate('/team');
    }
  };

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
      
      {/*  An actual <button> tag, but with its native styling stripped away 
        so it looks exactly like your text. 
      */}
      <button 
        onClick={handleGoHome}
        title="Go to Dashboard"
        style={{ 
          background: 'transparent',
          border: 'none',
          padding: 0,
          margin: 0,
          fontFamily: 'inherit',
          fontSize: '16px', 
          fontWeight: 'bold', 
          color: '#4f46e5',
          cursor: 'pointer',
          outline: 'none',
          userSelect: 'none'
        }}
      >
        Hackathon Dashboard
      </button>
      
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