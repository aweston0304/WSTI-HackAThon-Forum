import { useState } from 'react'
import axios from 'axios'

export default function HelpBoard({ user, helpRequests, refreshData }) {
  const [newRequest, setNewRequest] = useState({ type_of_help: '', description: '', is_private: false })
  const [editingRequestId, setEditingRequestId] = useState(null)
  const [editRequestData, setEditRequestData] = useState({ type_of_help: '', description: '', is_private: false })
  const [expandedRequest, setExpandedRequest] = useState(null)
  const [replies, setReplies] = useState({})
  const [newReply, setNewReply] = useState('')
  const [requestError, setRequestError] = useState('')

  const visibleHelpRequests = helpRequests.filter(req => {
    if (!user) return false;
    if (req.team_id === user.team_id) return true;
    if (!req.is_private) return true;
    return false;
  });

  const fetchReplies = async (requestId) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/help-requests/${requestId}/replies`)
      setReplies(prev => ({ ...prev, [requestId]: res.data }))
    } catch (err) { console.error('Failed to fetch replies') }
  }

  const submitReply = async (requestId) => {
    if (!newReply) return
    try {
      await axios.post(`http://127.0.0.1:8000/help-requests/${requestId}/replies`, { help_request_id: requestId, user_id: user.id, message: newReply })
      setNewReply('')
      fetchReplies(requestId)
    } catch (err) { console.error('Failed to submit reply') }
  }

  const toggleRequest = (requestId) => {
    if (expandedRequest === requestId) {
      setExpandedRequest(null)
      setEditingRequestId(null) 
    } else {
      setExpandedRequest(requestId)
      fetchReplies(requestId)
    }
  }

  const submitHelpRequest = async () => {
    if (!newRequest.type_of_help || !newRequest.description) return setRequestError('Please fill in all fields')
    try {
      await axios.post('http://127.0.0.1:8000/help-requests', { team_id: user.team_id, created_by: user.id, type_of_help: newRequest.type_of_help, description: newRequest.description, is_private: newRequest.is_private })
      setNewRequest({ type_of_help: '', description: '', is_private: false })
      setRequestError('')
      refreshData(user.team_id, user.id)
    } catch (err) { setRequestError('Failed to submit help request') }
  }

  const updateHelpRequest = async (requestId) => {
    if (!editRequestData.type_of_help || !editRequestData.description) return setRequestError('Please fill in all fields')
    try {
      await axios.put(`http://127.0.0.1:8000/help-requests/${requestId}`, { type_of_help: editRequestData.type_of_help, description: editRequestData.description, is_private: editRequestData.is_private })
      setEditingRequestId(null)
      refreshData(user.team_id, user.id) 
    } catch (err) { setRequestError('Failed to update request') }
  }

  const deleteHelpRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this help request?')) return
    try {
      await axios.delete(`http://127.0.0.1:8000/help-requests/${requestId}`)
      setExpandedRequest(null)
      refreshData(user.team_id, user.id)
    } catch (err) { setRequestError('Failed to delete request') }
  }

  return (
    <div>
      <div style={{ background: 'white', padding: '24px', borderRadius: '8px', marginTop: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '16px' }}>Ask the Community</h2>
        <input type="text" placeholder="Type of help (e.g. React Error)" value={newRequest.type_of_help} onChange={e => setNewRequest({ ...newRequest, type_of_help: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }} />
        <textarea placeholder="Describe your issue in detail..." value={newRequest.description} onChange={e => setNewRequest({ ...newRequest, description: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc', height: '100px' }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer' }}>
          <input type="checkbox" checked={newRequest.is_private} onChange={e => setNewRequest({ ...newRequest, is_private: e.target.checked })} />
          <span style={{ fontSize: '14px', color: '#333' }}><strong>Make Private</strong> (Only Mentors, Admins, and your team can see this)</span>
        </label>
        {requestError && <p style={{ color: 'red', marginBottom: '12px' }}>{requestError}</p>}
        <button onClick={submitHelpRequest} style={{ padding: '10px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Submit Request</button>
      </div>
      
      <div style={{ background: 'white', padding: '24px', borderRadius: '8px', marginTop: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '16px' }}>Active Requests</h2>
        {visibleHelpRequests.length === 0 ? <p style={{ color: '#666' }}>No active help requests visible right now.</p> : visibleHelpRequests.map(r => {
          const isOwnTeam = r.team_id === user.team_id;
          const isEditing = editingRequestId === r.id;

          return (
            <div key={r.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
              <div onClick={() => !isEditing && toggleRequest(r.id)} style={{ padding: '16px', cursor: isEditing ? 'default' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedRequest === r.id ? '#f9fafb' : 'white' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>{r.type_of_help}</span>
                    {isOwnTeam && <span style={{ padding: '2px 6px', background: '#e0e7ff', color: '#4f46e5', fontSize: '12px', borderRadius: '4px' }}>Your Team</span>}
                    {r.is_private && <span style={{ padding: '2px 6px', background: '#fef2f2', color: '#ef4444', fontSize: '12px', borderRadius: '4px' }}>🔒 Private</span>}
                  </div>
                  <p style={{ color: '#666', marginTop: '4px', fontSize: '14px', margin: '4px 0 0 0' }}>{r.description}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '12px', background: r.status === 'open' ? '#fef3c7' : r.status === 'claimed' ? '#dbeafe' : '#d1fae5', color: r.status === 'open' ? '#92400e' : r.status === 'claimed' ? '#1e40af' : '#065f46' }}>{r.status}</span>
                  {!isEditing && <span style={{ color: '#666' }}>{expandedRequest === r.id ? '▲' : '▼'}</span>}
                </div>
              </div>

              {expandedRequest === r.id && (
                <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  {isEditing ? (
                    <div style={{ marginBottom: '16px', padding: '16px', background: 'white', borderRadius: '6px', border: '1px solid #ccc' }}>
                      <h4 style={{ margin: '0 0 12px 0' }}>Edit Request</h4>
                      <input type="text" value={editRequestData.type_of_help} onChange={e => setEditRequestData({ ...editRequestData, type_of_help: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                      <textarea value={editRequestData.description} onChange={e => setEditRequestData({ ...editRequestData, description: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', height: '80px' }} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={editRequestData.is_private} onChange={e => setEditRequestData({ ...editRequestData, is_private: e.target.checked })} />
                        <span style={{ fontSize: '14px', color: '#333' }}>Private Request</span>
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => updateHelpRequest(r.id)} style={{ padding: '6px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Changes</button>
                        <button onClick={() => setEditingRequestId(null)} style={{ padding: '6px 16px', background: '#e5e7eb', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {isOwnTeam && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '12px' }}>
                          <button onClick={() => { setEditingRequestId(r.id); setEditRequestData({ type_of_help: r.type_of_help, description: r.description, is_private: r.is_private }); }} style={{ padding: '6px 12px', background: '#e5e7eb', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Edit</button>
                          <button onClick={() => deleteHelpRequest(r.id)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#ef4444', border: '1px solid #f87171', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Delete</button>
                        </div>
                      )}
                      {replies[r.id] && replies[r.id].length > 0 ? replies[r.id].map(reply => (
                        <div key={reply.id} style={{ marginBottom: '12px', padding: '10px', background: 'white', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{reply.full_name || 'Unknown'}</span>
                            <span style={{ fontSize: '12px', color: '#999' }}>{new Date(reply.created_at).toLocaleString()}</span>
                          </div>
                          <p style={{ fontSize: '14px', color: '#333', margin: 0 }}>{reply.message}</p>
                        </div>
                      )) : <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>No replies yet</p>}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <input type="text" placeholder="Write a reply..." value={newReply} onChange={e => setNewReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitReply(r.id)} style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                        <button onClick={() => submitReply(r.id)} style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Send</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  )
}