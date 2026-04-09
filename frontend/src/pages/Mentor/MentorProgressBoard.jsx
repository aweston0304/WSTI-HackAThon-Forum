import { useState } from 'react';
import { cardStyle } from './MentorStyles';

export default function MentorProgressBoard({ teams, progress }) {
  const [expandedTeamProgress, setExpandedTeamProgress] = useState(null);

  return (
    <div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#4f46e5', background: '#e0e7ff', padding: '2px 8px', borderRadius: '4px' }}>
                    {latest.status_label}
                  </span>
                  <p style={{ margin: '8px 0 0 0', fontSize: '15px' }}>{latest.comment}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>{new Date(latest.created_at).toLocaleString()}</p>
                  {history.length > 0 && (
                    <span style={{ color: '#4f46e5', fontSize: '12px', fontWeight: 'bold' }}>
                      {expandedTeamProgress === t.id ? '▲ Hide' : `▼ History (${history.length})`}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {expandedTeamProgress === t.id && history.map(p => (
              <div key={p.id} style={{ marginTop: '8px', padding: '12px', borderLeft: '3px solid #4f46e5', background: '#ffffff', border: '1px solid #eee', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{p.status_label}</span>
                  <span style={{ fontSize: '11px', color: '#999' }}>{new Date(p.created_at).toLocaleString()}</span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>{p.comment}</p>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}