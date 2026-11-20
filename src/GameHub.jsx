import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

function GameHub({ connect4Theme = false, poolTheme = false }) {
  const board = useRef(null)
  const drag = useRef(null)

  useLayoutEffect(() => {
    const view = board.current
    view.scrollLeft = view.clientWidth
    view.scrollTop = view.clientHeight

    if (connect4Theme) {
      const colors = ['#ed3434', '#ffda35']
      const dots = []
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const color = colors[Math.floor(Math.random() * 2)]
          dots.push(`radial-gradient(circle at ${col * 40 + 20}px ${row * 40 + 20}px, ${color} 8px, transparent 9px)`)
        }
      }
      view.querySelector('.hub-links').style.backgroundImage = dots.join(',')
      view.querySelectorAll('.game-button').forEach(button => {
        button.style.backgroundColor = colors[Math.floor(Math.random() * 2)]
      })
    }

    if (poolTheme) {
      const canvas = document.createElement('canvas')
      canvas.width = 1000
      canvas.height = 800
      const ctx = canvas.getContext('2d')
      const colors = ['#f5ce25', '#2456cd', '#dc3030', '#8136a6', '#f18b22', '#198547', '#8b2538', '#111']
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = 'bold 13px Arial'
      const balls = [[8, 110, 130], [10, 480, 90], [5, 860, 180], [1, 250, 420], [12, 690, 390], [9, 100, 690], [3, 490, 680], [14, 880, 650]]

      for (const [number, x, y] of balls) {
        ctx.save()
        ctx.shadowColor = '#001e16'
        ctx.shadowBlur = 14
        ctx.shadowOffsetY = 7
        ctx.beginPath()
        ctx.arc(x, y, 24, 0, Math.PI * 2)
        ctx.fillStyle = number > 8 ? 'white' : colors[(number - 1) % 8]
        ctx.fill()
        ctx.shadowColor = 'transparent'
        ctx.clip()
        if (number > 8) {
          ctx.fillStyle = colors[number - 9]
          ctx.fillRect(x - 24, y - 12, 48, 24)
        }
        const shine = ctx.createRadialGradient(x - 10, y - 12, 2, x, y, 25)
        shine.addColorStop(0, '#ffffff99')
        shine.addColorStop(0.45, '#ffffff00')
        shine.addColorStop(1, '#00000066')
        ctx.fillStyle = shine
        ctx.fillRect(x - 24, y - 24, 48, 48)
        ctx.beginPath()
        ctx.arc(x, y, 9, 0, Math.PI * 2)
        ctx.fillStyle = '#fffdf2'
        ctx.fill()
        ctx.fillStyle = 'black'
        ctx.fillText(number, x, y)
        ctx.restore()
      }
      view.querySelector('.hub-links').style.backgroundImage = `url(${canvas.toDataURL()}), radial-gradient(ellipse, #1b604b, #103c31)`
    }
  }, [connect4Theme, poolTheme])

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
      className={'game-container' + (connect4Theme ? ' connect4-theme' : '') + (poolTheme ? ' pool-theme' : '')}
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
