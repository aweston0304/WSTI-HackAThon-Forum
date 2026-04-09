import { useState } from 'react';
import axios from 'axios';
import { btnPrimary, btnDanger, cardStyle } from './AdminStyles';

export default function AdminRoles({ roles, refreshData }) {
  const [newRole, setNewRole] = useState({ role_name: '', permission_level: 1 });

  const create = async () => {
    await axios.post(`${import.meta.env.VITE_API_URL}/roles`, newRole);
    setNewRole({ role_name: '', permission_level: 1 });
    refreshData();
  };

  const remove = async (id) => {
    if (window.confirm('Delete role?')) {
      await axios.delete(`${import.meta.env.VITE_API_URL}/roles/${id}`);
      refreshData();
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '16px' }}>Roles</h2>
      {roles.map(r => (
        <div key={r.id} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between' }}>
          <span>{r.role_name} (Level: {r.permission_level})</span>
          <button style={btnDanger} onClick={() => remove(r.id)}>Delete</button>
        </div>
      ))}
      <div style={{ ...cardStyle, background: '#f3f4f6' }}>
        <h3>New Role</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" placeholder="Name" value={newRole.role_name} onChange={e => setNewRole({ ...newRole, role_name: e.target.value })} style={{ flex: 1, padding: '8px' }} />
          <input type="number" value={newRole.permission_level} onChange={e => setNewRole({ ...newRole, permission_level: e.target.value })} style={{ width: '60px', padding: '8px' }} />
          <button style={btnPrimary} onClick={create}>Create</button>
        </div>
      </div>
    </div>
  );
}