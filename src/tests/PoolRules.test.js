import { describe, it, expect } from 'vitest'
import { createGame, evaluateShot, groupOf } from '../game_containers/Pool/logic/rules.js'

const ALL_OBJECT_BALLS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]

// Balls still on the table after a shot: everything except what has gone in so far
const tableWithout = (...gone) => ALL_OBJECT_BALLS.filter(n => !gone.includes(n))

// A game after the break, with groups already assigned
function midGame ({ player = 1, p1Group = 'solid' } = {}) {
  const p2Group = p1Group === 'solid' ? 'stripe' : 'solid'
  return { ...createGame(), isBreak: false, currentPlayer: player, groups: { 1: p1Group, 2: p2Group } }
}

describe('Pool rules: setup', () => {
  it('starts with player 1 breaking on an open table', () => {
    const game = createGame()
    expect(game.currentPlayer).toBe(1)
    expect(game.isBreak).toBe(true)
    expect(game.groups).toEqual({ 1: null, 2: null })
    expect(game.winner).toBeNull()
    expect(game.ballInHand).toBe('kitchen') // the breaker may place the cue ball behind the head string
  })

  it('knows which group each ball belongs to', () => {
    expect(groupOf(0)).toBe('cue')
    expect(groupOf(1)).toBe('solid')
    expect(groupOf(7)).toBe('solid')
    expect(groupOf(8)).toBe('eight')
    expect(groupOf(9)).toBe('stripe')
    expect(groupOf(15)).toBe('stripe')
  })

  it('does not change the game it was given', () => {
    const before = createGame()
    const copy = JSON.parse(JSON.stringify(before))
    evaluateShot(before, { firstHit: 1, pocketed: [3] }, tableWithout(3))
    expect(before).toEqual(copy)
  })
})

describe('Pool rules: the break', () => {
  it('lets the breaker continue if a ball goes in, leaving the table open', () => {
    const game = evaluateShot(createGame(), { firstHit: 1, pocketed: [3, 12] }, tableWithout(3, 12))
    expect(game.currentPlayer).toBe(1)
    expect(game.groups).toEqual({ 1: null, 2: null })
    expect(game.isBreak).toBe(false)
  })

  it('passes the turn if nothing goes in', () => {
    const game = evaluateShot(createGame(), { firstHit: 1, pocketed: [] }, tableWithout())
    expect(game.currentPlayer).toBe(2)
    expect(game.ballInHand).toBeNull()
  })

  it('gives the other player ball in hand after a scratch on the break', () => {
    const game = evaluateShot(createGame(), { firstHit: 1, pocketed: [0] }, tableWithout())
    expect(game.currentPlayer).toBe(2)
    expect(game.ballInHand).toBe('table')
  })

  it('re-racks with the same breaker if the 8 goes in on the break', () => {
    const game = evaluateShot(createGame(), { firstHit: 1, pocketed: [8] }, tableWithout(8))
    expect(game.rerack).toBe(true)
    expect(game.isBreak).toBe(true)
    expect(game.ballInHand).toBe('kitchen')
    expect(game.currentPlayer).toBe(1)
    expect(game.winner).toBeNull()
  })
})

describe('Pool rules: choosing groups on an open table', () => {
  const openTable = () => ({ ...createGame(), isBreak: false })

  it('gives the shooter the group of the ball they sink', () => {
    const game = evaluateShot(openTable(), { firstHit: 11, pocketed: [11] }, tableWithout(11))
    expect(game.groups).toEqual({ 1: 'stripe', 2: 'solid' })
    expect(game.currentPlayer).toBe(1)
  })

  it('uses the first ball that dropped when both groups go in', () => {
    const game = evaluateShot(openTable(), { firstHit: 2, pocketed: [2, 10] }, tableWithout(2, 10))
    expect(game.groups).toEqual({ 1: 'solid', 2: 'stripe' })
  })

  it('does not assign groups when the shot is a foul', () => {
    const game = evaluateShot(openTable(), { firstHit: 2, pocketed: [2, 0] }, tableWithout(2))
    expect(game.groups).toEqual({ 1: null, 2: null })
    expect(game.currentPlayer).toBe(2)
  })

  it('allows hitting either group first, but not the 8', () => {
    expect(evaluateShot(openTable(), { firstHit: 13, pocketed: [] }, tableWithout()).ballInHand).toBeNull()
    expect(evaluateShot(openTable(), { firstHit: 8, pocketed: [] }, tableWithout()).ballInHand).toBe('table')
  })
})

