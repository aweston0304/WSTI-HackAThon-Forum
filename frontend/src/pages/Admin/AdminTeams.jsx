import { useState } from 'react';
import axios from 'axios';
import { btnPrimary, btnDanger, btnSecondary, cardStyle } from './AdminStyles';

export default function AdminTeams({ teams, users, refreshData }) {
  const [editingTeam, setEditingTeam] = useState(null);

  const save = async (id) => {
    await axios.put(`${import.meta.env.VITE_API_URL}/teams/${id}`, editingTeam);
    setEditingTeam(null);
    refreshData();
  };

  const remove = async (id) => {
    if (window.confirm('Delete team?')) {
      await axios.delete(`${import.meta.env.VITE_API_URL}/teams/${id}`);
      refreshData();
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '16px' }}>All Teams</h2>
      {teams.map(t => (
        <div key={t.id} style={cardStyle}>
          {editingTeam?.id === t.id ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" value={editingTeam.team_name} onChange={e => setEditingTeam({ ...editingTeam, team_name: e.target.value })} style={{ flex: 1, padding: '8px' }} />
              <button style={btnPrimary} onClick={() => save(t.id)}>Save</button>
              <button style={btnSecondary} onClick={() => setEditingTeam(null)}>Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 'bold', margin: 0 }}>{t.team_name}</p>
                <p style={{ fontSize: '12px', color: '#666' }}>Members: {users.filter(u => u.team_id === t.id).map(m => m.full_name).join(', ')}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={btnSecondary} onClick={() => setEditingTeam(t)}>Edit</button>
                <button style={btnDanger} onClick={() => remove(t.id)}>Delete</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}