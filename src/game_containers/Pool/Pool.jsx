import { useRef, useEffect } from 'react'
import './Pool.css'
import { drawFrame } from './logic/render'
import { applyInput, updateBall, handleCollisions } from './logic/physics'
import { setupKeyboard } from './logic/input'
//import Ball from './logic/Ball';
import { createStartingLineup } from './logic/startingLineup'
import {
  TABLE_WIDTH,
  TABLE_HEIGHT
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
    const loop = () => {
      applyInput(cueBall, keys)              // only the white ball is player-controlled
      for (const b of balls) updateBall(b) // every ball gets friction + movement
      handleCollisions(balls)
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
