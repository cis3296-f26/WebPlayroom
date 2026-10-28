import { BALL_ACCEL, FRICTION, MIN_SPEED } from '../constants'

export function moveBall (ball, keys) {
  applyInput(ball, keys)
  applyFriction(ball)
  updatePostion(ball)
}

function applyInput (ball, keys) {
  if (keys.left) ball.vx -= BALL_ACCEL
  if (keys.right) ball.vx += BALL_ACCEL
  if (keys.up) ball.vy -= BALL_ACCEL
  if (keys.down) ball.vy += BALL_ACCEL
}

function applyFriction (ball) {
    ball.vx *= FRICTION
    ball.vy *= FRICTION

    if(Math.abs(ball.vx) < MIN_SPEED) ball.vx = 0;
    if(Math.abs(ball.vy) < MIN_SPEED) ball.vy = 0;
}

function updatePostion (ball) {
  ball.x += ball.vx
  ball.y += ball.vy
}
