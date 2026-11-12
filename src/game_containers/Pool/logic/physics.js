import { Vector } from './Vector'
import {
  FRICTION,
  MIN_SPEED,
  RESTITUTION,
  COLLISION_ITERATIONS,
  WALL_RESTITUTION,
  TABLE_WIDTH,
  TABLE_HEIGHT,
  TABLE_CENTER_Y,
  CUE_START_X,
  MAX_SHOT_SPEED,
  POCKETS,
  POCKET_RADIUS
} from '../constants'

// Advances the whole game by one fixed physics step (STEP_MS).
// Pool.jsx calls this a fixed number of times per second, no matter the screen's refresh rate.
// Returns the balls that dropped into a pocket during this step.
export function stepPhysics (balls) {
  const onTable = balls.filter(b => !b.pocketed) // pocketed balls are out of play

  for (const b of onTable) updateBall(b) // every ball gets friction + movement
  handleCollisions(onTable)

  // Pockets are checked before walls, so a ball heading into a pocket's mouth
  // drops in instead of bouncing off the cushion next to it
  const pocketedNow = onTable.filter(b => handlePockets(b))

  for (const b of onTable) {
    if (!b.pocketed) handleWalls(b) // last, so no ball ends the step outside the table
  }

  return pocketedNow
}

// Moves one ball for one step: friction, then position. Call on every ball.
export function updateBall (ball) {
  applyFriction(ball)
  updatePosition(ball)
}

// Strikes the cue ball. power is 0 to 1 (how far the cue was pulled back).
export function shoot (cueBall, direction, power) {
  cueBall.vel = direction.normalize().multiply(power * MAX_SHOT_SPEED)
}

// True once friction has brought every ball to a full stop (shots are only allowed then)
export function allBallsStopped (balls) {
  return balls.every(b => b.vel.x === 0 && b.vel.y === 0)
}

// If the ball is close enough to a pocket, it drops in: it stops and leaves play.
// Returns true if it was pocketed.
function handlePockets (ball) {
  for (const pocket of POCKETS) {
    if (ball.pos.subtract(pocket).magnitude() < POCKET_RADIUS) {
      ball.pocketed = true
      ball.vel = new Vector(0, 0)
      ball.pos = new Vector(pocket.x, pocket.y)
      return true
    }
  }
  return false
}

// After a scratch (the cue ball was pocketed), put the cue ball back on its starting
// spot. If another ball is sitting there, slide left until the spot is clear.
export function respotCueBall (cueBall, balls) {
  const isBlocked = (pos) => balls.some(b =>
    b !== cueBall && !b.pocketed &&
    b.pos.subtract(pos).magnitude() < b.radius + cueBall.radius
  )

  let spot = new Vector(CUE_START_X, TABLE_CENTER_Y)
  while (isBlocked(spot) && spot.x > cueBall.radius * 2) {
    spot = spot.subtract(new Vector(cueBall.radius, 0))
  }

  cueBall.pos = spot
  cueBall.vel = new Vector(0, 0)
  cueBall.pocketed = false
}

// Shrink velocity a little every frame; stop once the ball is barely moving
function applyFriction (ball) {
  ball.vel = ball.vel.multiply(FRICTION)

  if (ball.vel.magnitude() < MIN_SPEED) ball.vel = new Vector(0, 0)
}

function updatePosition (ball) {
  ball.pos = ball.pos.add(ball.vel)
}

// Keeps a ball on the table. If it has crossed an edge, put it back against that
// wall and send it away from the wall, losing some speed like a real cushion.
function handleWalls (ball) {
  const r = ball.radius
  let { x, y } = ball.pos
  let { x: vx, y: vy } = ball.vel

  // Math.abs forces the new direction to point away from the wall. Just flipping the
  // sign could flip it twice and trap the ball in the wall.
  if (x - r < 0) {                 // left wall
    x = r
    vx = Math.abs(vx) * WALL_RESTITUTION
  } else if (x + r > TABLE_WIDTH) { // right wall
    x = TABLE_WIDTH - r
    vx = -Math.abs(vx) * WALL_RESTITUTION
  }

  if (y - r < 0) {                  // top wall
    y = r
    vy = Math.abs(vy) * WALL_RESTITUTION
  } else if (y + r > TABLE_HEIGHT) { // bottom wall
    y = TABLE_HEIGHT - r
    vy = -Math.abs(vy) * WALL_RESTITUTION
  }

  ball.pos = new Vector(x, y)
  ball.vel = new Vector(vx, vy)
}

export function areColliding (a, b) {
  const distance = b.pos.subtract(a.pos).magnitude()
  return distance <= a.radius + b.radius
}

export function handleCollisions (balls) {
  // Repeat because fixing one pair can push a ball into another (common in the rack)
  for (let iter = 0; iter < COLLISION_ITERATIONS; iter++) {
    const contacts = findContacts(balls)
    if (contacts.length === 0) break // nothing touching, so stop early

    // Resolve touching pairs in a random order. Whichever pair goes first gets the
    // most energy, so a fixed order always favored the same side of the rack.
    shuffle(contacts)
    for (const [a, b] of contacts) resolveCollision(a, b)
  }
}

// Every pair of balls that is currently touching, as [a, b] arrays
function findContacts (balls) {
  const contacts = []
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      if (areColliding(balls[i], balls[j])) contacts.push([balls[i], balls[j]])
    }
  }
  return contacts
}

// Fisher-Yates shuffle: puts the array in a random order, in place
function shuffle (array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]
  }
}

function resolveCollision (a, b) {
  const offset = b.pos.subtract(a.pos)
  const distance = offset.magnitude()

  // Unit vector pointing from a's center to b's center (the "collision normal").
  // If the centers are exactly on top of each other there's no direction, so pick one.
  const normal = distance === 0 ? new Vector(1, 0) : offset.normalize()

  separateBalls(a, b, normal, distance)
  bounceBalls(a, b, normal)
}

// 1. Push the balls apart so they're just touching instead of overlapping
function separateBalls (a, b, normal, distance) {
  const overlap = (a.radius + b.radius) - distance
  const push = normal.multiply(overlap / 2)

  a.pos = a.pos.subtract(push) // a moves back, away from b
  b.pos = b.pos.add(push)      // b moves forward, away from a
}

// 2. Trade the part of each velocity that points along the normal
function bounceBalls (a, b, normal) {
  // How fast a is closing in on b, measured along the line between their centers
  const closingSpeed = Vector.dot(a.vel.subtract(b.vel), normal)

  // Negative or zero means they're already moving apart, so don't bounce again
  if (closingSpeed <= 0) return

  // Equal-mass balls: a loses that speed along the normal and b gains it.
  // RESTITUTION < 1 makes the hit lose a little energy, like real balls.
  const impulse = normal.multiply(closingSpeed * (1 + RESTITUTION) / 2)

  a.vel = a.vel.subtract(impulse)
  b.vel = b.vel.add(impulse)
}
