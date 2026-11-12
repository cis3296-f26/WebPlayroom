import { useRef, useEffect, useState } from 'react'
import './Pool.css'
import { drawFrame } from './logic/render'
import { stepPhysics, shoot, allBallsStopped, respotCueBall } from './logic/physics'
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
  const [pocketedBalls, setPocketedBalls] = useState([]) // object balls that have gone in, for the tray

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return // no canvas support (e.g. the jsdom test environment), so skip the game loop

    const balls = createStartingLineup();
    const cueBall = balls[0];

    const canShoot = () => allBallsStopped(balls) && !cueBall.pocketed
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
        const pocketedNow = stepPhysics(balls)
        accumulator -= STEP_MS

        // Only update React state when something actually went in (not every step)
        const objectBalls = pocketedNow.filter(b => b !== cueBall)
        if (objectBalls.length > 0) {
          setPocketedBalls(prev => [...prev, ...objectBalls.map(b => ({ number: b.number, color: b.color, type: b.type }))])
        }
      }

      // Scratch: once everything stops, the cue ball comes back to its starting spot
      if (cueBall.pocketed && allBallsStopped(balls)) respotCueBall(cueBall, balls)

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
      <div className='pool-tray' aria-label='Pocketed balls'>
        <span>Pocketed:</span>
        {pocketedBalls.length === 0 && <span className='pool-tray-empty'>none yet</span>}
        {pocketedBalls.map(ball => (
          <span
            key={ball.number}
            className={`pool-tray-ball ${ball.type}`}
            style={{ '--ball-color': ball.color }}
          >
            {ball.number}
          </span>
        ))}
      </div>
      <p className='pool-instructions'>Aim with the mouse, then click and drag back to set power. Release to shoot.</p>
    </div>
  )
}

export default Pool
