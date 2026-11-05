import { useRef, useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { BuckshotGame } from '../../GameLogic/BRLP_Logic/buckshotLogic.js';

function createGame() {
    const game = new BuckshotGame();
    game.start();
    return game;
}

export function useBuckshotGame() {
    const [game, setGame] = useState(createGame);

    // Re-render whenever the game emits a new log event.
    const events = useSyncExternalStore(game.log.subscribe, game.log.getEvents);

    // Dealer moves automatically after a short pause (also repeats if the dealer keeps the turn).
    useEffect(() => {
        if (game.turn === 'dealer' && !game.winner) {
            const timer = setTimeout(() => game.dealerTurn(), 900);
            return () => clearTimeout(timer);
        }
    }, [game, events]);

    const shoot = useCallback((choice) => game.playerTurn(choice), [game]);
    const newGame = useCallback(() => setGame(createGame()), []);

    return { events, state: game.getState(), shoot, newGame };
}