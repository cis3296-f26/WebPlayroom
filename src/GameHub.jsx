import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

function GameHub() {
  const board = useRef(null)
  const drag = useRef(null)

  useLayoutEffect(() => {
    const view = board.current
    view.scrollLeft = view.clientWidth
    view.scrollTop = view.clientHeight
  }, [])

  function startDrag(event) {
    if (!event.isPrimary || event.button !== 0) return

    const view = event.currentTarget
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: view.scrollLeft,
      scrollTop: view.scrollTop,
      moved: false,
    }
    event.target.setPointerCapture?.(event.pointerId)
  }

  function moveDrag(event) {
    const start = drag.current
    if (!start || start.pointerId !== event.pointerId) return

    const moveX = event.clientX - start.startX
    const moveY = event.clientY - start.startY
    if (!start.moved && Math.hypot(moveX, moveY) < 5) return

    const view = event.currentTarget
    start.moved = true
    view.scrollLeft = start.scrollLeft - moveX
    view.scrollTop = start.scrollTop - moveY
  }

  return (
    <div
      className="game-container"
      ref={board}
      onPointerDown={startDrag}
      onPointerMove={moveDrag}
      onLostPointerCapture={event => {
        const start = drag.current
        if (start && start.pointerId === event.pointerId) {
          start.pointerId = null
        }
      }}
      onDragStart={event => event.preventDefault()}
      onClickCapture={event => {
        if (event.detail && drag.current && drag.current.moved) {
          event.preventDefault()
        }
      }}
    >
      <div className="hub-links">
        <div style={{ gridArea: '2 / 2' }}>
          <h2>WebPlayroom</h2>
          <p>Drag around and choose a game to play.</p>
        </div>
        <Link to="/snake" className="game-button" style={{ gridArea: '1 / 1' }}>Snake</Link>
        <Link to="/pool" className="game-button" style={{ gridArea: '1 / 3' }}>8-Ball Pool</Link>
        <Link to="/connect4" className="game-button" style={{ gridArea: '2 / 1' }}>Connect 4</Link>
        <Link to="/buckshotRouletteLitePlus" className="game-button" style={{ gridArea: '2 / 3' }}>Buckshot Roulette Lite Plus</Link>
        <Link to="/countryQuest" className="game-button" style={{ gridArea: '1 / 2' }}>Country Quest</Link>
      </div>
    </div>
  )
}

export default GameHub
