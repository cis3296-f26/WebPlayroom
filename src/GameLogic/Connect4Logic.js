export const ROWS = 6
export const COLUMNS = 7

export function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLUMNS).fill(null))
}

export function dropPiece(board, column, player) {
  if (!Number.isInteger(column) || column < 0 || column >= COLUMNS) return null

  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][column] === null) {
      const nextBoard = board.map((cells) => [...cells])
      nextBoard[row][column] = player
      return { board: nextBoard, row }
    }
  }

  return null
}
