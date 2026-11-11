import { useRef, useEffect } from 'react'
import './Pool.css'
import { drawFrame } from './logic/render'
import { stepPhysics, shoot, allBallsStopped } from './logic/physics'
import { setupCueControls } from './logic/input'
import { createStartingLineup } from './logic/startingLineup'
import {
  TABLE_WIDTH,
  TABLE_HEIGHT,
  STEP_MS,
  MAX_FRAME_MS
} from './constants'

const Pool = () => {
  const canvasRef = useRef(null) 

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return // no canvas support (e.g. the jsdom test environment), so skip the game loop

    const balls = createStartingLineup();
    const cueBall = balls[0];

    const canShoot = () => allBallsStopped(balls)
    const { cue, cleanup } = setupCueControls(canvas, cueBall, canShoot, (direction, power) => {
      shoot(cueBall, direction, power)
    })

    let frameId
    let lastTime = null // timestamp of the previous frame
    let accumulator = 0 // real time (ms) that hasn't been simulated yet

    // requestAnimationFrame passes the current time in ms as `now`
    const loop = (now) => {
      if (lastTime === null) lastTime = now
      const frameTime = Math.min(now - lastTime, MAX_FRAME_MS)
      lastTime = now

      // Run as many fixed-size physics steps as the elapsed time covers.
      // 60Hz screen: 1 per frame. 120Hz: 0 or 1. Slow 30fps computer: 2.
      accumulator += frameTime
      while (accumulator >= STEP_MS) {
        stepPhysics(balls)
        accumulator -= STEP_MS
      }

      drawFrame(ctx, balls, cueBall, cue, canShoot())
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frameId)
      cleanup()
    }
  }, [])

  return (
    <div className='pool-game-container'>
      <h3 className='game-title'>8-Ball Pool</h3>
      <canvas ref={canvasRef} id='canvas' width={TABLE_WIDTH} height={TABLE_HEIGHT}></canvas>
      <p className='pool-instructions'>Aim with the mouse, then click and drag back to set power. Release to shoot.</p>
    </div>
  )
}

export default Pool
