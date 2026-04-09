import { useState, useEffect } from 'react'
import axios from 'axios'
import Mentor from './Mentor/Mentor'
import Team from './Team/Team'

function Admin() {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [teams, setTeams] = useState([])
  const [progress, setProgress] = useState([])
  const [helpRequests, setHelpRequests] = useState([])
  
  // Set progress as the default tab!
  const [activeTab, setActiveTab] = useState('progress')
  
  const [newRole, setNewRole] = useState({ role_name: '', permission_level: 1 })
  const [editingRole, setEditingRole] = useState(null)
  const [editingTeam, setEditingTeam] = useState(null)
  const [expandedRequest, setExpandedRequest] = useState(null)
  const [replies, setReplies] = useState({})
  const [newReply, setNewReply] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [viewAs, setViewAs] = useState('admin')
  
  // NEW: State to track which team's history is expanded
  const [expandedTeamProgress, setExpandedTeamProgress] = useState(null)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    try {
      const [usersRes, rolesRes, teamsRes, progressRes, helpRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/users`),
        axios.get(`${import.meta.env.VITE_API_URL}/roles`),
        axios.get(`${import.meta.env.VITE_API_URL}/teams`),
        axios.get(`${import.meta.env.VITE_API_URL}/progress`),
        axios.get(`${import.meta.env.VITE_API_URL}/help-requests`)
      ])
      setUsers(usersRes.data)
      setRoles(rolesRes.data)
      setTeams(teamsRes.data)
      setProgress(progressRes.data)
      setHelpRequests(helpRes.data)
    } catch (err) {
      setError('Failed to load data')
    }
  }

  const updateUserRole = async (userId, roleId) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/users/${userId}/assign-role`, { role_id: parseInt(roleId) })
      setSuccess('Role updated!')
      setTimeout(() => setSuccess(''), 2000)
      fetchAll()
    } catch (err) {
      setError('Failed to update role')
    }
  }

  const updateUserTeam = async (userId, teamId) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/users/${userId}`, {
        team_id: teamId === 'null' ? null : parseInt(teamId)
      })
      setSuccess('Team updated!')
      setTimeout(() => setSuccess(''), 2000)
      fetchAll()
    } catch (err) {
      setError('Failed to update team')
    }
  }

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/users/${userId}`)
      setSuccess('User deleted!')
      setTimeout(() => setSuccess(''), 2000)
      fetchAll()
    } catch (err) {
      setError('Failed to delete user')
    }
  }

  const createRole = async () => {
    if (!newRole.role_name) {
      setError('Please enter a role name')
      return
    }
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/roles`, newRole)
      setNewRole({ role_name: '', permission_level: 1 })
      setSuccess('Role created!')
      setTimeout(() => setSuccess(''), 2000)
      fetchAll()
    } catch (err) {
      setError('Failed to create role')
    }
  }

  const updateRole = async (roleId) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/roles/${roleId}`, {
        role_name: editingRole.role_name,
        permission_level: editingRole.permission_level
      })
      setEditingRole(null)
      setSuccess('Role updated!')
      setTimeout(() => setSuccess(''), 2000)
      fetchAll()
    } catch (err) {
      setError('Failed to update role')
    }
  }

  const deleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/roles/${roleId}`)
      setSuccess('Role deleted!')
      setTimeout(() => setSuccess(''), 2000)
      fetchAll()
    } catch (err) {
      setError('Failed to delete role')
    }
  }

  const updateTeam = async (teamId) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/teams/${teamId}`, {
        team_name: editingTeam.team_name,
        project_name: editingTeam.project_name
      })
      setEditingTeam(null)
      setSuccess('Team updated!')
      setTimeout(() => setSuccess(''), 2000)
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update team')
    }
  }

  const deleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/teams/${teamId}`)
      setSuccess('Team deleted!')
      setTimeout(() => setSuccess(''), 2000)
      fetchAll()
    } catch (err) {
      setError('Failed to delete team')
    }
  }

  const fetchReplies = async (requestId) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/help-requests/${requestId}/replies`)
      setReplies(prev => ({ ...prev, [requestId]: res.data }))
    } catch (err) {
      console.error('Failed to fetch replies')
    }
  }

  const submitReply = async (requestId) => {
    if (!newReply) return
    try {
      const stored = localStorage.getItem('user')
      if (!stored) {
        setError('User session not found. Please log in again.')
        return
      }
      
      const user = JSON.parse(stored)
      if (!user || !user.id) {
        setError('Invalid user data. Please log in again.')
        return
      }

      await axios.post(`${import.meta.env.VITE_API_URL}/help-requests/${requestId}/replies`, {
        help_request_id: requestId,
        user_id: user.id,
        message: newReply
      })
      setNewReply('')
      fetchReplies(requestId)
    } catch (err) {
      console.error('Failed to submit reply')
    }
  }

  const toggleRequest = (requestId) => {
    if (expandedRequest === requestId) {
      setExpandedRequest(null)
    } else {
      setExpandedRequest(requestId)
      fetchReplies(requestId)
    }
  }

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId)
    return team ? team.team_name : 'Unknown team'
  }

  const tabStyle = (tab) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
    background: 'none',
    fontWeight: activeTab === tab ? 'bold' : 'normal',
    color: activeTab === tab ? '#4f46e5' : '#666'
  })

  const viewButtonStyle = (view) => ({
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: viewAs === view ? 'bold' : 'normal',
    background: viewAs === view ? '#4f46e5' : '#e5e7eb',
    color: viewAs === view ? 'white' : '#333'
  })

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>

      {/* View As Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button onClick={() => setViewAs('admin')} style={viewButtonStyle('admin')}>Admin View</button>
        <button onClick={() => setViewAs('mentor')} style={viewButtonStyle('mentor')}>Mentor View</button>
        <button onClick={() => setViewAs('team')} style={viewButtonStyle('team')}>Team View</button>
      </div>

      {viewAs === 'mentor' && <Mentor />}
      {viewAs === 'team' && <Team />}

      {viewAs === 'admin' && (
        <>
          <h1 style={{ marginBottom: '8px' }}>Admin Dashboard</h1>
          <p style={{ color: '#666', marginBottom: '24px' }}>Manage users, roles, teams and requests</p>

          {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}
          {success && <p style={{ color: 'green', marginBottom: '12px' }}>{success}</p>}

          {/* Tabs */}
          <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '24px', display: 'flex', gap: '8px' }}>
            <button style={tabStyle('progress')} onClick={() => setActiveTab('progress')}>Live Progress</button>
            <button style={tabStyle('requests')} onClick={() => setActiveTab('requests')}>Help Requests ({helpRequests.length})</button>
            <button style={tabStyle('teams')} onClick={() => setActiveTab('teams')}>Teams ({teams.length})</button>
            <button style={tabStyle('users')} onClick={() => setActiveTab('users')}>Users ({users.length})</button>
            <button style={tabStyle('roles')} onClick={() => setActiveTab('roles')}>Roles ({roles.length})</button>
          </div>

          {/* Progress Board Tab */}
          {activeTab === 'progress' && (
            <div>
              <h2 style={{ marginBottom: '16px' }}>Live Progress Board</h2>
              
              {teams.length === 0 ? (
                <p style={{ color: '#666' }}>No teams available.</p>
              ) : (
                teams.map(t => {
                  // 1. Group progress by this specific team
                  const teamProgress = progress.filter(p => p.team_id === t.id);

                  // If a team has no progress yet, hide them
                  if (teamProgress.length === 0) return null;

                  // 2. Sort the progress updates newest to oldest
                  const sortedProgress = [...teamProgress].sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                  );

                  // 3. Separate the most recent update from the older history
                  const latest = sortedProgress[0];
                  const olderUpdates = sortedProgress.slice(1);
                  const hasOlderUpdates = olderUpdates.length > 0;

                  return (
                    <div key={t.id} style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                      
                      {/* Team Header */}
                      <div style={{ marginBottom: '12px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>{t.team_name}</h3>
                        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>{t.project_name}</p>
                      </div>

                      {/* Latest Update (Always Visible) */}
                      <div
                        onClick={() => hasOlderUpdates && setExpandedTeamProgress(expandedTeamProgress === t.id ? null : t.id)}
                        style={{
                          padding: '12px',
                          background: '#f9fafb',
                          borderRadius: '6px',
                          border: '1px solid #e5e7eb',
                          cursor: hasOlderUpdates ? 'pointer' : 'default',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontWeight: 'bold', fontSize: '14px', padding: '4px 8px', background: '#e0e7ff', color: '#3730a3', borderRadius: '4px' }}>
                              {latest.status_label}
                            </span>
                            <p style={{ color: '#333', fontSize: '15px', marginTop: '8px', marginBottom: 0 }}>{latest.comment}</p>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <span style={{ fontSize: '12px', color: '#666' }}>
                              {new Date(latest.created_at).toLocaleString()}
                            </span>
                            {hasOlderUpdates && (
                              <span style={{ color: '#4f46e5', fontSize: '13px', fontWeight: 'bold' }}>
                                {expandedTeamProgress === t.id ? '▲ Hide History' : `▼ See History (${olderUpdates.length})`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Older Updates (Collapsible) */}
                      {expandedTeamProgress === t.id && hasOlderUpdates && (
                        <div style={{ marginTop: '12px', paddingLeft: '16px', borderLeft: '3px solid #4f46e5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {olderUpdates.map(p => (
                            <div key={p.id} style={{ padding: '12px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#4b5563' }}>{p.status_label}</span>
                                <span style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(p.created_at).toLocaleString()}</span>
                              </div>
                              <p style={{ color: '#4b5563', fontSize: '14px', margin: 0 }}>{p.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div>
              <h2 style={{ marginBottom: '16px' }}>All Users</h2>
              {users.length === 0 ? (
                <p style={{ color: '#666' }}>No users yet</p>
              ) : (
                [...users].sort((a, b) => {
                  const aLevel = roles.find(r => r.id === a.role_id)?.permission_level ?? 0
                  const bLevel = roles.find(r => r.id === b.role_id)?.permission_level ?? 0
                  return bLevel - aLevel
                }).map(u => (
                  <div key={u.id} style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <p style={{ fontWeight: 'bold' }}>{u.full_name}</p>
                      <p style={{ color: '#666', fontSize: '14px' }}>{u.email}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        value={u.role_id || ''}
                        onChange={e => updateUserRole(u.id, e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                      >
                        <option value="">No role</option>
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.role_name}</option>
                        ))}
                      </select>
                      <select
                        value={u.team_id || 'null'}
                        onChange={e => updateUserTeam(u.id, e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                      >
                        <option value="null">No team</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.team_name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => deleteUser(u.id)}
                        style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Roles Tab */}
          {activeTab === 'roles' && (
            <div>
              <h2 style={{ marginBottom: '16px' }}>Roles</h2>
              {roles.map(r => (
                <div key={r.id} style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                  {editingRole && editingRole.id === r.id ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        value={editingRole.role_name}
                        onChange={e => setEditingRole({ ...editingRole, role_name: e.target.value })}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
                      />
                      <input
                        type="number"
                        value={editingRole.permission_level}
                        onChange={e => setEditingRole({ ...editingRole, permission_level: parseInt(e.target.value) })}
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', width: '80px' }}
                      />
                      <button
                        onClick={() => updateRole(r.id)}
                        style={{ padding: '6px 12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingRole(null)}
                        style={{ padding: '6px 12px', background: '#e5e7eb', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: 'bold' }}>{r.role_name}</p>
                        <p style={{ color: '#666', fontSize: '14px' }}>Permission level: {r.permission_level}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setEditingRole({ id: r.id, role_name: r.role_name, permission_level: r.permission_level })}
                          style={{ padding: '6px 12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteRole(r.id)}
                          style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div style={{ background: 'white', padding: '24px', borderRadius: '8px', marginTop: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ marginBottom: '16px' }}>Create New Role</h3>
                <input
                  type="text"
                  placeholder="Role name"
                  value={newRole.role_name}
                  onChange={e => setNewRole({ ...newRole, role_name: e.target.value })}
                  style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input
                  type="number"
                  placeholder="Permission level"
                  value={newRole.permission_level}
                  onChange={e => setNewRole({ ...newRole, permission_level: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button
                  onClick={createRole}
                  style={{ padding: '10px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Create Role
                </button>
              </div>
            </div>
          )}

          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <div>
              <h2 style={{ marginBottom: '16px' }}>All Teams</h2>
              {teams.length === 0 ? (
                <p style={{ color: '#666' }}>No teams yet</p>
              ) : (
                teams.map(t => {
                  const teamMembers = users.filter(u => u.team_id === t.id)

                  return (
                    <div key={t.id} style={{ background: 'white', padding: '24px', borderRadius: '8px', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                      {editingTeam && editingTeam.id === t.id ? (
                        <div>
                          <input
                            type="text"
                            value={editingTeam.team_name}
                            onChange={e => setEditingTeam({ ...editingTeam, team_name: e.target.value })}
                            placeholder="Team name"
                            style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                          />
                          <input
                            type="text"
                            value={editingTeam.project_name}
                            onChange={e => setEditingTeam({ ...editingTeam, project_name: e.target.value })}
                            placeholder="Project name"
                            style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => updateTeam(t.id)}
                              style={{ padding: '6px 12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTeam(null)}
                              style={{ padding: '6px 12px', background: '#e5e7eb', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div>
                              <p style={{ fontWeight: 'bold', fontSize: '18px' }}>{t.team_name}</p>
                              <p style={{ color: '#666', fontSize: '14px' }}>{t.project_name}</p>
                              {t.is_closed && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>🔒 Closed</p>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => setEditingTeam({ id: t.id, team_name: t.team_name, project_name: t.project_name || '' })}
                                style={{ padding: '6px 12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteTeam(t.id)}
                                style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          <p style={{ fontSize: '14px', color: '#666' }}>
                            Members: {teamMembers.length === 0 ? 'No members yet' : teamMembers.map(m => m.full_name).join(', ')}
                          </p>
                        </>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
          
          {/* Help Requests Tab */}
          {activeTab === 'requests' && (
            <div>
              <h2 style={{ marginBottom: '16px' }}>All Help Requests</h2>
              {helpRequests.length === 0 ? (
                <p style={{ color: '#666' }}>No help requests yet</p>
              ) : (
                helpRequests.map(r => (
                  <div key={r.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
                    <div
                      onClick={() => toggleRequest(r.id)}
                      style={{ padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedRequest === r.id ? '#f9fafb' : 'white' }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{r.type_of_help}</span>
                          
                          {/* Add the Private badge here! */}
                          {r.is_private && (
                            <span style={{ padding: '2px 6px', background: '#fef2f2', color: '#ef4444', fontSize: '12px', borderRadius: '4px' }}>
                              🔒 Private
                            </span>
                          )}
                        </div>
                        
                        <p style={{ color: '#666', marginTop: '6px', fontSize: '14px' }}>{r.description}</p>
                        <p style={{ color: '#999', marginTop: '4px', fontSize: '12px' }}>Team: {getTeamName(r.team_id)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          background: r.status === 'open' ? '#fef3c7' : r.status === 'claimed' ? '#dbeafe' : '#d1fae5',
                          color: r.status === 'open' ? '#92400e' : r.status === 'claimed' ? '#1e40af' : '#065f46'
                        }}>
                          {r.status}
                        </span>
                        <span style={{ color: '#666' }}>{expandedRequest === r.id ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {expandedRequest === r.id && (
                      <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                        {replies[r.id] && replies[r.id].length > 0 ? (
                          replies[r.id].map(reply => (
                            <div key={reply.id} style={{ marginBottom: '12px', padding: '10px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{reply.full_name || 'Unknown'} - {reply.role_name || 'No role'}</span>
                                <span style={{ fontSize: '12px', color: '#999' }}>{new Date(reply.created_at).toLocaleString()}</span>
                              </div>
                              <p style={{ fontSize: '14px', color: '#333' }}>{reply.message}</p>
                            </div>
                          ))
                        ) : (
                          <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>No replies yet</p>
                        )}

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <input
                            type="text"
                            placeholder="Write a reply..."
                            value={newReply}
                            onChange={e => setNewReply(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && submitReply(r.id)}
                            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                          />
                          <button
                            onClick={() => submitReply(r.id)}
                            style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Admin