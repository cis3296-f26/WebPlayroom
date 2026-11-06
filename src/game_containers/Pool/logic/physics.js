import { Vector } from './Vector'
import { BALL_ACCEL, FRICTION, MIN_SPEED, RESTITUTION } from '../constants'

// Moves one ball for one frame: friction, then position. Call on every ball.
export function updateBall (ball) {
  applyFriction(ball)
  updatePosition(ball)
}

// Turn the held arrow keys into an acceleration, then add it to velocity
export function applyInput (ball, keys) {
  const direction = new Vector(
    (keys.right ? 1 : 0) - (keys.left ? 1 : 0),
    (keys.down ? 1 : 0) - (keys.up ? 1 : 0)
  )

  // normalize() keeps diagonal pushes the same strength as straight ones
  ball.acc = direction.normalize().multiply(BALL_ACCEL)
  ball.vel = ball.vel.add(ball.acc)
}

// Shrink velocity a little every frame; stop once the ball is barely moving
function applyFriction (ball) {
  ball.vel = ball.vel.multiply(FRICTION)

  if (ball.vel.magnitude() < MIN_SPEED) ball.vel = new Vector(0, 0)
}

function updatePosition (ball) {
  ball.pos = ball.pos.add(ball.vel)
}

export function areColliding (a, b) {
  const distance = b.pos.subtract(a.pos).magnitude()
  return distance <= a.radius + b.radius
}

export function handleCollisions (balls) {
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      if (areColliding(balls[i], balls[j])) {
        resolveCollision(balls[i], balls[j])
      }
    }
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
