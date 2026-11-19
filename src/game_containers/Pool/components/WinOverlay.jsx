// Covers the table when the game ends, like the Snake game's game-over screen
//   winner      - 1 or 2
//   message     - how the game ended, from the rules (e.g. "Player 2 sank the 8 too early...")
//   onPlayAgain - starts a new game
export default function WinOverlay ({ winner, message, onPlayAgain }) {
  // The title already says who won, so drop a trailing "Player N wins!" from the rules' message
  const reason = message.replace(/\s*Player \d wins!$/, '')

  return (
    <div className='pool-overlay' role='dialog' aria-label='Game over'>
      <p className='pool-overlay-title'>Player {winner} wins!</p>
      <p className='pool-overlay-message'>{reason}</p>
      <button className='game-button' onClick={onPlayAgain}>Play again</button>
    </div>
  )
}
