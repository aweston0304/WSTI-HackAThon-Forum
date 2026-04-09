import { useState } from 'react';
import axios from 'axios';
import { btnPrimary, cardStyle } from './AdminStyles';

export default function AdminHelpRequests({ helpRequests, teams }) {
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [replies, setReplies] = useState({});
  const [newReply, setNewReply] = useState('');

  const fetchReplies = async (id) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/help-requests/${id}/replies`);
      setReplies(prev => ({ ...prev, [id]: res.data }));
    } catch (err) { console.error('Failed to fetch replies'); }
  };

  const submitReply = async (id) => {
    if (!newReply) return;
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await axios.post(`${import.meta.env.VITE_API_URL}/help-requests/${id}/replies`, { 
        help_request_id: id, 
        user_id: user.id, 
        message: newReply 
      });
      setNewReply('');
      fetchReplies(id);
    } catch (err) { console.error('Failed to submit reply'); }
  };

  const getTeamName = (teamId) => teams.find(t => t.id === teamId)?.team_name || 'Unknown team';

  return (
    <div>
      <h2 style={{ marginBottom: '16px' }}>All Help Requests</h2>
      {helpRequests.map(r => (
        <div key={r.id} style={cardStyle}>
          {/* Header Row */}
          <div 
            onClick={() => { 
              setExpandedRequest(expandedRequest === r.id ? null : r.id); 
              if (expandedRequest !== r.id) fetchReplies(r.id); 
            }} 
            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            {/* Left Side: Info */}
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>{r.type_of_help}</span>
                {r.is_private && (
                  <span style={{ background: '#fef2f2', color: '#ef4444', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>
                    🔒 Private
                  </span>
                )}
              </div>
              <p style={{ color: '#666', fontSize: '14px', margin: '4px 0' }}>{r.description}</p>
              <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>Team: {getTeamName(r.team_id)}</p>
            </div>

            {/* Right Side: Status + Arrow grouped together */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ 
                background: r.status === 'open' ? '#fef3c7' : r.status === 'claimed' ? '#dbeafe' : '#d1fae5', 
                color: r.status === 'open' ? '#92400e' : r.status === 'claimed' ? '#1e40af' : '#065f46',
                padding: '4px 10px', 
                borderRadius: '12px', 
                fontSize: '12px',
                fontWeight: 'bold',
                textTransform: 'capitalize'
              }}>
                {r.status}
              </span>
              <span style={{ color: '#999', fontSize: '12px' }}>
                {expandedRequest === r.id ? '▲' : '▼'}
              </span>
            </div>
          </div>

          {/* Expanded Section (Replies) */}
          {expandedRequest === r.id && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
              {replies[r.id] && replies[r.id].length > 0 ? (
                replies[r.id].map(reply => (
                  <div key={reply.id} style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', marginBottom: '8px', border: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{reply.full_name} ({reply.role_name})</span>
                      <span style={{ fontSize: '11px', color: '#999' }}>{new Date(reply.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>{reply.message}</p>
                  </div>
                ))
              ) : (
                <p style={{ color: '#999', fontSize: '14px', fontStyle: 'italic' }}>No replies yet.</p>
              )}
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <input 
                  type="text" 
                  value={newReply} 
                  onChange={e => setNewReply(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && submitReply(r.id)}
                  style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ddd', outline: 'none' }} 
                  placeholder="Write a reply..." 
                />
                <button style={btnPrimary} onClick={() => submitReply(r.id)}>Send</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}