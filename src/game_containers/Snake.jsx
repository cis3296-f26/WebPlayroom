
import { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'

//constants
const GRID_SIZE = 24
const COLS = 20
const BOARD_SIZE = COLS * GRID_SIZE
const STEP_MILLIS = 150 // time between snake moves in milliseconds

const GAME_OVER_MESSAGES = {
  wall: 'You hit a wall',
  self: 'You hit yourself',
  win: 'You filled the whole board!',
}

const Snake = () => {
  const containerRef = useRef(null)
  const gameStartedRef = useRef(false) // Ref to track if the game has started

  const [score, setScore] = useState(0)
  const [gameOverReason, setGameOverReason] = useState(null)
  const [gameKey, setGameKey] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)

  useEffect(() => {
    let app
    let isDestroyed = false

    const initializePixi = async () => {
      app = new PIXI.Application()

      await app.init({
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        antialias: true,
        backgroundColor: 0x1e293b,
      })

      if (isDestroyed) {
        app.destroy({ removeView: true })
        return
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = ''
        containerRef.current.appendChild(app.canvas)
      }

      const snakeBody = new PIXI.Graphics()
      snakeBody
        .roundRect(2, 2, GRID_SIZE - 4, GRID_SIZE - 4, 9)
        .fill(0x22c55e)
      snakeBody
        .roundRect(5, 4, GRID_SIZE - 10, 5, 3)
        .fill({ color: 0x86efac, alpha: 0.8 })
      const snakeRender = app.renderer.generateTexture(snakeBody)

      const snakeHead = new PIXI.Graphics()
      //head shape
      snakeHead
        .roundRect(1, 1, GRID_SIZE - 2, GRID_SIZE - 2, 10)
        .fill(0x16a34a)
      
      //eyes
      snakeHead 
        .circle(12, 7, 4)
        .fill(0xffffff)
      snakeHead
        .circle(12, 17, 4)
        .fill(0xffffff)

      //pupils
      snakeHead 
        .circle(13, 7, 2)
        .fill(0x172554)
      snakeHead
        .circle(13, 17, 2)
        .fill(0x172554)
      const headRender = app.renderer.generateTexture(snakeHead)

      const foodBody = new PIXI.Graphics()
      foodBody //apple shape
        .circle(12, 14, 8)
        .fill(0xef4444)
      foodBody //stem
        .roundRect(11, 2, 3, 7, 2)
        .fill(0x854d0e)
      foodBody //leaf
        .ellipse(17, 5, 5, 2.5)
        .fill(0x4ade80)
      const foodRender = app.renderer.generateTexture(foodBody)

      if (isDestroyed) return

      let snake = []
      let food
      let direction = { x: 1, y: 0 }
      let nextDirection = { x: 1, y: 0 }
      const gridSize = GRID_SIZE
      let timeElapsed = 0
      let gameOver = false

      const startX = Math.floor(COLS / 2) * gridSize
      const startY = Math.floor(COLS / 2) * gridSize

      for (let i = 0; i < 3; i++) {
        const segment = new PIXI.Sprite(snakeRender)
        if (i === 0) { // make the first segment the head
          segment.texture = headRender
        }       
        segment.anchor.set(0.5)
        segment.width = gridSize
        segment.height = gridSize
        segment.x = startX - (i * gridSize) + gridSize / 2
        segment.y = startY + gridSize / 2
        if (i === 0) segment.rotation = 0
        snake.push(segment)
        app.stage.addChild(segment)
      }

      food = new PIXI.Sprite(foodRender)
      food.width = gridSize
      food.height = gridSize
      food.anchor.set(0.5)

      const placeFood = () => {
        let foodX
        let foodY
        let occupied

        // Ensure food doesn't spawn on the snake
        do {
          foodX = Math.floor(Math.random() * COLS) * gridSize
          foodY = Math.floor(Math.random() * COLS) * gridSize
          occupied = snake.some(segment =>
            Math.floor((segment.x - gridSize / 2) / gridSize) === foodX / gridSize &&
            Math.floor((segment.y - gridSize / 2) / gridSize) === foodY / gridSize
          )
        } while (occupied)

        food.x = foodX + gridSize / 2
        food.y = foodY + gridSize / 2
      }

      placeFood()
      app.stage.addChild(food)

      const handleInput = (e) => {
        if (e.code === "Space") {
          e.preventDefault()
          if (!gameStartedRef.current) {
            gameStartedRef.current = true
            setGameStarted(true)
          }
          return
        }

        if (e.key.startsWith('Arrow')) e.preventDefault()
        if (!gameStartedRef.current) return // Ignore inputs if game hasn't started

        if (e.key === "ArrowUp" && direction.y === 0) nextDirection = { x: 0, y: -1 }
        if (e.key === "ArrowDown" && direction.y === 0) nextDirection = { x: 0, y: 1 }
        if (e.key === "ArrowLeft" && direction.x === 0) nextDirection = { x: -1, y: 0 }
        if (e.key === "ArrowRight" && direction.x === 0) nextDirection = { x: 1, y: 0 }
      }

      window.addEventListener("keydown", handleInput)

      const gameLoop = (ticker) => {
        if (!gameStartedRef.current || gameOver) return
        timeElapsed += ticker.deltaMS

        if (timeElapsed >= STEP_MILLIS) {
          timeElapsed -= STEP_MILLIS
          direction = nextDirection

          const headX = snake[0].x - gridSize / 2 + (direction.x * gridSize)
          const headY = snake[0].y - gridSize / 2 + (direction.y * gridSize)

          if (headX < 0 || headX >= BOARD_SIZE || headY < 0 || headY >= BOARD_SIZE) {
            gameOver = true
            setGameOverReason('wall')
            return
          }

          const eating = headX === food.x - gridSize / 2 && headY === food.y - gridSize / 2

          for (let i = 0; i < snake.length - (eating ? 0 : 1); i++) {
            const segmentX = snake[i].x - gridSize / 2
            const segmentY = snake[i].y - gridSize / 2

            if (segmentX === headX && segmentY === headY) {
              gameOver = true
              setGameOverReason('self')
              return
            }
          }

          for (let i = snake.length - 1; i > 0; i--) {
            snake[i].x = snake[i - 1].x
            snake[i].y = snake[i - 1].y
          }

          snake[0].x = headX + gridSize / 2
          snake[0].y = headY + gridSize / 2
          snake[0].rotation = Math.atan2(direction.y, direction.x)

          if (eating) {
            const tail = new PIXI.Sprite(snakeRender)
            tail.anchor.set(0.5)
            tail.width = gridSize
            tail.height = gridSize
            tail.x = -gridSize
            tail.y = -gridSize
            snake.push(tail)
            app.stage.addChild(tail)

            //Check if snake has filled the whole board
            if(snake.length == COLS * COLS) {
              gameOver = true
              setGameOverReason('win')
              return
            }

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
    gameStartedRef.current = false
    setGameStarted(false)
    setScore(0)
    setGameOverReason(null)
    setGameKey(prev => prev + 1)
  }

  return (
    <div className="snake-game-container">
      <h3>Snake</h3>
      <p className="snake-score">Score: {score}</p>

      <div className="snake-board">
        <div ref={containerRef}></div>

        {!gameStarted && !gameOverReason && (
          <div className="snake-overlay">
            <p>Press the space bar to start</p>
          </div>
        )}

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
