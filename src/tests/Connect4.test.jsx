import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Connect4 from '../game_containers/Connect4.jsx'
import { COLUMNS, ROWS, createBoard, dropPiece } from '../GameLogic/Connect4Logic.js'

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

  it('keeps accepting moves after four pieces line up, without declaring a winner', async () => {
    const user = userEvent.setup()
    render(<Connect4 />)

    for (const column of [1, 7, 2, 7, 3, 6, 4]) {
      await user.click(screen.getByRole('button', { name: new RegExp('Column ' + column + ',') }))
    }

    expect(screen.queryByText(/wins|draw/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Column 5,/ })).toBeEnabled()

    await user.click(screen.getByRole('button', { name: /Column 5,/ }))
    expect(screen.getByTestId('connect4-cell-5-4')).toHaveClass('yellow')
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
