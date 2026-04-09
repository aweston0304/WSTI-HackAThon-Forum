import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Mentor from './pages/Mentor'
import Team from './pages/Team/Team'
import Navbar from './Components/Navbar'
import ProtectedRoute from './Components/ProtectedRoute'

function App() {
  return (
    <>
      <Navbar /> 
      <Routes>
        <Route path="/" element={<Login />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute minLevel={3} maxLevel={99}>
              <Admin />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/mentor" 
          element={
            <ProtectedRoute minLevel={2} maxLevel={2}>
              <Mentor />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/team" 
          element={
            <ProtectedRoute minLevel={1} maxLevel={1}>
              <Team />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  )
}

export default App