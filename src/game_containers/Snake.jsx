import { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'

//constants
const GRID_SIZE = 24
const TIME_ATTACK_DURATION = 60

const GAME_OVER_MESSAGES = {
  wall: 'You hit a wall',
  self: 'You hit yourself',
  obstacle: 'You hit an obstacle',
  win: 'You filled the whole board!',
  time: 'Time is up!',
}

const GAME_MODES = {
  classic: { label: 'Classic' },
  timeAttack: { label: 'Timed' },
}

const BOARD_SIZES = {
  small: {label: 'Small', cols: 10, obstacleCount: 4},
  medium: {label: 'Medium', cols: 14, obstacleCount: 6},
  large: {label: 'Large', cols: 20, obstacleCount: 9},
}

const STEP_SIZES = {
  slow: {label: 'Slow', stepMillis: 200},
  normal: {label: 'Normal', stepMillis: 150},
  fast: {label: 'Fast', stepMillis: 100},
}


const Snake = () => {
  const containerRef = useRef(null)
  const gameStartedRef = useRef(false) // Ref to track if the game has started

  const [score, setScore] = useState(0)
  const [gameOverReason, setGameOverReason] = useState(null)
  const [gameKey, setGameKey] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameMode, setGameMode] = useState('classic')
  const [timeLeft, setTimeLeft] = useState(TIME_ATTACK_DURATION)
  const [boardSize, setBoardSize] = useState('medium')
  const [stepSize, setStepSize] = useState('normal')
  const [obstaclesOn, setObstaclesOn] = useState(false)

  const cols = BOARD_SIZES[boardSize].cols
  const boardPixelSize = cols * GRID_SIZE
  const stepMillis = STEP_SIZES[stepSize].stepMillis
  const obstacleCount = BOARD_SIZES[boardSize].obstacleCount

  useEffect(() => {
    let app
    let isDestroyed = false

    const initializePixi = async () => {
      app = new PIXI.Application()
      
      await app.init({
        width: boardPixelSize,
        height: boardPixelSize,
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

      const obstacleBody = new PIXI.Graphics()
      obstacleBody //block
        .roundRect(1, 1, GRID_SIZE - 2, GRID_SIZE - 2, 4)
        .fill(0x475569)
      obstacleBody //block stripe
        .rect(1, 1, GRID_SIZE - 2, 5)
        .fill({ color: 0xfbbf24, alpha: 0.85 })
      const obstacleRender = app.renderer.generateTexture(obstacleBody)

      if (isDestroyed) return

      let snake = []
      let food
      let direction = { x: 1, y: 0 }
      let nextDirection = { x: 1, y: 0 }
      const gridSize = GRID_SIZE
      let timeElapsed = 0
      let timerElapsed = 0
      let timeRemaining = TIME_ATTACK_DURATION
      let gameOver = false

      const startX = Math.floor(cols / 2) * gridSize
      const startY = Math.floor(cols / 2) * gridSize

      //Create obstacle sprites and positions
      const obstaclePositions = []
      const obstacleSprites = []
      const obstacleTotal = obstaclesOn ? obstacleCount : 0
      for (let i = 0; i < obstacleTotal; i++) {
        const block = new PIXI.Sprite(obstacleRender)
        block.anchor.set(0.5)
        block.width = gridSize
        block.height = gridSize
        obstacleSprites.push(block)
        obstaclePositions.push({ x: 0, y: 0 }) // real position set by placeObstacles() below
      }

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

        // Ensure food doesn't spawn on the snake or on an obstacle
        do {
          foodX = Math.floor(Math.random() * cols) * gridSize
          foodY = Math.floor(Math.random() * cols) * gridSize
          occupied =
            snake.some(segment =>
              Math.floor((segment.x - gridSize / 2) / gridSize) === foodX / gridSize &&
              Math.floor((segment.y - gridSize / 2) / gridSize) === foodY / gridSize
            ) ||
            obstaclePositions.some((o) => o.x === foodX && o.y === foodY)
        } while (occupied)

        food.x = foodX + gridSize / 2
        food.y = foodY + gridSize / 2
      }

      // Moves every obstacle to a new random cell, avoiding the snake's body and the food. 
      const placeObstacles = () => {
        const usedCells = new Set()
        snake.forEach((segment) => {
          const gx = Math.round((segment.x - gridSize / 2) / gridSize)
          const gy = Math.round((segment.y - gridSize / 2) / gridSize)
          usedCells.add(`${gx},${gy}`)
        })
        const foodGX = Math.round((food.x - gridSize / 2) / gridSize)
        const foodGY = Math.round((food.y - gridSize / 2) / gridSize)
        usedCells.add(`${foodGX},${foodGY}`)

        obstaclePositions.forEach((pos, i) => {
          let gx
          let gy
          let attempts = 0
          do {
            gx = Math.floor(Math.random() * cols)
            gy = Math.floor(Math.random() * cols)
            attempts++
          } while (usedCells.has(`${gx},${gy}`) && attempts < 200)

          usedCells.add(`${gx},${gy}`)
          pos.x = gx * gridSize
          pos.y = gy * gridSize
          obstacleSprites[i].x = pos.x + gridSize / 2
          obstacleSprites[i].y = pos.y + gridSize / 2
        })
      }

      placeFood()
      app.stage.addChild(food)

      obstacleSprites.forEach((block) => app.stage.addChild(block))
      placeObstacles()

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

        // Time Attack countdown
        if (gameMode === 'timeAttack') {
          timerElapsed += ticker.deltaMS

          while (timerElapsed >= 1000 && timeRemaining > 0) {
            timerElapsed -= 1000
            timeRemaining--
            setTimeLeft(timeRemaining)
          }

          if (timeRemaining <= 0) {
            gameOver = true
            setGameOverReason('time')
            return
          }
        }

        timeElapsed += ticker.deltaMS

        if (timeElapsed >= stepMillis) {
          timeElapsed -= stepMillis
          direction = nextDirection

          const headX = snake[0].x - gridSize / 2 + (direction.x * gridSize)
          const headY = snake[0].y - gridSize / 2 + (direction.y * gridSize)

          if (headX < 0 || headX >= boardPixelSize || headY < 0 || headY >= boardPixelSize) {
            gameOver = true
            setGameOverReason('wall')
            return
          }

          if (obstaclePositions.some((o) => o.x === headX && o.y === headY)) {
            gameOver = true
            setGameOverReason('obstacle')
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
            if(snake.length == cols * cols) {
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
  }, [gameKey, cols, boardPixelSize, stepMillis, obstaclesOn, obstacleCount, gameMode]) //Makes sure the game resets when the board size, step size, or obstacles setting changes

  const restart = () => {
    gameStartedRef.current = false
    setGameStarted(false)
    setScore(0)
    setTimeLeft(TIME_ATTACK_DURATION)
    setGameOverReason(null)
    setGameKey(prev => prev + 1)
  }

  return (
    <div className="snake-game-container">
      <h3>Snake</h3>
      <p className="snake-score">Score: {score}</p>
      {gameMode === 'timeAttack' && (
        <p className="snake-timer">Time: {timeLeft}s</p>
      )}

      <div className="snake-board">
        <div ref={containerRef}></div>

        {!gameStarted && !gameOverReason && (
          <div className="snake-overlay">
            <div className="snake-settings">
              <p>Game Mode:</p>
              <div className="snake-options">
                {Object.entries(GAME_MODES).map(([key, opt]) => (
                  <button
                    key={key}
                    className={`game-button ${gameMode === key ? 'selected' : ''}`}
                    onClick={() => setGameMode(key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p>Board Size:</p>
              <div className="snake-options">
                {Object.entries(BOARD_SIZES).map(([key, opt]) => (
                  <button
                    key={key}
                    className={`game-button ${boardSize === key ? 'selected' : ''}`}
                    onClick={() => setBoardSize(key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <p>Speed:</p>
              <div className="snake-options">
                {Object.entries(STEP_SIZES).map(([key, opt]) => (
                  <button
                    key={key}
                    className={`game-button ${stepSize === key ? 'selected' : ''}`}
                    onClick={() => setStepSize(key)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <p>Obstacles:</p>
              <div className="snake-options">
                <button
                  className={`game-button ${!obstaclesOn ? 'selected' : ''}`}
                  onClick={() => setObstaclesOn(false)}
                >
                  Off
                </button>
                <button
                  className={`game-button ${obstaclesOn ? 'selected' : ''}`}
                  onClick={() => setObstaclesOn(true)}
                >
                  On
                </button>
              </div>
            </div>
          <p>Press Space to Start</p>
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