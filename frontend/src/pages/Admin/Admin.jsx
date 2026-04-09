import { useState, useEffect } from 'react'
import axios from 'axios'
import Mentor from '../Mentor'
import Team from '../Team/Team'
import AdminProgressBoard from './AdminProgressBoard'
import AdminHelpRequests from './AdminHelpRequests'
import AdminTeams from './AdminTeams'
import AdminUsers from './AdminUsers'
import AdminRoles from './AdminRoles'

function Admin() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [teams, setTeams] = useState([])
  const [progress, setProgress] = useState([])
  const [helpRequests, setHelpRequests] = useState([])
  const [activeTab, setActiveTab] = useState('progress')
  const [viewAs, setViewAs] = useState('admin')
  const [error, setError] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [u, r, t, p, h] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/users`),
        axios.get(`${import.meta.env.VITE_API_URL}/roles`),
        axios.get(`${import.meta.env.VITE_API_URL}/teams`),
        axios.get(`${import.meta.env.VITE_API_URL}/progress`),
        axios.get(`${import.meta.env.VITE_API_URL}/help-requests`)
      ])
      setUsers(u.data); setRoles(r.data); setTeams(t.data); setProgress(p.data); setHelpRequests(h.data)
    } catch (err) { setError('Failed to load data') }
  }

    const tabStyle = (tab) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    border: 'none', // Add this
    borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
    background: 'none',
    fontWeight: activeTab === tab ? 'bold' : 'normal',
    color: activeTab === tab ? '#4f46e5' : '#666',
    outline: 'none'
    });
    const viewButtonStyle = (view) => ({
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none', // Add this to fix the View Switcher
    cursor: 'pointer',
    fontWeight: viewAs === view ? 'bold' : 'normal',
    background: viewAs === view ? '#4f46e5' : '#e5e7eb',
    color: viewAs === view ? 'white' : '#333',
    transition: 'all 0.2s'
    });

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['admin', 'mentor', 'team'].map(v => (
          <button 
      key={v} 
      onClick={() => setViewAs(v)} 
      style={viewButtonStyle(v)} 
    >
            {v.charAt(0).toUpperCase() + v.slice(1)} View
          </button>
        ))}
      </div>

      {viewAs === 'mentor' && <Mentor />}
      {viewAs === 'team' && <Team />}

      {viewAs === 'admin' && (
        <>
          <h1>Admin Dashboard</h1>
          {error && <p style={{ color: 'red' }}>{error}</p>}

          <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '24px', display: 'flex', gap: '8px' }}>
            <button style={tabStyle('progress')} onClick={() => setActiveTab('progress')}>Live Progress</button>
            <button style={tabStyle('requests')} onClick={() => setActiveTab('requests')}>Help Requests</button>
            <button style={tabStyle('teams')} onClick={() => setActiveTab('teams')}>Teams</button>
            <button style={tabStyle('users')} onClick={() => setActiveTab('users')}>Users</button>
            <button style={tabStyle('roles')} onClick={() => setActiveTab('roles')}>Roles</button>
          </div>

          {activeTab === 'progress' && <AdminProgressBoard teams={teams} progress={progress} />}
          {activeTab === 'requests' && <AdminHelpRequests helpRequests={helpRequests} teams={teams} />}
          {activeTab === 'teams' && <AdminTeams teams={teams} users={users} refreshData={fetchAll} />}
          {activeTab === 'users' && <AdminUsers users={users} roles={roles} teams={teams} refreshData={fetchAll} />}
          {activeTab === 'roles' && <AdminRoles roles={roles} refreshData={fetchAll} />}
        </>
      )}
    </div>
  )
}

export default Admin