import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import snakeImage from '../assets/snake-item.png'

const Snake = () => {
  const gameRef = useRef(null)

  useEffect(() => {
    let renderer = PIXI.autoDetectRenderer({
      width: 512,
      height: 512,
      antialias: false,
      transparent: false,
      resolution: 1,
      backgroundColor: 0x1e293b
    })

    gameRef.current.appendChild(renderer.view)

    let stage = new PIXI.Container()

    let snake = []
    let food
    let direction = { x: 1, y: 0 }
    let nextDirection = { x: 1, y: 0 }
    let gridSize = 16
    let speed = 8
    let frameCount = 0
    let gameOver = false
    let animationId

    const texture = PIXI.Texture.from(snakeImage)

    function setup() {
      let startX = Math.floor((renderer.width / 2) / gridSize) * gridSize
      let startY = Math.floor((renderer.height / 2) / gridSize) * gridSize

      for (let i = 0; i < 3; i++) {
        let segment = new PIXI.Sprite(texture)
        segment.width = gridSize
        segment.height = gridSize
        segment.x = startX - (i * gridSize)
        segment.y = startY

        snake.push(segment)
        stage.addChild(segment)
      }

      food = new PIXI.Sprite(texture)
      food.width = gridSize
      food.height = gridSize
      food.tint = 0xf43f5e
      placeFood()
      stage.addChild(food)

      window.addEventListener('keydown', handleInput)
      gameLoop()
    }

    function handleInput(e) {
      if (e.key.startsWith('Arrow')) e.preventDefault()
      if (e.key === 'ArrowUp' && direction.y === 0) nextDirection = { x: 0, y: -1 }
      if (e.key === 'ArrowDown' && direction.y === 0) nextDirection = { x: 0, y: 1 }
      if (e.key === 'ArrowLeft' && direction.x === 0) nextDirection = { x: -1, y: 0 }
      if (e.key === 'ArrowRight' && direction.x === 0) nextDirection = { x: 1, y: 0 }
    }

    function placeFood() {
      let maxCols = renderer.width / gridSize
      let maxRows = renderer.height / gridSize
      food.x = Math.floor(Math.random() * maxCols) * gridSize
      food.y = Math.floor(Math.random() * maxRows) * gridSize
    }

    function gameLoop() {
      animationId = requestAnimationFrame(gameLoop)
      if (gameOver) return

      frameCount++

      if (frameCount >= speed) {
        frameCount = 0
        direction = nextDirection

        let headX = snake[0].x + (direction.x * gridSize)
        let headY = snake[0].y + (direction.y * gridSize)

        if (headX < 0 || headX >= renderer.width || headY < 0 || headY >= renderer.height) {
          gameOver = true
          alert("Game Over! You hit a wall. Leave this page and come back to restart.")
          return
        }

        for (let i = 0; i < snake.length; i++) {
          if (snake[i].x === headX && snake[i].y === headY) {
            gameOver = true
            alert("Game Over! You bit your own tail. Leave this page and come back to restart.")
            return
          }
        }

        for (let i = snake.length - 1; i > 0; i--) {
          snake[i].x = snake[i - 1].x
          snake[i].y = snake[i - 1].y
        }

        snake[0].x = headX
        snake[0].y = headY

        if (headX === food.x && headY === food.y) {
          let tail = new PIXI.Sprite(texture)
          tail.width = gridSize
          tail.height = gridSize
          tail.x = -gridSize
          tail.y = -gridSize

          snake.push(tail)
          stage.addChild(tail)

          placeFood()
        }
      }

      renderer.render(stage)
    }

    setup()

    // Stop the game and free Pixi when leaving the /snake page
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('keydown', handleInput)
      stage.destroy({ children: true })
      renderer.destroy(true)
    }
  }, [])

  return (
    <div className="snake-game-container" style={{ background: '#57997a', color: 'white' }}>
      <h3>Snake</h3>
      <div className="snake-board" ref={gameRef}></div>
    </div>
  )
}

export default Snake