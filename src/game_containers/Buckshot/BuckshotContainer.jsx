import { useState, useRef, useEffect } from 'react';
import { useBuckshotGame } from './Usebuckshotgame.js';

const name = (id) => (id === 'player' ? 'You' : 'Dealer');
const them = (id) => (id === 'player' ? 'you' : 'the dealer');
const their = (id) => (id === 'player' ? 'your' : "the dealer's");

// Turns raw log events into text. Presentation lives here, not in the game logic.
// The game logs FACTS (including secrets like which shell a magnifying glass saw);
// deciding what the human is allowed to see happens here (see SHELL_REVEALED).
function formatEvent(e) {
    switch (e.type) {
        case 'GAME_START':       return 'Game started';
        case 'RELOAD':           return `Shotgun loaded: ${e.live} live, ${e.blank} blank`;
        case 'ITEMS_DEALT':      return `${name(e.target)} received: ${e.items.map((i) => i.name).join(', ')}`;
        case 'TURN_START':       return `${name(e.turn)} to move`;
        case 'TURN_SKIPPED':     return `${e.target === 'player' ? 'You are' : 'The dealer is'} handcuffed, turn skipped`;
        case 'SHOT_FIRED': {
            const self = e.by === e.target;
            const at = self ? (e.by === 'player' ? 'yourself' : 'itself') : name(e.target);
            return `${name(e.by)} shot ${at}: ${e.shell.toUpperCase()}`;
        }
        case 'DAMAGE':           return `${name(e.target)} took ${e.amount} damage (${e.health} HP left)`;
        case 'GAME_OVER':        return e.winner === 'player' ? 'You win!' : 'The dealer wins.';

        case 'ITEM_USED':        return `${name(e.by)} used ${e.itemName}`;
        case 'ACTION_REJECTED':  return `Can't use ${e.itemName}: ${e.reason}`;
        case 'ITEM_STOLEN':      return `${name(e.by)} stole ${e.itemName} from ${them(e.from)}`;
        case 'ITEM_DUPLICATED':  return `${name(e.by)} duplicated ${e.itemName}`;
        case 'SHELL_REVEALED':   // only the human's own peeks show the shell
            return e.by === 'player'
                ? `Shell #${e.position} is ${e.shell.toUpperCase()}`
                : `Dealer peeked at shell #${e.position}`;
        case 'POLARITY_REVERSED': return `${name(e.by)} reversed the polarity of the current shell`;
        case 'SHELL_EJECTED':    return `A ${e.shell.toUpperCase()} shell was ejected`;
        case 'BARREL_SAWED':     return `${name(e.by)} sawed off the barrel (double damage)`;
        case 'HELMET_EQUIPPED':  return `${name(e.by)} put on a helmet`;
        case 'HELMET_BOUNCE':    return `The shell bounced off ${their(e.by)} helmet!`;
        case 'HEALED':           return `${name(e.target)} healed ${e.amount} HP (${e.health} HP now)`;
        case 'HANDCUFFED':       return `${name(e.by)} handcuffed ${them(e.target)}`;
        default:                 return e.type;
    }
}

const BuckshotRouletteLitePlus = () => {
    const { events, busy, state, shoot, playItem, newGame } = useBuckshotGame();
    // No clicking while the log is still printing, so lines always appear in the order things happened.
    const myTurn = state.turn === 'player' && !state.winner && !busy;

    // Auto-scroll the log to the newest line, but only if you were already at the bottom,
    // so scrolling up to re-read something doesn't get yanked away.
    const logRef = useRef(null);
    const stickToBottom = useRef(true);
    const onLogScroll = () => {
        const el = logRef.current;
        stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
    };
    useEffect(() => {
        const el = logRef.current;
        if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
    }, [events.length]);

    // Items like Adrenaline/Duplicator need a second click. `pending` = slot of the item waiting for it.
    const [pending, setPending] = useState(null);
    const pendingItem = pending === null ? null : state.player.items[pending];
    const targetChoices = !pendingItem ? [] :
        pendingItem.targets === 'opponent_item' ? state.dealer.items : state.player.items;

    const doShoot = (target) => { setPending(null); shoot(target); };   // shooting abandons a half-picked item
    const doNewGame = () => { setPending(null); newGame(); };

    const onItemClick = (item, index) => {
        if (item.targets) setPending(pending === index ? null : index);   // ask for a target first
        else playItem(index);
    };
    const onTargetClick = (targetIndex) => {
        playItem(pending, targetIndex);
        setPending(null);
    };

    return (
        <div className="buckshot-roulette-game-container" style={{ background: '#a56361', color: 'white', padding: 16 }}>
            <h3>Buckshot Roulette Lite Plus</h3>

            <p>
                You: {state.player.health}/{state.player.max} HP {state.player.helmet && '⛑'} &nbsp;|&nbsp;
                Dealer: {state.dealer.health}/{state.dealer.max} HP {state.dealer.handcuffed && '⛓'} &nbsp;|&nbsp;
                Shells left: {state.shells.live} live, {state.shells.blank} blank {state.sawed && '(sawed off)'}
            </p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
                <button disabled={!myTurn} onClick={() => doShoot('player')}>Shoot yourself</button>
                <button disabled={!myTurn} onClick={() => doShoot('dealer')}>Shoot dealer</button>
                {state.winner && !busy && <button onClick={doNewGame}>New game</button>}
            </div>

            <div style={{ marginBottom: 12 }}>
                <div>Your items{state.player.items.length === 0 && ': none'}</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {state.player.items.map((item, i) => (
                        <button key={i} disabled={!myTurn} title={item.description}
                                style={pending === i ? { outline: '2px solid yellow' } : undefined}
                                onClick={() => onItemClick(item, i)}>
                            {item.name}
                        </button>
                    ))}
                </div>
                {pendingItem && (
                    <div style={{ marginTop: 8 }}>
                        {pendingItem.name}: choose {pendingItem.targets === 'opponent_item' ? "one of the dealer's" : 'one of your'} items{' '}
                        {targetChoices.map((item, i) => (
                            <button key={i} title={item.description} onClick={() => onTargetClick(i)}>{item.name}</button>
                        ))}
                        {' '}<button onClick={() => setPending(null)}>Cancel</button>
                    </div>
                )}
                <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
                    Dealer's items: {state.dealer.items.length ? state.dealer.items.map((i) => i.name).join(', ') : 'none'}
                </div>
            </div>

            <ol ref={logRef} onScroll={onLogScroll} style={{ maxHeight: 260, overflowY: 'auto', margin: 0, paddingLeft: 24, textAlign: 'left' }}>
                {events.map((e) => <li key={e.id}>{formatEvent(e)}</li>)}
            </ol>
        </div>
    );
};

export default BuckshotRouletteLitePlus;
