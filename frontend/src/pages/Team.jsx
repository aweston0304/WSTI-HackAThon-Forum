import { useState, useEffect } from 'react'
import axios from 'axios'

function Team() {
  const [user, setUser] = useState(null)
  const [team, setTeam] = useState(null)
  const [progress, setProgress] = useState([])
  const [helpRequests, setHelpRequests] = useState([])
  const [newRequest, setNewRequest] = useState({ type_of_help: '', description: '' })
  const [error, setError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [teams, setTeams] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [newTeam, setNewTeam] = useState({ team_name: '', project_name: '' })
  const [newProgress, setNewProgress] = useState({ percentage: '', status_label: '', comment: '' })
  const [progressError, setProgressError] = useState('')

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
    console.log('Fetching team data for:', teamId, userId)
    try {
      const [teamRes, progressRes, requestsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/teams/${teamId}`),
        axios.get(`${import.meta.env.VITE_API_URL}/progress/team/${teamId}`),
        axios.get(`${import.meta.env.VITE_API_URL}/help-requests/team/${teamId}`)
      ])
      setTeam(teamRes.data)
      setProgress(progressRes.data)
      setHelpRequests(requestsRes.data)
    } catch (err) {
      setError('Failed to load team data')
    }
  }

  const fetchAllTeams = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/teams`)
    setTeams(res.data)
  }

  const createTeam = async () => {
    if (!newTeam.team_name) {
      setError('Please enter a team name')
      return
    }
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/teams?creator_id=${user.id}`, newTeam)
      const updatedUser = { ...user, team_id: res.data.id }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      fetchTeamData(res.data.id, user.id)
    } catch (err) {
      setError('Failed to create team')
    }
  }

  const joinTeam = async (teamId) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/teams/${teamId}/join?user_id=${user.id}`)
      const updatedUser = { ...user, team_id: teamId }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      fetchTeamData(teamId, user.id)
    } catch (err) {
      setError('Failed to join team')
    }
  }

  const submitHelpRequest = async () => {
  if (!newRequest.type_of_help || !newRequest.description) {
    setRequestError('Please fill in all fields')
    return
  }
  try {
    await axios.post(`${import.meta.env.VITE_API_URL}/help-requests`, {
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
  if (!newProgress.percentage) {
    setProgressError('Please enter a percentage')
    return
  }
  try {
    await axios.post('http://127.0.0.1:8000/progress', {
      team_id: user.team_id,
      percentage: parseInt(newProgress.percentage),
      status_label: newProgress.status_label,
      comment: newProgress.comment
    })
    setNewProgress({ percentage: '', status_label: '', comment: '' })
    setProgressError('')
    fetchTeamData(user.team_id, user.id)
  } catch (err) {
    setProgressError('Failed to submit progress update')
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
              {requestError && <p style={{ color: 'red', marginBottom: '12px' }}>{requestError}</p>}
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
              {teams.length === 0 ? (
                <p style={{ color: '#666' }}>No teams available yet</p>
              ) : (
                teams.map(t => (
                  <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', marginBottom: '8px' }}>
                    <div>
                      <p style={{ fontWeight: 'bold' }}>{t.team_name}</p>
                      <p style={{ color: '#666', fontSize: '14px' }}>{t.project_name}</p>
                    </div>
                    <button
                      onClick={() => joinTeam(t.id)}
                      style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Join
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
            <h2>{team?.team_name}</h2>
            <p style={{ color: '#666' }}>{team?.project_name}</p>
          </div>

          {/* Progress */}
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', marginTop: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '16px' }}>Progress</h2>
            {progress.length === 0 ? (
              <p style={{ color: '#666' }}>No progress updates yet</p>
            ) : (
              progress.map(p => (
                <div key={p.id} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>{p.status_label}</span>
                    <span>{p.percentage}%</span>
                  </div>
                  <div style={{ background: '#e5e7eb', borderRadius: '4px', height: '8px' }}>
                    <div style={{ background: '#4f46e5', width: `${p.percentage}%`, height: '8px', borderRadius: '4px' }} />
                  </div>
                  <p style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>{p.comment}</p>
                </div>
              ))
            )}
            <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
                <h3 style={{ marginBottom: '12px' }}>Add Progress Update</h3>
                <input
                    type="number"
                    placeholder="Percentage (0-100)"
                    value={newProgress.percentage}
                    min="0"
                    max="100"
                    onChange={e => setNewProgress({ ...newProgress, percentage: e.target.value })}
                    style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <input
                    type="text"
                    placeholder="Status label (e.g. MVP, Planning, Testing)"
                    value={newProgress.status_label}
                    onChange={e => setNewProgress({ ...newProgress, status_label: e.target.value })}
                    style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <textarea
                    placeholder="Comment (optional)"
                    value={newProgress.comment}
                    onChange={e => setNewProgress({ ...newProgress, comment: e.target.value })}
                    style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc', height: '80px' }}
                />
                {progressError && <p style={{ color: 'red', marginBottom: '12px' }}>{progressError}</p>}
                <button
                    onClick={submitProgress}
                    style={{ padding: '10px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    Submit Update
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
            {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}
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
                <div key={r.id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '4px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold' }}>{r.type_of_help}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      background: r.status === 'open' ? '#fef3c7' : r.status === 'claimed' ? '#dbeafe' : '#d1fae5',
                      color: r.status === 'open' ? '#92400e' : r.status === 'claimed' ? '#1e40af' : '#065f46'
                    }}>
                      {r.status}
                    </span>
                  </div>
                  <p style={{ color: '#666', marginTop: '8px' }}>{r.description}</p>
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