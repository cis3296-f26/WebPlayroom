import { Vector } from './Vector'
import { MAX_PULL_DISTANCE, MIN_PULL_DISTANCE } from '../constants'

// How close (px beyond the ball's edge) a click must be to grab the cue ball for ball in hand
const GRAB_MARGIN = 6

// Mouse controls for the cue: point to aim, then click and drag back to set power.
// With ball in hand, pressing on the cue ball drags it to a new spot instead.
// render.js reads `cue` to draw the stick, the aim line and the ball-in-hand ring.
//
// options:
//   canShoot()        - true when the player may act (balls stopped, game not over)
//   onShoot(dir, pow) - called on release with the aim direction and power (0 to 1)
//   ballInHand()      - where the cue ball may be placed right now ('kitchen', 'table' or null)
//   isValidSpot(pos)  - true if the cue ball may be placed at pos
export function setupCueControls (canvas, cueBall, { canShoot, onShoot, ballInHand, isValidSpot }) {
  const cue = {
    direction: new Vector(1, 0), // unit vector the shot will travel along
    pull: 0,                     // how far the stick is pulled back, in px
    dragging: false,             // pulling back for a shot
    placing: false,              // dragging the cue ball (ball in hand)
    ghost: null                  // where the mouse is trying to put the cue ball, when that spot isn't allowed
  }
  let dragStart = null  // where the mouse was when the click started
  let grabOffset = null // cue ball position minus mouse position, so the ball doesn't jump to the cursor

  // Converts a mouse position to canvas coordinates. clientLeft/clientTop are the border
  // widths, so the rail border around the table doesn't shift the aim. Scaling keeps it
  // correct even if CSS resizes the canvas.
  const getMousePos = (event) => {
    const rect = canvas.getBoundingClientRect()
    return new Vector(
      (event.clientX - rect.left - canvas.clientLeft) * (canvas.width / canvas.clientWidth),
      (event.clientY - rect.top - canvas.clientTop) * (canvas.height / canvas.clientHeight)
    )
  }

  // Point the cue from the cue ball toward the mouse
  const aimAt = (mouse) => {
    const toMouse = mouse.subtract(cueBall.pos)
    if (toMouse.magnitude() > 0) cue.direction = toMouse.normalize()
  }

  // True if the player is allowed to pick up the cue ball and the mouse is on it
  const canGrabCueBall = (mouse) =>
    canShoot() && ballInHand() !== null &&
    mouse.subtract(cueBall.pos).magnitude() <= cueBall.radius + GRAB_MARGIN

  const onPointerMove = (event) => {
    const mouse = getMousePos(event)

    if (cue.placing) {
      // The real cue ball only ever moves to legal spots, so physics never sees it
      // overlapping a ball or sitting in a pocket. Over an illegal spot, render.js
      // draws a see-through "ghost" ball there with a red ring instead.
      const spot = mouse.add(grabOffset)
      if (isValidSpot(spot)) {
        cueBall.pos = spot
        cue.ghost = null
      } else {
        cue.ghost = spot
      }
    } else if (cue.dragging) {
      // Aim is locked while dragging. Pull = how far the mouse has moved
      // backward along the aim line since the click.
      const pulledBack = Vector.dot(dragStart.subtract(mouse), cue.direction)
      cue.pull = Math.min(Math.max(pulledBack, 0), MAX_PULL_DISTANCE)
    } else if (canShoot()) {
      aimAt(mouse)
      canvas.style.cursor = canGrabCueBall(mouse) ? 'grab' : '' // '' falls back to the CSS crosshair
    }
  }

  const onPointerDown = (event) => {
    if (event.button !== 0 || !canShoot()) return // left click only, and only when balls are still

    const mouse = getMousePos(event)

    if (canGrabCueBall(mouse)) { // ball in hand: pick up the cue ball
      cue.placing = true
      cue.ghost = null
      grabOffset = cueBall.pos.subtract(mouse)
      canvas.style.cursor = 'grabbing'
      canvas.setPointerCapture(event.pointerId)
      return
    }

    aimAt(mouse)
    dragStart = mouse
    cue.dragging = true
    cue.pull = 0
    canvas.setPointerCapture(event.pointerId) // keep getting events if the mouse leaves the canvas
  }

  // Put the cue ball down. If the mouse was over an illegal spot, the ball simply stays
  // at the last legal spot it reached (it never left it).
  const dropCueBall = () => {
    cue.placing = false
    cue.ghost = null
    canvas.style.cursor = ''
  }

  const onPointerUp = (event) => {
    if (cue.placing) {
      dropCueBall()
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)
      return
    }
    if (!cue.dragging) return
    cue.dragging = false
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)

    // A tiny pull counts as a cancelled shot, so a stray click doesn't tap the ball
    if (cue.pull >= MIN_PULL_DISTANCE) onShoot(cue.direction, cue.pull / MAX_PULL_DISTANCE)
    cue.pull = 0
  }

  // e.g. the browser takes over the pointer: drop the shot without firing
  const onPointerCancel = () => {
    if (cue.placing) dropCueBall()
    cue.dragging = false
    cue.pull = 0
  }

  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerCancel)

  const cleanup = () => {
    canvas.removeEventListener('pointermove', onPointerMove)
    canvas.removeEventListener('pointerdown', onPointerDown)
    canvas.removeEventListener('pointerup', onPointerUp)
    canvas.removeEventListener('pointercancel', onPointerCancel)
  }

  return { cue, cleanup }
}
