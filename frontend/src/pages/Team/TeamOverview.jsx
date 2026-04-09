import { useState } from 'react'
import axios from 'axios'

export default function TeamOverview({ user, team, teamMembers, refreshData, onLeave }) {
  const [editingTeam, setEditingTeam] = useState(false)
  const [teamEdit, setTeamEdit] = useState({ team_name: '', project_name: '' })
  const [error, setError] = useState('')

  const toggleTeamClosed = async () => {
    try {
      await axios.put(`http://127.0.0.1:8000/teams/${team.id}/toggle-closed`)
      refreshData(team.id, user.id)
    } catch (err) {
      setError('Failed to update team status')
    }
  }

  const updateTeam = async () => {
    try {
      await axios.put(`http://127.0.0.1:8000/teams/${team.id}`, teamEdit)
      setEditingTeam(false)
      refreshData(team.id, user.id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update team')
    }
  }

  return (
    <div>
      {/* Team Info Container */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '8px', marginTop: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}
        {editingTeam ? (
          <div>
            <input type="text" value={teamEdit.team_name} onChange={e => setTeamEdit({ ...teamEdit, team_name: e.target.value })} placeholder="Team name" style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <input type="text" value={teamEdit.project_name} onChange={e => setTeamEdit({ ...teamEdit, project_name: e.target.value })} placeholder="Project name" style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={updateTeam} style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
              <button onClick={() => setEditingTeam(false)} style={{ padding: '8px 16px', background: '#e5e7eb', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0 }}>{team?.team_name}</h2>
              <p style={{ color: '#666', margin: '4px 0 0 0' }}>{team?.project_name}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => { setEditingTeam(true); setTeamEdit({ team_name: team.team_name, project_name: team.project_name || '' }) }} style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
              <button onClick={toggleTeamClosed} style={{ padding: '8px 16px', background: team?.is_closed ? '#10b981' : '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {team?.is_closed ? '🔓 Open Team' : '🔒 Close Team'}
              </button>
              <button onClick={onLeave} style={{ padding: '8px 16px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Leave Team</button>
            </div>
          </div>
        )}
        {team?.is_closed && <p style={{ marginTop: '8px', color: '#ef4444', fontSize: '14px', margin: '8px 0 0 0' }}>This team is closed — no new members can join</p>}
      </div>

      {/* Team Members Container */}
      <div style={{ background: 'white', padding: '24px', borderRadius: '8px', marginTop: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '16px' }}>Team Members ({teamMembers.length})</h2>
        {teamMembers.length === 0 ? <p style={{ color: '#666' }}>No members yet</p> : teamMembers.map(m => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
              {m.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 'bold', fontSize: '14px', margin: 0 }}>{m.full_name} {m.id === user.id && <span style={{ color: '#4f46e5', fontSize: '12px' }}>(you)</span>}</p>
              <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>{m.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}