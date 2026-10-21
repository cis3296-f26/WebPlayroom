import { Routes, Route, Link } from 'react-router-dom'
import GameHub from './GameHub.jsx'
import Snake from './Snake.jsx'
import Pool from './Pool.jsx'
import Connect4 from './Connect4.jsx'
import './App.css'

function App() {
  return (
    <>
      <nav className="navbar">
        <Link to="/" className="logo-link">
          <h1>WebPlayroom</h1>
        </Link>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<GameHub />} />
          <Route path="/snake" element={<Snake />} />
          <Route path="/pool" element={<Pool />} />
          <Route path="/connect4" element={<Connect4 />} />
        </Routes>
      </main>
    </>
  )
}

export default App