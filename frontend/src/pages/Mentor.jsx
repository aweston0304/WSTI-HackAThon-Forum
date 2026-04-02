import { useState, useEffect } from 'react'
import axios from 'axios'

function Mentor() {
  const [requests, setRequests] = useState([])
  const [teams, setTeams] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [reqRes, teamRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/help-requests`),
        axios.get(`${import.meta.env.VITE_API_URL}/teams`)
      ])
      // Sort so 'open' requests are at the top
      const sortedRequests = reqRes.data.sort((a, b) => {
        if (a.status === 'open' && b.status !== 'open') return -1
        return 0
      })
      setRequests(sortedRequests)
      setTeams(teamRes.data)
    } catch (err) {
      setError('Failed to load mentor data')
    }
  }

  const updateStatus = async (requestId, newStatus) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/help-requests/${requestId}`, {
        status: newStatus
      })
      fetchData() // Refresh list
    } catch (err) {
      setError('Failed to update request status')
    }
  }

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId)
    return team ? team.team_name : 'Unknown Team'
  }

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>Mentor Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>Help teams solve their technical issues</p>
      
      {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}

      <div style={{ display: 'grid', gap: '20px' }}>
        {requests.length === 0 ? (
          <p>No help requests submitted yet.</p>
        ) : (
          requests.map(req => (
            <div key={req.id} style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '8px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderLeft: req.status === 'open' ? '5px solid #f59e0b' : '5px solid #10b981'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ margin: '0 0 8px 0' }}>{req.type_of_help}</h3>
                  <p style={{ fontWeight: 'bold', color: '#4f46e5' }}>Team: {getTeamName(req.team_id)}</p>
                </div>
                <span style={{ 
                  padding: '4px 12px', 
                  borderRadius: '12px', 
                  fontSize: '12px', 
                  textTransform: 'uppercase',
                  background: req.status === 'open' ? '#fef3c7' : '#d1fae5',
                  color: req.status === 'open' ? '#92400e' : '#065f46'
                }}>
                  {req.status}
                </span>
              </div>
              
              <p style={{ margin: '16px 0', color: '#444' }}>{req.description}</p>

              <div style={{ display: 'flex', gap: '10px' }}>
                {req.status === 'open' && (
                  <button 
                    onClick={() => updateStatus(req.id, 'claimed')}
                    style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Claim Request
                  </button>
                )}
                {req.status === 'claimed' && (
                  <button 
                    onClick={() => updateStatus(req.id, 'resolved')}
                    style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Mentor