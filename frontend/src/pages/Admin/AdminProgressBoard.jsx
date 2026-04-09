import { useState } from 'react';
import { cardStyle } from './AdminStyles';

export default function AdminProgressBoard({ teams, progress }) {
  const [expandedTeamProgress, setExpandedTeamProgress] = useState(null);

  return (
    <div>
      <h2 style={{ marginBottom: '16px' }}>Live Progress Board</h2>
      {teams.map(t => {
        const teamProgress = progress.filter(p => p.team_id === t.id);
        if (teamProgress.length === 0) return null;

        const sorted = [...teamProgress].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const latest = sorted[0];
        const history = sorted.slice(1);

        return (
          <div key={t.id} style={cardStyle}>
            <div style={{ marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>{t.team_name}</h3>
              <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>{t.project_name}</p>
            </div>

            <div
              onClick={() => history.length > 0 && setExpandedTeamProgress(expandedTeamProgress === t.id ? null : t.id)}
              style={{ padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb', cursor: history.length > 0 ? 'pointer' : 'default' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>{latest.status_label}</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>{latest.comment}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>{new Date(latest.created_at).toLocaleString()}</p>
                  {history.length > 0 && <span style={{ color: '#4f46e5', fontSize: '12px' }}>{expandedTeamProgress === t.id ? '▲ Hide' : '▼ History'}</span>}
                </div>
              </div>
            </div>

            {expandedTeamProgress === t.id && history.map(p => (
              <div key={p.id} style={{ marginTop: '8px', padding: '10px', borderLeft: '3px solid #4f46e5', background: '#fcfcfc' }}>
                <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{p.status_label}</span>
                <p style={{ margin: 0, fontSize: '13px' }}>{p.comment}</p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}