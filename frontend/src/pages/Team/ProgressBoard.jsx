import { useState } from 'react'
import axios from 'axios'

export default function ProgressBoard({ user, progress, refreshData }) {
  const [newProgress, setNewProgress] = useState({ status_label: '', comment: '' })
  const [editingProgressId, setEditingProgressId] = useState(null)
  const [editProgressData, setEditProgressData] = useState({ status_label: '', comment: '' })
  const [progressError, setProgressError] = useState('')

  const submitProgress = async () => {
    if (!newProgress.comment && !newProgress.status_label) return setProgressError('Please enter a status or comment')
    try {
      await axios.post('http://127.0.0.1:8000/progress', { team_id: user.team_id, status_label: newProgress.status_label, comment: newProgress.comment })
      setNewProgress({ status_label: '', comment: '' })
      setProgressError('')
      refreshData(user.team_id, user.id)
    } catch (err) { setProgressError('Failed to post update') }
  }

  const updateProgress = async (progressId) => {
    if (!editProgressData.status_label && !editProgressData.comment) return setProgressError('Please enter a status or comment')
    try {
      await axios.put(`http://127.0.0.1:8000/progress/${progressId}`, { status_label: editProgressData.status_label, comment: editProgressData.comment })
      setEditingProgressId(null)
      setProgressError('')
      refreshData(user.team_id, user.id)
    } catch (err) { setProgressError('Failed to update progress') }
  }

  const deleteProgress = async (progressId) => {
    if (!window.confirm('Are you sure you want to delete this progress update?')) return
    try {
      await axios.delete(`http://127.0.0.1:8000/progress/${progressId}`)
      refreshData(user.team_id, user.id)
    } catch (err) { setProgressError('Failed to delete progress update') }
  }

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '8px', marginTop: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ marginBottom: '16px' }}>Progress Updates</h2>
      {progressError && <p style={{ color: 'red', marginBottom: '12px' }}>{progressError}</p>}
      
      {progress.length === 0 ? <p style={{ color: '#666' }}>No progress updates yet</p> : progress.map(p => {
        const isEditing = editingProgressId === p.id;
        return (
          <div key={p.id} style={{ marginBottom: '12px', padding: '12px', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
            {isEditing ? (
              <div style={{ padding: '8px' }}>
                <input type="text" value={editProgressData.status_label} onChange={e => setEditProgressData({ ...editProgressData, status_label: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
                <textarea value={editProgressData.comment} onChange={e => setEditProgressData({ ...editProgressData, comment: e.target.value })} style={{ width: '100%', padding: '8px', marginBottom: '8px', borderRadius: '4px', border: '1px solid #ccc', height: '60px' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => updateProgress(p.id)} style={{ padding: '6px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save Changes</button>
                  <button onClick={() => setEditingProgressId(null)} style={{ padding: '6px 16px', background: '#e5e7eb', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{p.status_label}</span>
                    <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>{new Date(p.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setEditingProgressId(p.id); setEditProgressData({ status_label: p.status_label, comment: p.comment }); }} style={{ background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: '2px 6px' }}>Edit</button>
                    <button onClick={() => deleteProgress(p.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', padding: '2px 6px' }}>Delete</button>
                  </div>
                </div>
                <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>{p.comment}</p>
              </>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
        <h3 style={{ marginBottom: '12px' }}>Add Progress Update</h3>
        <input type="text" placeholder="Status label (e.g. MVP, Planning, Testing)" value={newProgress.status_label} onChange={e => setNewProgress({ ...newProgress, status_label: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc' }} />
        <textarea placeholder="Describe your progress..." value={newProgress.comment} onChange={e => setNewProgress({ ...newProgress, comment: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #ccc', height: '80px' }} />
        <button onClick={submitProgress} style={{ padding: '10px 24px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Post Update</button>
      </div>
    </div>
  )
}