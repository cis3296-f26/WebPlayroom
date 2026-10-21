import { Link } from 'react-router-dom'

const GameHub = () => {
  return (
    <div className="game-container">
      <h2>Welcome to WebPlayroom!</h2>
      <p>Choose a game to play:</p>
      
      <div className="hub-links">
        <Link to="/snake" className="game-button">Snake</Link>
        <Link to="/pool" className="game-button">8-Ball Pool</Link>
        <Link to="/connect4" className="game-button">Connect 4</Link>
      </div>
    </div>
  )
}

export default GameHub