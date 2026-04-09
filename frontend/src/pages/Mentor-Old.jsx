import { useState, useEffect } from 'react'
import axios from 'axios'

function Mentor() {
  const [user, setUser] = useState(null)
  const [helpRequests, setHelpRequests] = useState([])
  const [teams, setTeams] = useState([])
  
  // NEW: State for progress and tabs
  const [progress, setProgress] = useState([])
  const [activeTab, setActiveTab] = useState('progress')
  const [expandedTeamProgress, setExpandedTeamProgress] = useState(null)

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
      // NEW: Added progress to the parallel fetch
      const [requestsRes, teamsRes, progressRes] = await Promise.all([
        axios.get('http://127.0.0.1:8000/help-requests'),
        axios.get('http://127.0.0.1:8000/teams'),
        axios.get('http://127.0.0.1:8000/progress')
      ])
      setHelpRequests(requestsRes.data)
      setTeams(teamsRes.data)
      setProgress(progressRes.data)
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
      // Safe check for user
      if (!user || !user.id) {
        setError('User session invalid. Please log in again.')
        return
      }

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

  // NEW: Tab styling function
  const tabStyle = (tab) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
    background: 'none',
    fontWeight: activeTab === tab ? 'bold' : 'normal',
    color: activeTab === tab ? '#4f46e5' : '#666'
  })

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '8px' }}>Mentor Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '24px' }}>Monitor team progress and assist with help requests</p>

      {error && <p style={{ color: 'red', marginBottom: '12px' }}>{error}</p>}
      {success && <p style={{ color: 'green', marginBottom: '12px' }}>{success}</p>}

      {/* Tabs Menu */}
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '24px', display: 'flex', gap: '8px' }}>
        <button style={tabStyle('progress')} onClick={() => setActiveTab('progress')}>Live Progress</button>
        <button style={tabStyle('requests')} onClick={() => setActiveTab('requests')}>Help Requests ({helpRequests.length})</button>
      </div>

      {/* Progress Board Tab */}
      {activeTab === 'progress' && (
        <div>
          {teams.length === 0 ? (
            <p style={{ color: '#666' }}>No teams available.</p>
          ) : (
            teams.map(t => {
              // Group progress by this specific team
              const teamProgress = progress.filter(p => p.team_id === t.id);

              // Hide teams with no progress updates yet
              if (teamProgress.length === 0) return null;

              // Sort newest to oldest
              const sortedProgress = [...teamProgress].sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
              );

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

                  {/* Latest Update */}
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

                  {/* Older Updates */}
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

      {/* Help Requests Tab */}
      {activeTab === 'requests' && (
        <div>
          {/* Filter Tabs specifically for requests */}
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

          {/* Requests List */}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{r.type_of_help}</span>
                      
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
      )}
    </div>
  )
}

export default Mentor