describe('Pool rules: turns', () => {
  it('keeps the turn after sinking your own ball', () => {
    const game = evaluateShot(midGame(), { firstHit: 4, pocketed: [4] }, tableWithout(4))
    expect(game.currentPlayer).toBe(1)
    expect(game.ballInHand).toBeNull()
  })

  it('ends ball in hand after a legal shot', () => {
    const afterFoul = { ...midGame(), ballInHand: 'table' }
    const game = evaluateShot(afterFoul, { firstHit: 4, pocketed: [] }, tableWithout())
    expect(game.ballInHand).toBeNull()
  })

  it('passes the turn after a miss', () => {
    const game = evaluateShot(midGame(), { firstHit: 4, pocketed: [] }, tableWithout())
    expect(game.currentPlayer).toBe(2)
    expect(game.ballInHand).toBeNull()
  })

  it('passes the turn (without a foul) when only the opponent’s ball goes in', () => {
    const game = evaluateShot(midGame(), { firstHit: 4, pocketed: [12] }, tableWithout(12))
    expect(game.currentPlayer).toBe(2)
    expect(game.ballInHand).toBeNull()
  })
})

describe('Pool rules: fouls', () => {
  const expectFoul = (game) => {
    expect(game.currentPlayer).toBe(2)
    expect(game.ballInHand).toBe('table')
    expect(game.message).toMatch(/Foul/)
  }

  it('scratching is a foul, even if your own ball went in', () => {
    expectFoul(evaluateShot(midGame(), { firstHit: 4, pocketed: [4, 0] }, tableWithout(4)))
  })

  it('missing every ball is a foul', () => {
    expectFoul(evaluateShot(midGame(), { firstHit: null, pocketed: [] }, tableWithout()))
  })

  it('hitting the opponent’s ball first is a foul', () => {
    expectFoul(evaluateShot(midGame(), { firstHit: 12, pocketed: [4] }, tableWithout(4)))
  })

  it('hitting the 8 first before clearing your group is a foul', () => {
    expectFoul(evaluateShot(midGame(), { firstHit: 8, pocketed: [] }, tableWithout()))
  })

  it('once on the 8, hitting any other ball first is a foul', () => {
    const solidsCleared = tableWithout(1, 2, 3, 4, 5, 6, 7)
    expectFoul(evaluateShot(midGame(), { firstHit: 12, pocketed: [] }, solidsCleared))
  })
})

describe('Pool rules: winning and losing', () => {
  const solidsCleared = tableWithout(1, 2, 3, 4, 5, 6, 7)

  it('wins when you sink the 8 after clearing your group', () => {
    const game = evaluateShot(midGame(), { firstHit: 8, pocketed: [8] }, solidsCleared.filter(n => n !== 8))
    expect(game.winner).toBe(1)
  })

  it('loses when you sink the 8 early', () => {
    const game = evaluateShot(midGame(), { firstHit: 3, pocketed: [8] }, tableWithout(8))
    expect(game.winner).toBe(2)
  })

  it('loses when you scratch while sinking the 8', () => {
    const game = evaluateShot(midGame(), { firstHit: 8, pocketed: [8, 0] }, solidsCleared.filter(n => n !== 8))
    expect(game.winner).toBe(2)
  })

  it('loses when the 8 goes in on the same shot as your last ball', () => {
    const lastSolidLeft = tableWithout(1, 2, 3, 4, 5, 6)                // only the 7 left
    const after = lastSolidLeft.filter(n => n !== 7 && n !== 8)
    const game = evaluateShot(midGame(), { firstHit: 7, pocketed: [7, 8] }, after)
    expect(game.winner).toBe(2)
  })

  it('lets player 2 win too', () => {
    const stripesCleared = tableWithout(9, 10, 11, 12, 13, 14, 15)
    const game = evaluateShot(midGame({ player: 2 }), { firstHit: 8, pocketed: [8] }, stripesCleared.filter(n => n !== 8))
    expect(game.winner).toBe(2)
    expect(game.message).toMatch(/Player 2/)
  })
})
