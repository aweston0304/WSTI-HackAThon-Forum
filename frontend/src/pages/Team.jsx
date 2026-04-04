import { useState, useEffect } from 'react'
import axios from 'axios'

function Team() {
  const [user, setUser] = useState(null)
  const [team, setTeam] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const [progress, setProgress] = useState([])
  const [helpRequests, setHelpRequests] = useState([])
  const [newRequest, setNewRequest] = useState({ type_of_help: '', description: '' })
  const [error, setError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [progressError, setProgressError] = useState('')
  const [teams, setTeams] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [newTeam, setNewTeam] = useState({ team_name: '', project_name: '' })
  const [newProgress, setNewProgress] = useState({ status_label: '', comment: '' })
  const [expandedRequest, setExpandedRequest] = useState(null)
  const [replies, setReplies] = useState({})
  const [newReply, setNewReply] = useState('')
  const [editingTeam, setEditingTeam] = useState(false)
  const [teamEdit, setTeamEdit] = useState({ team_name: '', project_name: '' })

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      const parsedUser = JSON.parse(stored)
      setUser(parsedUser)
      if (parsedUser.team_id) {
        fetchTeamData(parsedUser.team_id, parsedUser.id)
      }
    }
  }, [])

  const fetchTeamData = async (teamId, userId) => {
    try {
      const [teamRes, progressRes, requestsRes, usersRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/teams/${teamId}`),
        axios.get(`http://127.0.0.1:8000/progress/team/${teamId}`),
        axios.get(`http://127.0.0.1:8000/help-requests/team/${teamId}`),
        axios.get(`http://127.0.0.1:8000/users`)
      ])
      setTeam(teamRes.data)
      setProgress(progressRes.data)
      setHelpRequests(requestsRes.data)
      setTeamMembers(usersRes.data.filter(u => u.team_id === teamId))
    } catch (err) {
      setError('Failed to load team data')
    }
  }

  const fetchAllTeams = async () => {
    const res = await axios.get('http://127.0.0.1:8000/teams')
    setTeams(res.data)
  }

  const fetchReplies = async (requestId) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/help-requests/${requestId}/replies`)
      setReplies(prev => ({ ...prev, [requestId]: res.data }))
    } catch (err) {
      console.error('Failed to fetch replies')
    }
  }

  const submitReply = async (requestId) => {
    if (!newReply) return
    try {
      await axios.post(`http://127.0.0.1:8000/help-requests/${requestId}/replies`, {
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

  const createTeam = async () => {
    if (!newTeam.team_name) {
      setError('Please enter a team name')
      return
    }
    try {
      const res = await axios.post(`http://127.0.0.1:8000/teams?creator_id=${user.id}`, newTeam)
      const updatedUser = { ...user, team_id: res.data.id }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      fetchTeamData(res.data.id, user.id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create team')
    }
  }

  const joinTeam = async (teamId) => {
    try {
      await axios.post(`http://127.0.0.1:8000/teams/${teamId}/join?user_id=${user.id}`)
      const updatedUser = { ...user, team_id: teamId }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      fetchTeamData(teamId, user.id)
    } catch (err) {
      if (err.response?.status === 403) {
        setError('This team is closed and not accepting new members')
      } else {
        setError('Failed to join team')
      }
    }
  }

  const toggleTeamClosed = async () => {
    try {
      const res = await axios.put(`http://127.0.0.1:8000/teams/${team.id}/toggle-closed`)
      setTeam(res.data)
    } catch (err) {
      setError('Failed to update team status')
    }
  }

  const updateTeam = async () => {
    try {
      const res = await axios.put(`http://127.0.0.1:8000/teams/${team.id}`, teamEdit)
      setTeam(res.data)
      setEditingTeam(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update team')
    }
  }

  const submitHelpRequest = async () => {
    if (!newRequest.type_of_help || !newRequest.description) {
      setRequestError('Please fill in all fields')
      return
    }
    try {
      await axios.post('http://127.0.0.1:8000/help-requests', {
        team_id: user.team_id,
        created_by: user.id,
        type_of_help: newRequest.type_of_help,
        description: newRequest.description,
        is_private: false
      })
      setNewRequest({ type_of_help: '', description: '' })
      setRequestError('')
      fetchTeamData(user.team_id, user.id)
    } catch (err) {
      setRequestError('Failed to submit help request')
    }
  }

  const submitProgress = async () => {
    if (!newProgress.comment && !newProgress.status_label) {
      setProgressError('Please enter a status or comment')
      return
    }
    try {
      await axios.post('http://127.0.0.1:8000/progress', {
        team_id: user.team_id,
        status_label: newProgress.status_label,
        comment: newProgress.comment
      })
      setNewProgress({ status_label: '', comment: '' })
      setProgressError('')
      fetchTeamData(user.team_id, user.id)
    } catch (err) {
      setProgressError('Failed to post update')
    }
  }

  if (!user) return <p>Loading...</p>

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '8px' }}>Welcome, {user.full_name}!</h1>

      {!user.team_id ? (
        <div style={{ background: 'white', padding: '24px', borderRadius: '8px', marginTop: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '16px' }}>Get Started</h2>
          <p style={{ color: '#666', marginBottom: '24px' }}>You are not in a team yet. Create a new one or join an existing one.</p>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={() => { setShowCreate(true); setShowJoin(false) }}
              style={{ padding: '10px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Create a Team
            </button>
            <button
              onClick={() => { setShowJoin(true); setShowCreate(false); fetchAllTeams() }}
              style={{ padding: '10px 24px', background: 'white', color: '#4f46e5', border: '2px solid #4f46e5', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Join a Team
            </button>
          </div>

          {showCreate && (
            <div>
              <input
                type="text"
                placeholder="Team name"
                value={newTeam.team_name}
                onChange={e => setNewTeam({ ...newTeam, team_name: e.target.value })}
                style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <input
                type="text"
                placeholder="Project name (optional)"
                value={newTeam.project_name}
                onChange={e => setNewTeam({ ...newTeam, project_name: e.target.value })}
                style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}
              <button
                onClick={createTeam}
                style={{ padding: '10px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Create Team
              </button>
            </div>
          )}

          {showJoin && (
            <div>
              {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}
              {teams.length === 0 ? (
                <p style={{ color: '#666' }}>No teams available yet</p>
              ) : (
                teams.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', marginBottom: '8px', opacity: t.is_closed ? 0.5 : 1 }}>
                    <div>
                      <p style={{ fontWeight: 'bold' }}>{t.team_name} {t.is_closed && <span style={{ fontSize: '12px', color: '#ef4444' }}>— Closed</span>}</p>
                      <p style={{ color: '#666', fontSize: '14px' }}>{t.project_name}</p>
                    </div>
                    <button
                      onClick={() => !t.is_closed && joinTeam(t.id)}
                      disabled={t.is_closed}
                      style={{ padding: '8px 16px', background: t.is_closed ? '#ccc' : '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: t.is_closed ? 'not-allowed' : 'pointer' }}
                    >
                      {t.is_closed ? 'Closed' : 'Join'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Team Info */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', marginTop: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            {editingTeam ? (
              <div>
                <input
                  type="text"
                  value={teamEdit.team_name}
                  onChange={e => setTeamEdit({ ...teamEdit, team_name: e.target.value })}
                  placeholder="Team name"
                  style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input
                  type="text"
                  value={teamEdit.project_name}
                  onChange={e => setTeamEdit({ ...teamEdit, project_name: e.target.value })}
                  placeholder="Project name"
                  style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={updateTeam}
                    style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingTeam(false)}
                    style={{ padding: '8px 16px', background: '#e5e7eb', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2>{team?.team_name}</h2>
                  <p style={{ color: '#666' }}>{team?.project_name}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setEditingTeam(true); setTeamEdit({ team_name: team.team_name, project_name: team.project_name || '' }) }}
                    style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={toggleTeamClosed}
                    style={{ padding: '8px 16px', background: team?.is_closed ? '#10b981' : '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {team?.is_closed ? '🔓 Open Team' : '🔒 Close Team'}
                  </button>
                </div>
              </div>
            )}
            {team?.is_closed && (
              <p style={{ marginTop: '8px', color: '#ef4444', fontSize: '14px' }}>This team is closed — no new members can join</p>
            )}
          </div>

          {/* Team Members */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', marginTop: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '16px' }}>Team Members ({teamMembers.length})</h2>
            {teamMembers.length === 0 ? (
              <p style={{ color: '#666' }}>No members yet</p>
            ) : (
              teamMembers.map(m => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                    {m.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '14px' }}>{m.full_name} {m.id === user.id && <span style={{ color: '#4f46e5', fontSize: '12px' }}>(you)</span>}</p>
                    <p style={{ color: '#666', fontSize: '12px' }}>{m.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Progress */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', marginTop: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '16px' }}>Progress Updates</h2>
            {progress.length === 0 ? (
              <p style={{ color: '#666' }}>No progress updates yet</p>
            ) : (
              progress.map(p => (
                <div key={p.id} style={{ marginBottom: '12px', padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{p.status_label}</span>
                    <span style={{ fontSize: '12px', color: '#999' }}>{new Date(p.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ color: '#666', fontSize: '14px' }}>{p.comment}</p>
                </div>
              ))
            )}

            {/* Add Progress Update */}
            <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <h3 style={{ marginBottom: '12px' }}>Add Progress Update</h3>
              <input
                type="text"
                placeholder="Status label (e.g. MVP, Planning, Testing)"
                value={newProgress.status_label}
                onChange={e => setNewProgress({ ...newProgress, status_label: e.target.value })}
                style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <textarea
                placeholder="Describe your progress..."
                value={newProgress.comment}
                onChange={e => setNewProgress({ ...newProgress, comment: e.target.value })}
                style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc', height: '80px' }}
              />
              {progressError && <p style={{ color: 'red', marginBottom: '12px' }}>{progressError}</p>}
              <button
                onClick={submitProgress}
                style={{ padding: '10px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Post Update
              </button>
            </div>
          </div>

          {/* Submit Help Request */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', marginTop: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '16px' }}>Request Help</h2>
            <input
              type="text"
              placeholder="Type of help (e.g. React, Database)"
              value={newRequest.type_of_help}
              onChange={e => setNewRequest({ ...newRequest, type_of_help: e.target.value })}
              style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
            <textarea
              placeholder="Describe your issue..."
              value={newRequest.description}
              onChange={e => setNewRequest({ ...newRequest, description: e.target.value })}
              style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc', height: '100px' }}
            />
            {requestError && <p style={{ color: 'red', marginBottom: '12px' }}>{requestError}</p>}
            <button
              onClick={submitHelpRequest}
              style={{ padding: '10px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Submit Request
            </button>
          </div>

          {/* Help Requests List */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', marginTop: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '16px' }}>Your Help Requests</h2>
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
                      <span style={{ fontWeight: 'bold' }}>{r.type_of_help}</span>
                      <p style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>{r.description}</p>
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
        </>
      )}
    </div>
  )
}

export default Team