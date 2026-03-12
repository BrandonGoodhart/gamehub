import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import TicTacToe from './pages/TicTacToe'
import Poker from './pages/Poker'

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tic-tac-toe" element={<TicTacToe />} />
        <Route path="/poker" element={<Poker />} />
      </Routes>
    </div>
  )
}

export default App
