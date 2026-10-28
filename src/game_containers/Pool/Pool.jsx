import { useRef, useEffect } from 'react'
import './Pool.css'
import { drawBall } from './logic/render'
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

    let x = BALL_START_X
    let y = BALL_START_Y

    let LEFT, UP, RIGHT, DOWN

    canvas.focus()
    canvas.addEventListener('keydown', function (event) {
      if (event.keyCode === 37) {
        LEFT = true
      }
      if (event.keyCode === 38) {
        DOWN = true
      }
      if (event.keyCode === 39) {
        RIGHT = true
      }
      if (event.keyCode === 40) {
        UP = true
      }
    })
    canvas.addEventListener('keyup', function (event) {
      if (event.keyCode === 37) {
        LEFT = false
      }
      if (event.keyCode === 38) {
        DOWN = false
      }
      if (event.keyCode === 39) {
        RIGHT = false
      }
      if (event.keyCode === 40) {
        UP = false
      }
    })

    function move () {
      if (LEFT) {
        x--
      }
      if (DOWN) {
        y--
      }
      if (RIGHT) {
        x++
      }
      if (UP) {
        y++
      }
    }

    function updateBall () {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight)
      move()
      drawBall(x, y, 'white', ctx)
      requestAnimationFrame(updateBall)
    }
    requestAnimationFrame(updateBall)

    const ctx = canvasRef.current.getContext('2d')
    const dpr = window.devicePixelRatio || 1

    ctx.scale(dpr, dpr)

    canvas.width = TABLE_WIDTH
    canvas.height = TABLE_HEIGHT
    canvas.style.width = `${TABLE_WIDTH}px`
    canvas.style.height = `${TABLE_HEIGHT}px`
  }, [])

  return (
    <div className='pool-game-container'>
      <h3 className='game-title'>8-Ball Pool</h3>
      <canvas ref={canvasRef} tabIndex={0} id='canvas'></canvas>
    </div>
  )
}

export default Pool
