import { Vector } from './Vector'
import { MAX_PULL_DISTANCE, MIN_PULL_DISTANCE } from '../constants'

// Mouse controls for the cue: point to aim, then click and drag back to set power.
// render.js reads `cue` to draw the stick; onShoot(direction, power) runs on release.
export function setupCueControls (canvas, cueBall, canShoot, onShoot) {
  const cue = {
    direction: new Vector(1, 0), // unit vector the shot will travel along
    pull: 0,                     // how far the stick is pulled back, in px
    dragging: false
  }
  let dragStart = null // where the mouse was when the click started

  // Converts a mouse position to canvas coordinates (still correct if CSS resizes the canvas)
  const getMousePos = (event) => {
    const rect = canvas.getBoundingClientRect()
    return new Vector(
      (event.clientX - rect.left) * (canvas.width / rect.width),
      (event.clientY - rect.top) * (canvas.height / rect.height)
    )
  }

  // Point the cue from the cue ball toward the mouse
  const aimAt = (mouse) => {
    const toMouse = mouse.subtract(cueBall.pos)
    if (toMouse.magnitude() > 0) cue.direction = toMouse.normalize()
  }

  const onPointerMove = (event) => {
    const mouse = getMousePos(event)

    if (cue.dragging) {
      // Aim is locked while dragging. Pull = how far the mouse has moved
      // backward along the aim line since the click.
      const pulledBack = Vector.dot(dragStart.subtract(mouse), cue.direction)
      cue.pull = Math.min(Math.max(pulledBack, 0), MAX_PULL_DISTANCE)
    } else if (canShoot()) {
      aimAt(mouse)
    }
  }

  const onPointerDown = (event) => {
    if (event.button !== 0 || !canShoot()) return // left click only, and only when balls are still

    const mouse = getMousePos(event)
    aimAt(mouse)
    dragStart = mouse
    cue.dragging = true
    cue.pull = 0
    canvas.setPointerCapture(event.pointerId) // keep getting events if the mouse leaves the canvas
  }

  const onPointerUp = (event) => {
    if (!cue.dragging) return
    cue.dragging = false
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId)

    // A tiny pull counts as a cancelled shot, so a stray click doesn't tap the ball
    if (cue.pull >= MIN_PULL_DISTANCE) onShoot(cue.direction, cue.pull / MAX_PULL_DISTANCE)
    cue.pull = 0
  }

  // e.g. the browser takes over the pointer: drop the shot without firing
  const onPointerCancel = () => {
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
