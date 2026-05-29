import { Routes, Route, Navigate } from 'react-router'
import CrackedHeist from './pages/CrackedHeist'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<CrackedHeist />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
