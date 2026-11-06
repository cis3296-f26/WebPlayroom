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

export function checkWinner(board, row, column, player) {
  if (!player || board[row]?.[column] !== player) return false

  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]

  for (const [rowChange, columnChange] of directions) {
    let total = 1

    for (const side of [-1, 1]) {
      let r = row + rowChange * side
      let c = column + columnChange * side

      while (board[r]?.[c] === player) {
        total++
        r += rowChange * side
        c += columnChange * side
      }
    }

    if (total >= 4) return true
  }

  return false
}
