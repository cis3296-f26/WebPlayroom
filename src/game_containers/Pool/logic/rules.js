// 8-ball rules. These functions never touch the canvas or the physics: they take what
// happened during a shot (as ball numbers) and return the new game state. That keeps
// the rules easy to read and easy to test.
//
// Ball numbers: 0 = cue ball, 1-7 = solids, 8 = eight ball, 9-15 = stripes.

const GROUP_NAMES = { solid: 'solids (1–7)', stripe: 'stripes (9–15)' }

export function groupOf (number) {
  if (number === 0) return 'cue'
  if (number === 8) return 'eight'
  return number < 8 ? 'solid' : 'stripe'
}

function otherPlayer (player) {
  return player === 1 ? 2 : 1
}

function otherGroup (group) {
  return group === 'solid' ? 'stripe' : 'solid'
}

// A fresh game: player 1 breaks and nobody has a group yet ("open table")
export function createGame (breaker = 1) {
  return {
    currentPlayer: breaker,
    groups: { 1: null, 2: null }, // 'solid' or 'stripe' once assigned
    isBreak: true,                // the next shot is the break
    // Where the current player may place the cue ball before shooting:
    //   'kitchen' - behind the head string (the break), 'table' - anywhere (after a foul),
    //   null      - nowhere, the cue ball stays where it is
    ballInHand: 'kitchen',
    winner: null,                 // 1 or 2 once the game is over
    rerack: false,                // true if the 8 went in on the break and the table must be reset
    message: `Player ${breaker} to break. You can drag the cue ball anywhere behind the line first.`
  }
}

// An empty record of a shot. Physics fills it in while the balls move.
export function createShotEvents () {
  return {
    firstHit: null, // number of the first ball the cue ball touched, or null if it hit nothing
    pocketed: []    // numbers of the balls that went in, in the order they dropped
  }
}

// Works out what a shot means once every ball has stopped.
//   game     - the state before the shot (from createGame or a previous evaluateShot)
//   shot     - { firstHit, pocketed } as ball numbers
//   onTable  - numbers of the balls still on the table after the shot
// Returns a new game state; the old one is not changed.
export function evaluateShot (game, shot, onTable) {
  const player = game.currentPlayer
  const opponent = otherPlayer(player)
  const myGroup = game.groups[player]

  const scratched = shot.pocketed.includes(0)
  const eightIn = shot.pocketed.includes(8)
  const objectBallsIn = shot.pocketed.filter(n => n !== 0 && n !== 8)

  // "On the 8": the player had already cleared their group before this shot
  const onTableBefore = [...onTable, ...shot.pocketed.filter(n => n !== 0)]
  const onTheEight = myGroup !== null && !onTableBefore.some(n => groupOf(n) === myGroup)

  const foul = findFoul(game, shot, myGroup, onTheEight, scratched)

  const next = { ...game, groups: { ...game.groups }, isBreak: false, ballInHand: null, rerack: false }

  // --- The 8 ball decides the game (or forces a re-rack on the break) ---
  if (eightIn) {
    if (game.isBreak) {
      return { ...createGame(player), rerack: true, message: `The 8 went in on the break. Re-rack: Player ${player} breaks again.` }
    }
    if (onTheEight && !foul) {
      return { ...next, winner: player, message: `Player ${player} sinks the 8 and wins!` }
    }
    const reason = foul ? `fouled (${foul}) while sinking the 8` : 'sank the 8 too early'
    return { ...next, winner: opponent, message: `Player ${player} ${reason}. Player ${opponent} wins!` }
  }

  // --- Fouls: turn passes and the opponent gets ball in hand ---
  if (foul) {
    return {
      ...next,
      currentPlayer: opponent,
      ballInHand: 'table',
      message: `Foul: ${foul}. Player ${opponent} has ball in hand: drag the cue ball anywhere, then shoot.`
    }
  }

  // --- The break: the table stays open; the breaker continues if anything went in ---
  if (game.isBreak) {
    if (objectBallsIn.length > 0) {
      return { ...next, message: `Good break! The table is open. Player ${player} shoots again.` }
    }
    return { ...next, currentPlayer: opponent, message: `Nothing went in on the break. Player ${opponent}'s turn. The table is open.` }
  }

  // --- Open table: the first ball that drops picks this player's group ---
  let assignedMessage = ''
  if (myGroup === null && objectBallsIn.length > 0) {
    const group = groupOf(objectBallsIn[0])
    next.groups[player] = group
    next.groups[opponent] = otherGroup(group)
    assignedMessage = `Player ${player} is ${GROUP_NAMES[group]}. `
  }

  // --- Keep shooting only if one of your own balls went in ---
  const myGroupNow = next.groups[player]
  const sankOwnBall = objectBallsIn.some(n => groupOf(n) === myGroupNow)
  if (sankOwnBall) {
    return { ...next, message: `${assignedMessage}Player ${player} shoots again.` }
  }

  const tableNote = next.groups[opponent] === null ? ' The table is open.' : ''
  return { ...next, currentPlayer: opponent, message: `Player ${opponent}'s turn.${tableNote}` }
}

// Returns a short description of the foul, or null if the shot was legal
function findFoul (game, shot, myGroup, onTheEight, scratched) {
  if (scratched) return 'scratch'
  if (shot.firstHit === null) return 'the cue ball didn’t hit any ball'
  if (game.isBreak) return null // any ball may be hit first on the break

  const firstGroup = groupOf(shot.firstHit)
  if (myGroup === null) {
    return firstGroup === 'eight' ? 'hit the 8 first on an open table' : null
  }
  if (onTheEight) {
    return firstGroup === 'eight' ? null : 'must hit the 8 first'
  }
  if (firstGroup === 'eight') return 'hit the 8 first'
  if (firstGroup !== myGroup) return 'hit the other player’s ball first'
  return null
}
