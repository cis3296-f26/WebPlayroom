import { Link } from 'react-router-dom'

//This is the main page content, displayed on screen
const GameHub = () => {
  return (
    <div className="game-container">
      <h2>Welcome to WebPlayroom!</h2>
      <p>Choose a game to play:</p>
      
      <div className="hub-links">
        <Link to="/snake" className="game-button">Snake</Link>
        <Link to="/pool" className="game-button">8-Ball Pool</Link>
        <Link to="/connect4" className="game-button">Connect 4</Link>
        <Link to="/buckshotRouletteLitePlus" className="game-button">Buckshot Roulette Lite Plus</Link>
        <Link to="/countryQuest" className="game-button">Country Quest</Link>
      </div>
    </div>
  )
}

export default GameHub