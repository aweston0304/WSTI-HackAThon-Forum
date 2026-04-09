import { useState, useEffect } from 'react'
import axios from 'axios'
import TeamOnboarding from './TeamOnboarding'
import TeamOverview from './TeamOverview'
import ProgressBoard from './ProgressBoard'
import HelpBoard from './HelpBoard'

function Team() {
  const [user, setUser] = useState(null)
  const [team, setTeam] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const [progress, setProgress] = useState([])
  const [helpRequests, setHelpRequests] = useState([])
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

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
        axios.get(`http://127.0.0.1:8000/help-requests`),
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

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) return
    try {
      await axios.put(`http://127.0.0.1:8000/users/${user.id}`, { team_id: null })
      const updatedUser = { ...user, team_id: null }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      // Reset state so they go back to the onboarding view
      setUser(updatedUser)
      setTeam(null)
      setTeamMembers([])
      setProgress([])
      setHelpRequests([])
      setActiveTab('overview')
    } catch (err) {
      setError('Failed to leave team. Please try again.')
    }
  }

  if (!user) return <p>Loading...</p>

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '8px' }}>Welcome, {user.full_name}!</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!user.team_id ? (
        <TeamOnboarding 
          user={user} 
          setUser={setUser} 
          refreshData={fetchTeamData} 
        />
      ) : (
        <>
          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
            <button 
              onClick={() => setActiveTab('overview')}
              style={{ padding: '8px 16px', background: activeTab === 'overview' ? '#e0e7ff' : 'transparent', color: activeTab === 'overview' ? '#4f46e5' : '#666', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: activeTab === 'overview' ? 'bold' : 'normal' }}
            >
              My Team
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              style={{ padding: '8px 16px', background: activeTab === 'requests' ? '#e0e7ff' : 'transparent', color: activeTab === 'requests' ? '#4f46e5' : '#666', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: activeTab === 'requests' ? 'bold' : 'normal' }}
            >
              Help Board
            </button>
          </div>

          {activeTab === 'overview' && (
            <div>
              <TeamOverview 
                user={user} 
                team={team} 
                teamMembers={teamMembers} 
                refreshData={fetchTeamData} 
                onLeave={handleLeaveTeam} 
              />
              <ProgressBoard 
                user={user} 
                progress={progress} 
                refreshData={fetchTeamData} 
              />
            </div>
          )}

          {activeTab === 'requests' && (
            <HelpBoard 
              user={user} 
              helpRequests={helpRequests} 
              refreshData={fetchTeamData} 
            />
          )}
        </>
      )}
    </div>
  )
}

export default Team