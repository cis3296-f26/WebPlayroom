import { Routes, Route, Link } from 'react-router-dom'

import GameHub from './GameHub.jsx'
import Snake from './game_containers/Snake.jsx'
import Pool from './game_containers/Pool/Pool.jsx'
import Connect4 from './game_containers/Connect4.jsx'
import BuckshotRouletteLitePlus from './game_containers/BuckshotRouletteLitePlus.jsx'
import CountryQuest from './game_containers/CountryQuest.jsx'

import './style/App.css'

//partial main screen content, includes URL routes to each game page
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
          <Route path="/buckshotRouletteLitePlus" element={<BuckshotRouletteLitePlus />} />
          <Route path="/countryQuest" element={<CountryQuest />} />
        </Routes>
      </main>
    </>
  )
}

export default App