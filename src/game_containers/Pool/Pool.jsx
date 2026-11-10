import { useRef, useEffect } from 'react'
import './Pool.css'
import { drawFrame } from './logic/render'
import { stepPhysics } from './logic/physics'
import { setupKeyboard } from './logic/input'
//import Ball from './logic/Ball';
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
    canvas.focus()

    const { keys, cleanup } = setupKeyboard(canvas);

    const balls = createStartingLineup();
    const cueBall = balls[0];

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
        stepPhysics(balls, cueBall, keys)
        accumulator -= STEP_MS
      }

      drawFrame(ctx, balls)
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
      <canvas ref={canvasRef} tabIndex={0} id='canvas' width={TABLE_WIDTH} height={TABLE_HEIGHT}></canvas>
    </div>
  )
}

export default Pool
