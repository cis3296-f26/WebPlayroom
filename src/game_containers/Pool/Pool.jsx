import { useRef, useEffect } from 'react'
import './Pool.css'
import { drawFrame } from './logic/render'
import { moveBall } from './logic/physics'
import { setupKeyboard } from './logic/input'
import Ball from './logic/Ball';
import {
  BALL_START_X,
  BALL_START_Y,
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

    const ball = new Ball(BALL_START_X, BALL_START_Y, 'white');
    const ball2 = new Ball(150, 150, 'blue');
    const { keys, cleanup } = setupKeyboard(canvas);

    const balls = [ball, ball2]

    let frameId
    const loop = () => {
      moveBall(ball, keys)
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
