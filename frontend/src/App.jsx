import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CreateRoom from './pages/CreateRoom'
import JoinRoom from './pages/JoinRoom'
import RoomPage from './rooms/RoomPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/room/create" element={<CreateRoom />} />
          <Route path="/room/join" element={<JoinRoom />} />
          <Route path="/room/:roomId" element={<RoomPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}
export default App