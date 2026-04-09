import axios from 'axios';
import { btnDanger, cardStyle } from './AdminStyles';

export default function AdminUsers({ users, roles, teams, refreshData }) {
  const updateRole = async (uid, rid) => {
    await axios.put(`${import.meta.env.VITE_API_URL}/users/${uid}/assign-role`, { role_id: parseInt(rid) });
    refreshData();
  };

  const updateTeam = async (uid, tid) => {
    await axios.put(`${import.meta.env.VITE_API_URL}/users/${uid}`, { team_id: tid === 'null' ? null : parseInt(tid) });
    refreshData();
  };

  const remove = async (id) => {
    if (window.confirm('Delete user?')) {
      await axios.delete(`${import.meta.env.VITE_API_URL}/users/${id}`);
      refreshData();
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '16px' }}>All Users</h2>
      {users.map(u => (
        <div key={u.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 'bold', margin: 0 }}>{u.full_name}</p>
            <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>{u.email}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select value={u.role_id || ''} onChange={e => updateRole(u.id, e.target.value)} style={{ padding: '4px' }}>
              <option value="">No Role</option>
              {roles.map(r => <option key={r.id} value={r.id}>{r.role_name}</option>)}
            </select>
            <select value={u.team_id || 'null'} onChange={e => updateTeam(u.id, e.target.value)} style={{ padding: '4px' }}>
              <option value="null">No Team</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.team_name}</option>)}
            </select>
            <button style={btnDanger} onClick={() => remove(u.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}