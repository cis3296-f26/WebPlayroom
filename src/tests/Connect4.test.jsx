import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Connect4 from '../game_containers/Connect4.jsx'
import { COLUMNS, ROWS, createBoard, dropPiece, checkWinner } from '../GameLogic/Connect4Logic.js'

describe('Connect 4 placement', () => {
  it('places pieces from the bottom up without changing the previous board', () => {
    const empty = createBoard()
    const first = dropPiece(empty, 2, 'red')
    const second = dropPiece(first.board, 2, 'yellow')

    expect(first.row).toBe(ROWS - 1)
    expect(second.row).toBe(ROWS - 2)
    expect(empty[ROWS - 1][2]).toBeNull()
    expect(first.board[ROWS - 1][2]).toBe('red')
    expect(second.board[ROWS - 2][2]).toBe('yellow')
  })

  it('rejects a full column or a column outside the board', () => {
    const board = createBoard()
    for (let row = 0; row < ROWS; row++) board[row][0] = 'red'

    expect(dropPiece(board, 0, 'yellow')).toBeNull()
    expect(dropPiece(board, -1, 'yellow')).toBeNull()
    expect(dropPiece(board, COLUMNS, 'yellow')).toBeNull()
  })
})

describe('Connect 4 win check', () => {
  it('finds horizontal and vertical wins after the last chip lands', () => {
    const horizontal = createBoard()
    for (const column of [0, 1, 3]) horizontal[5][column] = 'red'
    const horizontalMove = dropPiece(horizontal, 2, 'red')
    expect(checkWinner(horizontalMove.board, horizontalMove.row, 2, 'red')).toBe(true)

    const vertical = createBoard()
    for (const row of [3, 4, 5]) vertical[row][0] = 'yellow'
    const verticalMove = dropPiece(vertical, 0, 'yellow')
    expect(checkWinner(verticalMove.board, verticalMove.row, 0, 'yellow')).toBe(true)
  })

  it('finds wins on both diagonals', () => {
    const downRight = createBoard()
    for (const [row, column] of [[2, 0], [3, 1], [4, 2], [5, 3]]) {
      downRight[row][column] = 'red'
    }
    expect(checkWinner(downRight, 3, 1, 'red')).toBe(true)

    const upRight = createBoard()
    for (const [row, column] of [[5, 0], [4, 1], [3, 2], [2, 3]]) {
      upRight[row][column] = 'yellow'
    }
    expect(checkWinner(upRight, 3, 2, 'yellow')).toBe(true)
  })

  it('does not count three chips or an opponent chip as a win', () => {
    const board = createBoard()
    board[5][0] = 'red'
    board[5][1] = 'red'
    board[5][2] = 'red'
    board[5][3] = 'yellow'

    expect(checkWinner(board, 5, 1, 'red')).toBe(false)
    expect(checkWinner(board, 5, 3, 'red')).toBe(false)
    expect(checkWinner(board, 5, 3, 'yellow')).toBe(false)
  })
})

describe('Connect 4 screen', () => {
  it('alternates players, fills the lowest space with plain coins, and resets', async () => {
    const user = userEvent.setup()
    render(<Connect4 />)

    expect(screen.queryByText(/Select a column to place your piece/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Column 1,/ }))
    expect(screen.getByTestId('connect4-cell-5-0')).toHaveClass('red')
    expect(screen.getByTestId('connect4-cell-5-0')).toBeEmptyDOMElement()

    await user.click(screen.getByRole('button', { name: /Column 1,/ }))
    expect(screen.getByTestId('connect4-cell-4-0')).toHaveClass('yellow')
    expect(screen.getByTestId('connect4-cell-4-0')).toBeEmptyDOMElement()

    await user.click(screen.getByRole('button', { name: 'New Game' }))
    expect(screen.getByTestId('connect4-cell-5-0')).toHaveClass('empty')
  })

  it('announces a red win and stops play until New Game', async () => {
    const user = userEvent.setup()
    render(<Connect4 />)

    for (const column of [1, 7, 2, 7, 3, 6, 4]) {
      await user.click(screen.getByRole('button', { name: new RegExp('Column ' + column + ',') }))
    }

    expect(screen.getByRole('status')).toHaveTextContent('Player 1 (Red) wins!')
    expect(screen.getByRole('button', { name: /Column 5,/ })).toBeDisabled()
    expect(screen.getByTestId('connect4-cell-5-4')).toHaveClass('empty')

    await user.click(screen.getByRole('button', { name: 'New Game' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByTestId('connect4-cell-5-0')).toHaveClass('empty')
    expect(screen.getByRole('button', { name: /Column 5,/ })).toBeEnabled()
  })

  it('announces a yellow win', async () => {
    const user = userEvent.setup()
    render(<Connect4 />)

    for (const column of [7, 1, 7, 1, 6, 1, 6, 1]) {
      await user.click(screen.getByRole('button', { name: new RegExp('Column ' + column + ',') }))
    }

    expect(screen.getByRole('status')).toHaveTextContent('Player 2 (Yellow) wins!')
    expect(screen.getByRole('button', { name: /Column 2,/ })).toBeDisabled()
  })

  it('disables only a full column', async () => {
    const user = userEvent.setup()
    render(<Connect4 />)

    for (let move = 0; move < ROWS; move++) {
      await user.click(screen.getByRole('button', { name: /Column 1,/ }))
    }

    expect(screen.getByRole('button', { name: /Column 1,/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Column 2,/ })).toBeEnabled()
  })
})
