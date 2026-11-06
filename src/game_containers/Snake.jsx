import { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import snakeImage from '../assets/snake-item.png'

const GAME_OVER_MESSAGES = {
  wall: 'You hit a wall',
  self: 'You hit yourself',
  win: 'You filled the whole board!',
}

const Snake = () => {
  const containerRef = useRef(null)
  
  const [score, setScore] = useState(0)
  const [gameOverReason, setGameOverReason] = useState(null)
  const [gameKey, setGameKey] = useState(0) 

  useEffect(() => {
    let app
    let isDestroyed = false

    const initializePixi = async () => {
      app = new PIXI.Application()
      
      await app.init({
        width: 512,
        height: 512,
        antialias: false,
        backgroundColor: 0x1e293b
      })

      if (isDestroyed) {
        app.destroy({ removeView: true })
        return
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(app.canvas)
      }

      const texture = await PIXI.Assets.load(snakeImage)

      if (isDestroyed) return

      let snake = []
      let food
      let direction = { x: 1, y: 0 }
      let nextDirection = { x: 1, y: 0 }
      const gridSize = 24
      const speed = 15
      let frameCount = 0
      let gameOver = false

      const startX = Math.floor((app.screen.width / 2) / gridSize) * gridSize
      const startY = Math.floor((app.screen.height / 2) / gridSize) * gridSize

      for (let i = 0; i < 3; i++) {
        const segment = new PIXI.Sprite(texture)
        segment.width = gridSize
        segment.height = gridSize
        segment.x = startX - (i * gridSize)
        segment.y = startY
        snake.push(segment)
        app.stage.addChild(segment)
      }

      food = new PIXI.Sprite(texture)
      food.width = gridSize
      food.height = gridSize
      food.tint = 0xf43f5e
      
      const placeFood = () => {
        const maxCols = app.screen.width / gridSize
        const maxRows = app.screen.height / gridSize
        food.x = Math.floor(Math.random() * maxCols) * gridSize
        food.y = Math.floor(Math.random() * maxRows) * gridSize
      }
      
      placeFood()
      app.stage.addChild(food)

      const handleInput = (e) => {
        if (e.key.startsWith('Arrow')) e.preventDefault()
        if (e.key === "ArrowUp" && direction.y === 0) nextDirection = { x: 0, y: -1 }
        if (e.key === "ArrowDown" && direction.y === 0) nextDirection = { x: 0, y: 1 }
        if (e.key === "ArrowLeft" && direction.x === 0) nextDirection = { x: -1, y: 0 }
        if (e.key === "ArrowRight" && direction.x === 0) nextDirection = { x: 1, y: 0 }
      }
      
      window.addEventListener("keydown", handleInput)

      const gameLoop = () => {
        if (gameOver) return
        frameCount++
        
        if (frameCount >= speed) {
          frameCount = 0
          direction = nextDirection

          const headX = snake[0].x + (direction.x * gridSize)
          const headY = snake[0].y + (direction.y * gridSize)

          if (headX < 0 || headX >= app.screen.width || headY < 0 || headY >= app.screen.height) {
            gameOver = true
            setGameOverReason('wall')
            return
          }

          for (let i = 0; i < snake.length; i++) {
            if (snake[i].x === headX && snake[i].y === headY) {
              gameOver = true
              setGameOverReason('self')
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
            const tail = new PIXI.Sprite(texture)
            tail.width = gridSize
            tail.height = gridSize
            tail.x = -gridSize
            tail.y = -gridSize
            snake.push(tail)
            app.stage.addChild(tail)
            placeFood()
            
            setScore(prevScore => prevScore + 1)
          }
        }
      }

      app.ticker.add(gameLoop)
      app.cleanupListeners = () => window.removeEventListener("keydown", handleInput)
    }

    initializePixi()

    return () => {
      isDestroyed = true
      if (app) {
        if (app.cleanupListeners) app.cleanupListeners()
        if (app.renderer) {
          app.destroy({ removeView: true })
        }
      }
    }
  }, [gameKey])

  const restart = () => {
    setScore(0)
    setGameOverReason(null)
    setGameKey(prev => prev + 1)
  }

  return (
    <div className="snake-game-container">
      <h3>Snake</h3>
      <p className="snake-score">Score: {score}</p>
      
      <div className="snake-board" ref={containerRef}>
        {gameOverReason && (
          <div className="snake-overlay">
            <p>Game Over!</p>
            <p>{GAME_OVER_MESSAGES[gameOverReason]}</p>
            <button className="game-button" onClick={restart}>
              Play again
            </button>
          </div>
        )}
      </div>
      
      <p className="snake-help">Use the arrow keys to move.</p>
    </div>
  )
}

export default Snake