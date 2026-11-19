import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pool from '../game_containers/Pool/Pool.jsx'
import Scoreboard from '../game_containers/Pool/components/Scoreboard.jsx'
import WinOverlay from '../game_containers/Pool/components/WinOverlay.jsx'
import { createGame } from '../game_containers/Pool/logic/rules.js'

// A game after the break where player 1 has solids and player 2 has stripes
const midGame = (overrides = {}) => ({
  ...createGame(), isBreak: false, ballInHand: null, groups: { 1: 'solid', 2: 'stripe' }, ...overrides
})

const panel = (player) => screen.getByRole('region', { name: `Player ${player}` })

describe('Pool scoreboard', () => {
  it('shows an open table and highlights player 1 at the start', () => {
    render(<Scoreboard game={createGame()} pocketed={[]} />)

    expect(within(panel(1)).getByText('Table open')).toBeInTheDocument()
    expect(within(panel(2)).getByText('Table open')).toBeInTheDocument()
    expect(within(panel(1)).getByText(/claim solids or stripes/)).toBeInTheDocument()
    expect(panel(1)).toHaveAttribute('aria-current', 'true')
    expect(panel(2)).not.toHaveAttribute('aria-current')
    expect(within(panel(1)).getByText('Ball in hand')).toBeInTheDocument() // placing for the break
  })

  it('shows each player’s group and marks the balls they have sunk', () => {
    render(<Scoreboard game={midGame({ currentPlayer: 2 })} pocketed={[1, 2, 9]} />)

    expect(within(panel(1)).getByText('Solids 1–7')).toBeInTheDocument()
    expect(within(panel(2)).getByText('Stripes 9–15')).toBeInTheDocument()
    expect(within(panel(1)).getByLabelText('1 ball, sunk')).toBeInTheDocument()
    expect(within(panel(1)).getByLabelText('3 ball')).toBeInTheDocument()
    expect(within(panel(2)).getByLabelText('9 ball, sunk')).toBeInTheDocument()
    expect(panel(2)).toHaveAttribute('aria-current', 'true')
  })

  it('shows "On the 8" once a player has cleared their group', () => {
    render(<Scoreboard game={midGame()} pocketed={[1, 2, 3, 4, 5, 6, 7]} />)

    expect(within(panel(1)).getByText('On the 8')).toBeInTheDocument()
    expect(within(panel(1)).getByLabelText('8 ball')).toBeInTheDocument()
    expect(within(panel(2)).queryByText('On the 8')).not.toBeInTheDocument()
  })

  it('shows ball in hand only for the player who has it', () => {
    render(<Scoreboard game={midGame({ currentPlayer: 2, ballInHand: 'table' })} pocketed={[]} />)

    expect(within(panel(2)).getByText('Ball in hand')).toBeInTheDocument()
    expect(within(panel(1)).queryByText('Ball in hand')).not.toBeInTheDocument()
  })

  it('marks the winner and highlights nobody’s turn once the game is over', () => {
    render(<Scoreboard game={midGame({ winner: 2 })} pocketed={[]} />)

    expect(within(panel(2)).getByText('Winner!')).toBeInTheDocument()
    expect(panel(1)).not.toHaveAttribute('aria-current')
    expect(panel(2)).not.toHaveAttribute('aria-current')
  })
})

describe('Pool win screen', () => {
  it('shows the winner and how the game ended, and Play again restarts', async () => {
    const onPlayAgain = vi.fn()
    render(<WinOverlay winner={2} message='Player 1 sank the 8 too early. Player 2 wins!' onPlayAgain={onPlayAgain} />)

    expect(screen.getByText('Player 2 wins!')).toBeInTheDocument()
    expect(screen.getByText('Player 1 sank the 8 too early.')).toBeInTheDocument() // "wins!" isn't repeated

    await userEvent.click(screen.getByRole('button', { name: 'Play again' }))
    expect(onPlayAgain).toHaveBeenCalledTimes(1)
  })
})

describe('Pool page', () => {
  it('shows the scoreboard, the opening message, and a New game button', async () => {
    render(<Pool />)

    expect(panel(1)).toBeInTheDocument()
    expect(panel(2)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Player 1 to break')
    expect(screen.queryByRole('dialog', { name: 'Game over' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'New game' }))
    expect(screen.getByRole('status')).toHaveTextContent('Player 1 to break')
  })
})
