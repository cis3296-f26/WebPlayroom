import { useRef, useEffect, useState } from 'react'
import './Pool.css'
import { drawFrame } from './logic/render'
import { stepPhysics, shoot, allBallsStopped, respotCueBall, isValidCueSpot } from './logic/physics'
import { setupCueControls } from './logic/input'
import { createStartingLineup, resetToStartingLineup } from './logic/startingLineup'
import { createGame, createShotEvents, evaluateShot } from './logic/rules'
import Scoreboard from './components/Scoreboard'
import WinOverlay from './components/WinOverlay'
import {
  TABLE_WIDTH,
  TABLE_HEIGHT,
  STEP_MS,
  MAX_FRAME_MS
} from './constants'

const Pool = () => {
  const canvasRef = useRef(null) 
  const [pocketed, setPocketed] = useState([]) // numbers of the object balls that have gone in, for the scoreboard
  const [game, setGame] = useState(createGame) // copy of the rules state for the page to display
  const [gameId, setGameId] = useState(0)      // bumping this restarts the game (see the effect below)

  // New game / Play again: reset the page's copies of the state and bump gameId. Because
  // gameId is in the effect's dependency list, React cleans up the old game loop and runs
  // the effect again, which builds fresh balls and a fresh game.
  const restart = () => {
    setGame(createGame())
    setPocketed([])
    setGameId(id => id + 1)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return // no canvas support (e.g. the jsdom test environment), so skip the game loop

    const balls = createStartingLineup();
    const cueBall = balls[0];

    let gameState = createGame() // rules state: whose turn, groups, winner (see rules.js)
    let shot = null              // what happened during the current shot; null between shots

    const canShoot = () =>
      allBallsStopped(balls) && !cueBall.pocketed && shot === null && gameState.winner === null

    const { cue, cleanup } = setupCueControls(canvas, cueBall, {
      canShoot,
      onShoot: (direction, power) => {
        shot = createShotEvents() // start recording this shot
        gameState = { ...gameState, ballInHand: null } // ball in hand ends once you shoot
        shoot(cueBall, direction, power)
      },
      ballInHand: () => gameState.ballInHand,
      isValidSpot: (pos) => isValidCueSpot(pos, cueBall, balls, gameState.ballInHand)
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
        const pocketedNow = stepPhysics(balls, shot)
        accumulator -= STEP_MS

        // Only update React state when something actually went in (not every step)
        const objectBalls = pocketedNow.filter(b => b !== cueBall)
        if (objectBalls.length > 0) {
          setPocketed(prev => [...prev, ...objectBalls.map(b => b.number)])
        }
      }

      // Once every ball has stopped, let the rules judge the shot
      if (shot !== null && allBallsStopped(balls)) {
        const onTable = balls.filter(b => !b.pocketed).map(b => b.number)
        gameState = evaluateShot(gameState, shot, onTable)
        shot = null

        if (gameState.rerack) { // the 8 went in on the break
          resetToStartingLineup(balls)
          setPocketed([])
        }
        setGame(gameState) // only now, after a shot, does React re-render
      }

      // Scratch: once everything stops, the cue ball comes back to its starting spot.
      // The rules have already given the next player ball in hand, so they can move it from there.
      if (cueBall.pocketed && allBallsStopped(balls)) respotCueBall(cueBall, balls)

      drawFrame(ctx, balls, cueBall, cue, canShoot(), gameState.ballInHand)
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frameId)
      cleanup()
    }
  }, [gameId])

  return (
    <div className='pool-game-container'>
      <h3 className='game-title'>8-Ball Pool</h3>
      <Scoreboard game={game} pocketed={pocketed} />
      <p className='pool-status' role='status'>{game.message}</p>

      {/* The wrapper lets the win screen sit on top of the canvas */}
      <div className='pool-table'>
        <canvas ref={canvasRef} id='canvas' width={TABLE_WIDTH} height={TABLE_HEIGHT}></canvas>
        {game.winner !== null && (
          <WinOverlay winner={game.winner} message={game.message} onPlayAgain={restart} />
        )}
      </div>

      <div className='pool-controls'>
        <p className='pool-instructions'>
          Aim with the mouse, then click and drag back to set power. Release to shoot.
          When the cue ball glows, you can drag it to move it.
        </p>
        <button className='game-button' onClick={restart}>New game</button>
      </div>
    </div>
  )
}

export default Pool
