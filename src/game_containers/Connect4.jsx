import { useState } from 'react'
import { COLUMNS, ROWS, createBoard, dropPiece } from '../GameLogic/Connect4Logic.js'

function newGame() {
  return {
    board: createBoard(),
    currentPlayer: 'red',
  }
}

const Connect4 = () => {
  const [game, setGame] = useState(newGame)

  function playColumn(column) {
    setGame((current) => {
      const move = dropPiece(current.board, column, current.currentPlayer)
      if (!move) return current

      return {
        board: move.board,
        currentPlayer: current.currentPlayer === 'red' ? 'yellow' : 'red',
      }
    })
  }

  return (
    <div className="connect4-game-container">
      <h3>Connect 4</h3>

      <div className="connect4-players" aria-label="Players">
        <span><span className="connect4-token red" aria-hidden="true" /> Player 1 (Red)</span>
        <span><span className="connect4-token yellow" aria-hidden="true" /> Player 2 (Yellow)</span>
      </div>

      <div className="connect4-board" role="group" aria-label="Connect 4 board">
        {Array.from({ length: COLUMNS }, (_, column) => {
          const filled = game.board.reduce(
            (count, row) => count + (row[column] === null ? 0 : 1),
            0,
          )

          return (
            <button
              type="button"
              key={column}
              className="connect4-column"
              aria-label={'Column ' + (column + 1) + ', ' + filled + ' of ' + ROWS + ' filled'}
              disabled={filled === ROWS}
              onClick={() => playColumn(column)}
            >
              <span className="connect4-column-label" aria-hidden="true">{column + 1}</span>
              {game.board.map((row, rowIndex) => (
                <span
                  key={rowIndex}
                  className={'connect4-cell ' + (row[column] || 'empty')}
                  data-testid={'connect4-cell-' + rowIndex + '-' + column}
                  aria-hidden="true"
                />
              ))}
            </button>
          )
        })}
      </div>

      <button type="button" className="connect4-reset" onClick={() => setGame(newGame())}>
        New Game
      </button>
    </div>
  )
}

export default Connect4
