import { useState } from 'react'
import axios from 'axios'

export default function TeamOnboarding({ user, setUser, refreshData }) {
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [teams, setTeams] = useState([])
  const [newTeam, setNewTeam] = useState({ team_name: '', project_name: '' })
  const [error, setError] = useState('')

  const fetchAllTeams = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/teams')
      setTeams(res.data)
    } catch (err) {
      setError('Failed to load teams')
    }
  }

  const createTeam = async () => {
    if (!newTeam.team_name) return setError('Please enter a team name')
    try {
      const res = await axios.post(`http://127.0.0.1:8000/teams?creator_id=${user.id}`, newTeam)
      const updatedUser = { ...user, team_id: res.data.id }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      refreshData(res.data.id, user.id)
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
      refreshData(teamId, user.id)
    } catch (err) {
      if (err.response?.status === 403) setError('This team is closed')
      else setError('Failed to join team')
    }
  }

  return (
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
          <input type="text" placeholder="Team name" value={newTeam.team_name} onChange={e => setNewTeam({ ...newTeam, team_name: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }} />
          <input type="text" placeholder="Project name (optional)" value={newTeam.project_name} onChange={e => setNewTeam({ ...newTeam, project_name: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }} />
          {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}
          <button onClick={createTeam} style={{ padding: '10px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Create Team</button>
        </div>
      )}

      {showJoin && (
        <div>
          {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}
          {teams.length === 0 ? <p style={{ color: '#666' }}>No teams available yet</p> : teams.map(t => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', marginBottom: '8px', opacity: t.is_closed ? 0.5 : 1 }}>
              <div>
                <p style={{ fontWeight: 'bold', margin: 0 }}>{t.team_name} {t.is_closed && <span style={{ fontSize: '12px', color: '#ef4444' }}>— Closed</span>}</p>
                <p style={{ color: '#666', fontSize: '14px', margin: '4px 0 0 0' }}>{t.project_name}</p>
              </div>
              <button onClick={() => !t.is_closed && joinTeam(t.id)} disabled={t.is_closed} style={{ padding: '8px 16px', background: t.is_closed ? '#ccc' : '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: t.is_closed ? 'not-allowed' : 'pointer' }}>
                {t.is_closed ? 'Closed' : 'Join'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}