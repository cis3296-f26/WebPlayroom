import { describe, it, expect } from 'vitest'
import Ball from '../game_containers/Pool/logic/Ball.js'
import { Vector } from '../game_containers/Pool/logic/Vector.js'
import { stepPhysics, shoot } from '../game_containers/Pool/logic/physics.js'
import { createShotEvents } from '../game_containers/Pool/logic/rules.js'

// Runs physics for a while (about 5 seconds of game time), recording into `shot`
function play (balls, shot, steps = 300) {
  for (let i = 0; i < steps; i++) stepPhysics(balls, shot)
}

describe('Pool shot tracking', () => {
  it('records the first ball the cue ball hits, not balls hit later in a chain', () => {
    const cue = new Ball(100, 250, 'white', 0, 'cue')
    const first = new Ball(200, 250, 'red', 3, 'solid')
    const second = new Ball(260, 250, 'blue', 10, 'stripe')
    const shot = createShotEvents()

    shoot(cue, new Vector(1, 0), 0.4)
    play([cue, first, second], shot)

    expect(shot.firstHit).toBe(3)
    expect(second.vel.magnitude() > 0 || second.pos.x !== 260).toBe(true) // the chain reached ball 10
  })

  it('records no hit when the cue ball misses everything', () => {
    const cue = new Ball(100, 100, 'white', 0, 'cue')
    const other = new Ball(500, 400, 'red', 3, 'solid')
    const shot = createShotEvents()

    shoot(cue, new Vector(1, 0), 0.3)
    play([cue, other], shot)

    expect(shot.firstHit).toBeNull()
  })

  it('records balls that drop, in the order they dropped', () => {
    const near = new Ball(950, 450, 'red', 3, 'solid')     // close to the bottom-right pocket
    const far = new Ball(200, 200, 'blue', 10, 'stripe')   // farther from the top-left pocket
    near.vel = new Vector(5, 5)
    far.vel = new Vector(-5, -5)
    const shot = createShotEvents()

    play([near, far], shot)

    expect(shot.pocketed).toEqual([3, 10])
  })

  it('records a scratch as ball 0', () => {
    const cue = new Ball(100, 100, 'white', 0, 'cue')
    const shot = createShotEvents()

    shoot(cue, new Vector(-1, -1), 0.3) // straight into the top-left pocket
    play([cue], shot)

    expect(cue.pocketed).toBe(true)
    expect(shot.pocketed).toEqual([0])
    expect(shot.firstHit).toBeNull()
  })

  it('does not record anything when no shot record is passed', () => {
    const cue = new Ball(100, 250, 'white', 0, 'cue')
    const other = new Ball(200, 250, 'red', 3, 'solid')
    shoot(cue, new Vector(1, 0), 0.3)
    expect(() => play([cue, other], null)).not.toThrow()
  })
})
