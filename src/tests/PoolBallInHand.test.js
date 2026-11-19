import { describe, it, expect } from 'vitest'
import Ball from '../game_containers/Pool/logic/Ball.js'
import { Vector } from '../game_containers/Pool/logic/Vector.js'
import { isValidCueSpot } from '../game_containers/Pool/logic/physics.js'
import { HEAD_STRING_X, TABLE_WIDTH, TABLE_HEIGHT } from '../game_containers/Pool/constants.js'

const cueBall = () => new Ball(100, 100, 'white', 0, 'cue')
const spot = (x, y) => new Vector(x, y)

describe('Pool ball in hand: where the cue ball may be placed', () => {
  it('allows an open spot anywhere on the table', () => {
    const cue = cueBall()
    expect(isValidCueSpot(spot(700, 300), cue, [cue], 'table')).toBe(true)
  })

  it('does not allow overlapping another ball, but allows just touching it', () => {
    const cue = cueBall()
    const other = new Ball(500, 250, 'red', 3, 'solid')
    expect(isValidCueSpot(spot(510, 250), cue, [cue, other], 'table')).toBe(false) // 10px apart: overlapping
    expect(isValidCueSpot(spot(520, 250), cue, [cue, other], 'table')).toBe(true)  // 20px apart: touching
  })

  it('ignores balls that are already pocketed', () => {
    const cue = cueBall()
    const sunk = new Ball(500, 250, 'red', 3, 'solid')
    sunk.pocketed = true
    expect(isValidCueSpot(spot(500, 250), cue, [cue, sunk], 'table')).toBe(true)
  })

  it('does not allow the ball to hang off the table', () => {
    const cue = cueBall()
    expect(isValidCueSpot(spot(5, 250), cue, [cue], 'table')).toBe(false)
    expect(isValidCueSpot(spot(500, TABLE_HEIGHT - 3), cue, [cue], 'table')).toBe(false)
    expect(isValidCueSpot(spot(TABLE_WIDTH + 20, 250), cue, [cue], 'table')).toBe(false)
  })

  it('does not allow a spot in or right next to a pocket', () => {
    const cue = cueBall()
    expect(isValidCueSpot(spot(12, 12), cue, [cue], 'table')).toBe(false)               // corner pocket
    expect(isValidCueSpot(spot(TABLE_WIDTH / 2, 12), cue, [cue], 'table')).toBe(false)  // side pocket
    expect(isValidCueSpot(spot(TABLE_WIDTH / 2, 60), cue, [cue], 'table')).toBe(true)   // clear of it
  })

  it('on the break, only allows spots at or behind the head string', () => {
    const cue = cueBall()
    expect(isValidCueSpot(spot(HEAD_STRING_X, 250), cue, [cue], 'kitchen')).toBe(true)
    expect(isValidCueSpot(spot(HEAD_STRING_X - 100, 400), cue, [cue], 'kitchen')).toBe(true)
    expect(isValidCueSpot(spot(HEAD_STRING_X + 1, 250), cue, [cue], 'kitchen')).toBe(false)
    expect(isValidCueSpot(spot(HEAD_STRING_X + 1, 250), cue, [cue], 'table')).toBe(true)
  })
})
