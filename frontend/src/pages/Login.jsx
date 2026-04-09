import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

useEffect(() => {
  const stored = localStorage.getItem('user')
  if (stored) {
    const user = JSON.parse(stored)
    if (user.role_id === 1) navigate('/admin')
    else if (user.role_id === 2) navigate('/mentor')
    else navigate('/team')
  }
}, [])

  const handleLogin = async () => {
  try {
    // 1. Fetch both users and roles so we can check permission levels
    const [usersRes, rolesRes] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/users`),
      axios.get(`${import.meta.env.VITE_API_URL}/roles`)
    ]);

    const user = usersRes.data.find(u => u.email === email);
    
    if (!user) {
      setError('Email not found');
      return;
    }

    // 2. Find the specific role object for this user
    const userRole = rolesRes.data.find(r => r.id === user.role_id);
    const permLevel = userRole ? userRole.permission_level : 1;

    // 3. Save user and their perm level to localStorage
    localStorage.setItem('user', JSON.stringify({ ...user, permission_level: permLevel }));

    // 4. Navigate based on Permission Level instead of ID
    if (permLevel >= 3) {
      navigate('/admin');
    } else if (permLevel === 2) {
      navigate('/mentor');
    } else {
      navigate('/team');
    }
  } catch (err) {
    setError('Something went wrong, please try again');
  }
};

const handleRegister = async () => {
  if (!fullName || !email) {
    setError('Please fill in all fields');
    return;
  }
  try {
    const rolesRes = await axios.get(`${import.meta.env.VITE_API_URL}/roles`);
    const participantRole = rolesRes.data.find(r => r.permission_level === 1);
    
    if (!participantRole) {
      setError('System Error: Participant role not configured.');
      return;
    }

    // 2. Register the user with the dynamic ID
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/register`, {
      full_name: fullName,
      email: email,
      role_id: participantRole.id, // Use the ID found from the level lookup
      team_id: null
    });

    // 3. Save to localStorage including the perm level for your new ProtectedRoutes
    localStorage.setItem('user', JSON.stringify({ 
      ...response.data, 
      permission_level: participantRole.permission_level 
    }));
    
    navigate('/team'); 
  } catch (err) {
    setError(err.response?.data?.detail || 'Something went wrong');
  }
};

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '8px', width: '350px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1 style={{ marginBottom: '24px', textAlign: 'center' }}>Hackathon Dashboard</h1>

        {isRegistering && (
          <>
            <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>Full Name</p>
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </>
        )}

        <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>Email</p>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
        />

        {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}

        <button
          onClick={isRegistering ? handleRegister : handleLogin}
          style={{ width: '100%', padding: '10px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {isRegistering ? 'Register' : 'Login'}
        </button>

        <p
          onClick={() => { setIsRegistering(!isRegistering); setError('') }}
          style={{ textAlign: 'center', marginTop: '16px', cursor: 'pointer', color: '#4f46e5' }}
        >
          {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
        </p>
      </div>
    </div>
  )
}

export default Login