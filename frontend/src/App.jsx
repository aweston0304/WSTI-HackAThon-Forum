import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Mentor from './pages/Mentor'
import Team from './pages/Team'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Navbar /> 
      
      <Routes>
        <Route path="/" element={<Login />} />

        <Route 
          path="/admin" 
          element={
            <ProtectedRoute minLevel={3}>
              <Admin />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/mentor" 
          element={
            <ProtectedRoute minLevel={2}>
              <Mentor />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/team" 
          element={
            <ProtectedRoute minLevel={1}>
              <Team />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App