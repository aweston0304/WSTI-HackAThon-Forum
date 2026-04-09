import { useState, useEffect } from 'react'
import axios from 'axios'
import MentorProgressBoard from './MentorProgressBoard'
import MentorHelpRequests from './MentorHelpRequests'

function Mentor() {
  const [user, setUser] = useState(null)
  const [helpRequests, setHelpRequests] = useState([])
  const [teams, setTeams] = useState([])
  const [progress, setProgress] = useState([])
  const [activeTab, setActiveTab] = useState('progress')
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [requestsRes, teamsRes, progressRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/help-requests`),
        axios.get(`${import.meta.env.VITE_API_URL}/teams`),
        axios.get(`${import.meta.env.VITE_API_URL}/progress`)
      ])
      setHelpRequests(requestsRes.data)
      setTeams(teamsRes.data)
      setProgress(progressRes.data)
    } catch (err) { setError('Failed to load data') }
  }

  const tabStyle = (tab) => ({
    padding: '10px 20px',
    cursor: 'pointer',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
    background: 'none',
    fontWeight: activeTab === tab ? 'bold' : 'normal',
    color: activeTab === tab ? '#4f46e5' : '#666',
    outline: 'none'
  })

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Mentor Dashboard</h1>
      <div style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '24px', display: 'flex', gap: '8px' }}>
        <button style={tabStyle('progress')} onClick={() => setActiveTab('progress')}>Live Progress</button>
        <button style={tabStyle('requests')} onClick={() => setActiveTab('requests')}>Help Requests</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {activeTab === 'progress' && <MentorProgressBoard teams={teams} progress={progress} />}
      {activeTab === 'requests' && (
        <MentorHelpRequests 
          helpRequests={helpRequests} 
          teams={teams} 
          user={user} 
          refreshData={fetchData} 
        />
      )}
    </div>
  )
}

export default Mentor