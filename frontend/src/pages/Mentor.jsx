import { useState, useEffect } from 'react'
import axios from 'axios'

function Mentor() {
  const [user, setUser] = useState(null)
  const [helpRequests, setHelpRequests] = useState([])
  const [teams, setTeams] = useState([])
  const [expandedRequest, setExpandedRequest] = useState(null)
  const [replies, setReplies] = useState({})
  const [newReply, setNewReply] = useState('')
  const [filter, setFilter] = useState('open')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [requestsRes, teamsRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/help-requests'),
        axios.get('http://127.0.0.1:8000/teams')
      ])
      setHelpRequests(requestsRes.data)
      setTeams(teamsRes.data)
    } catch (err) {
      setError('Failed to load data')
    }
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

  const updateStatus = async (requestId, status) => {
    try {
      await axios.put(`http://127.0.0.1:8000/help-requests/${requestId}`, { status })
      setSuccess(`Request marked as ${status}!`)
      setTimeout(() => setSuccess(''), 2000)
      fetchData()
    } catch (err) {
      setError('Failed to update status')
    }
  }

  const getTeamName = (teamId) => {
    const team = teams.find(t => t.id === teamId)
    return team ? team.team_name : 'Unknown team'
  }

  const filteredRequests = helpRequests.filter(r => {
    if (filter === 'all') return true
    return r.status === filter
  })

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '8px' }}>Mentor Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>View and respond to help requests</p>

      {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}
      {success && <p style={{ color: 'green', marginBottom: '12px' }}>{success}</p>}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['open', 'claimed', 'resolved', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: filter === f ? 'bold' : 'normal',
              background: filter === f ? '#4f46e5' : '#e5e7eb',
              color: filter === f ? 'white' : '#333'
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Help Requests */}
      {filteredRequests.length === 0 ? (
        <p style={{ color: '#666' }}>No {filter} requests</p>
      ) : (
        filteredRequests.map(r => (
          <div key={r.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
            {/* Request Header */}
            <div
              onClick={() => toggleRequest(r.id)}
              style={{ padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedRequest === r.id ? '#f9fafb' : 'white' }}
            >
              <div>
                <span style={{ fontWeight: 'bold' }}>{r.type_of_help}</span>
                <p style={{ color: '#666', marginTop: '4px', fontSize: '14px' }}>{r.description}</p>
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

            {/* Expanded Section */}
            {expandedRequest === r.id && (
              <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>

                {/* Status Actions */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {r.status === 'open' && (
                    <button
                      onClick={() => updateStatus(r.id, 'claimed')}
                      style={{ padding: '6px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Claim
                    </button>
                  )}
                  {r.status === 'claimed' && (
                    <button
                      onClick={() => updateStatus(r.id, 'resolved')}
                      style={{ padding: '6px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Mark Resolved
                    </button>
                  )}
                  {r.status !== 'open' && (
                    <button
                      onClick={() => updateStatus(r.id, 'open')}
                      style={{ padding: '6px 16px', background: '#e5e7eb', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Reopen
                    </button>
                  )}
                </div>

                {/* Reply Thread */}
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

                {/* Reply Input */}
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
  )
}

export default Mentor