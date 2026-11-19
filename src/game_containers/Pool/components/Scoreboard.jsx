import { BALL_COLORS } from '../logic/startingLineup'
import { groupOf } from '../logic/rules'

const GROUP_BALLS = {
  solid: [1, 2, 3, 4, 5, 6, 7],
  stripe: [9, 10, 11, 12, 13, 14, 15]
}

const GROUP_LABELS = {
  solid: 'Solids 1–7',
  stripe: 'Stripes 9–15'
}

// A small numbered ball. Sunk balls are faded so you can see what each player has left.
function BallIcon ({ number, sunk = false }) {
  const type = groupOf(number) // 'solid', 'stripe' or 'eight'
  return (
    <span
      className={`pool-ball-icon ${type}${sunk ? ' sunk' : ''}`}
      style={{ '--ball-color': BALL_COLORS[number - 1] }}
      aria-label={`${number} ball${sunk ? ', sunk' : ''}`}
    >
      {number}
    </span>
  )
}

// One player's side of the scoreboard
function PlayerPanel ({ player, game, pocketed }) {
  const group = game.groups[player]
  const isTurn = game.winner === null && game.currentPlayer === player
  const isWinner = game.winner === player
  const groupBalls = group ? GROUP_BALLS[group] : []
  const onTheEight = group !== null && groupBalls.every(n => pocketed.includes(n))

  return (
    <section
      className={`pool-player${isTurn ? ' current' : ''}${isWinner ? ' winner' : ''}`}
      aria-label={`Player ${player}`}
      aria-current={isTurn ? 'true' : undefined}
    >
      <div className='pool-player-header'>
        <span className='pool-player-name'>{isTurn && '▶ '}Player {player}</span>
        <span className='pool-player-group'>{group ? GROUP_LABELS[group] : 'Table open'}</span>
      </div>

      <div className='pool-player-balls'>
        {group === null && <span className='pool-no-group'>Sink a ball to claim solids or stripes</span>}
        {onTheEight
          ? <><span className='pool-on-eight'>On the 8</span><BallIcon number={8} sunk={pocketed.includes(8)} /></>
          : groupBalls.map(n => <BallIcon key={n} number={n} sunk={pocketed.includes(n)} />)}
      </div>

      <div className='pool-player-badge'>
        {isWinner && 'Winner!'}
        {isTurn && game.ballInHand !== null && 'Ball in hand'}
      </div>
    </section>
  )
}

// Both players' panels side by side.
//   game     - the rules state from rules.js (whose turn, groups, ball in hand, winner)
//   pocketed - numbers of the object balls that have gone in this game
export default function Scoreboard ({ game, pocketed }) {
  return (
    <div className='pool-scoreboard'>
      <PlayerPanel player={1} game={game} pocketed={pocketed} />
      <PlayerPanel player={2} game={game} pocketed={pocketed} />
    </div>
  )
}
