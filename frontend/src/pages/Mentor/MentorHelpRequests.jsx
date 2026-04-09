import { useState } from 'react';
import axios from 'axios';
import { btnPrimary, btnSecondary, btnClaim, btnResolve, cardStyle } from './MentorStyles';

export default function MentorHelpRequests({ helpRequests, teams, user, refreshData }) {
  const [filter, setFilter] = useState('open');
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [replies, setReplies] = useState({});
  const [newReply, setNewReply] = useState('');

  const fetchReplies = async (id) => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/help-requests/${id}/replies`);
    setReplies(prev => ({ ...prev, [id]: res.data }));
  };

  const updateStatus = async (id, status) => {
    await axios.put(`${import.meta.env.VITE_API_URL}/help-requests/${id}`, { status });
    refreshData();
  };

  const submitReply = async (id) => {
    if (!newReply || !user) return;
    await axios.post(`${import.meta.env.VITE_API_URL}/help-requests/${id}/replies`, { 
      help_request_id: id, user_id: user.id, message: newReply 
    });
    setNewReply('');
    fetchReplies(id);
  };

  const getTeamName = (id) => teams.find(t => t.id === id)?.team_name || 'Unknown Team';
  const filtered = helpRequests.filter(r => filter === 'all' ? true : r.status === filter);

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {['open', 'claimed', 'resolved', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={filter === f ? btnPrimary : btnSecondary}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.map(r => (
        <div key={r.id} style={{ ...cardStyle, overflow: 'hidden', padding: 0 }}>
          <div 
            onClick={() => { setExpandedRequest(expandedRequest === r.id ? null : r.id); if(expandedRequest !== r.id) fetchReplies(r.id); }} 
            style={{ padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: expandedRequest === r.id ? '#f9fafb' : 'white' }}
          >
            <div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold' }}>{r.type_of_help}</span>
                {r.is_private && <span style={{ background: '#fef2f2', color: '#ef4444', fontSize: '10px', padding: '2px 6px', borderRadius: '4px' }}>🔒 Private</span>}
              </div>
              <p style={{ color: '#666', fontSize: '14px', margin: '4px 0' }}>{r.description}</p>
              <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>Team: {getTeamName(r.team_id)}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ background: r.status === 'open' ? '#fef3c7' : '#d1fae5', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{r.status}</span>
              <span style={{ color: '#999' }}>{expandedRequest === r.id ? '▲' : '▼'}</span>
            </div>
          </div>

          {expandedRequest === r.id && (
            <div style={{ padding: '16px', borderTop: '1px solid #eee', background: '#fcfcfc' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                {r.status === 'open' && <button style={btnClaim} onClick={() => updateStatus(r.id, 'claimed')}>Claim</button>}
                {r.status === 'claimed' && <button style={btnResolve} onClick={() => updateStatus(r.id, 'resolved')}>Resolve</button>}
                <button style={btnSecondary} onClick={() => updateStatus(r.id, 'open')}>Reopen</button>
              </div>

              {replies[r.id]?.map(reply => (
                <div key={reply.id} style={{ padding: '10px', background: 'white', borderRadius: '6px', marginBottom: '8px', border: '1px solid #eee' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '12px', margin: 0 }}>{reply.full_name} ({reply.role_name})</p>
                  <p style={{ margin: 0, fontSize: '14px' }}>{reply.message}</p>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <input type="text" value={newReply} onChange={e => setNewReply(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} placeholder="Reply..." />
                <button style={btnPrimary} onClick={() => submitReply(r.id)}>Send</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}