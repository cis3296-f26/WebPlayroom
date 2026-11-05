import { useBuckshotGame } from './Usebuckshotgame.js';

const name = (id) => (id === 'player' ? 'You' : 'Dealer');

// Turns raw log events into text. Presentation lives here, not in the game logic.
function formatEvent(e) {
    switch (e.type) {
        case 'GAME_START':  return 'Game started';
        case 'RELOAD':      return `Shotgun loaded: ${e.live} live, ${e.blank} blank`;
        case 'TURN_START':  return `${name(e.turn)} to move`;
        case 'SHOT_FIRED': {
            const self = e.by === e.target;
            const at = self ? (e.by === 'player' ? 'yourself' : 'itself') : name(e.target);
            return `${name(e.by)} shot ${at}: ${e.shell.toUpperCase()}`;
        }
        case 'DAMAGE':      return `${name(e.target)} took ${e.amount} damage (${e.health} HP left)`;
        case 'GAME_OVER':   return e.winner === 'player' ? 'You win!' : 'The dealer wins.';
        default:            return e.type;
    }
}

const BuckshotRouletteLitePlus = () => {
    const { events, state, shoot, newGame } = useBuckshotGame();
    const myTurn = state.turn === 'player' && !state.winner;

    return (
        <div className="buckshot-roulette-game-container" style={{ background: '#a56361', color: 'white', padding: 16 }}>
            <h3>Buckshot Roulette Lite Plus</h3>

            <p>
                You: {state.player.health}/{state.player.max} HP &nbsp;|&nbsp;
                Dealer: {state.dealer.health}/{state.dealer.max} HP &nbsp;|&nbsp;
                Shells left: {state.shells.live} live, {state.shells.blank} blank
            </p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
                <button disabled={!myTurn} onClick={() => shoot('self')}>Shoot yourself</button>
                <button disabled={!myTurn} onClick={() => shoot('dealer')}>Shoot dealer</button>
                {state.winner && <button onClick={newGame}>New game</button>}
            </div>

            <ol style={{ maxHeight: 260, overflowY: 'auto', margin: 0, paddingLeft: 24, textAlign: 'left' }}>
                {events.map((e) => <li key={e.id}>{formatEvent(e)}</li>)}
            </ol>
        </div>
    );
};

export default BuckshotRouletteLitePlus;