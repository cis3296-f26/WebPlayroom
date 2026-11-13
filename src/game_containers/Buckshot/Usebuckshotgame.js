import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { BuckshotGame } from '../../GameLogic/BRLP_Logic/buckshotLogic.js';

const LOG_DELAY_MS = 500;      
const DEALER_DELAY_MS = 600;

function createGame() {
    const game = new BuckshotGame();
    game.start();
    return game;
}

export function useBuckshotGame() {
    const [game, setGame] = useState(createGame);

    const events = useSyncExternalStore(game.log.subscribe, game.log.getEvents);

    //log buffer
    const [shown, setShown] = useState(0);
    useEffect(() => {
        if (shown >= events.length) return;
        const timer = setTimeout(() => setShown(shown + 1), LOG_DELAY_MS);
        return () => clearTimeout(timer);
    }, [shown, events.length]);

    const visibleEvents = events.slice(0, shown);
    const busy = shown < events.length;

    useEffect(() => {
        if (game.turn === 'dealer' && !game.winner && !busy) {
            const timer = setTimeout(() => game.dealerTurn(), DEALER_DELAY_MS);
            return () => clearTimeout(timer);
        }
    }, [game, events, busy]);

    const act = useCallback((action) => game.determineAction('player', action), [game]);

    const shoot = useCallback((target) => act({ type: 'SHOOT', target }), [act]);

    const playItem = useCallback((index, targetIndex) => act({ type: 'USE_ITEM', index, targetIndex }), [act]);

    const newGame = useCallback(() => {
        setGame(createGame());
        setShown(0); 
    }, []);

    return { events: visibleEvents, busy, state: game.getState(), act, shoot, playItem, newGame };
}