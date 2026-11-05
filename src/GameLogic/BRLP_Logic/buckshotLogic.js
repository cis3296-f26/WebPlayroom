import { Shotgun } from './Items/Shotgun.js';
import { Player } from './Characters/Player.js';
import { Dealer } from './Characters/Dealer.js';


class BuckshotGame {
    constructor(log = new GameLog()) {
        this.log = log;
        this.player = new Player();
        this.dealer = new Dealer();
        this.shotgun = new Shotgun(this.log);
        this.turn = 'player';
        this.round = 1;
        this.winner = null;
    }

    start() {
        this.log.emit('GAME_START', {});
        this.shotgun.initializeBullets(this.round);
        this.log.emit('TURN_START', { turn: this.turn });
    }

    playerTurn(player) {
        if (this.winner || this.turn !== 'player') return false;
        const target = choice === 'self' ? player : this.dealer;
        const shell = this.player.shootCharacter(target, this.shotgun);
        this.afterShot(this.player, target, shell);
        return true;
    }

    dealerTurn(dealer) {
        if (this.winner || this.turn !== 'dealer') return false;
        const choice = this.dealer.chooseTarget(this.shotgun);
        const target = choice === 'self' ? this.dealer : this.player;
        const shell = this.dealer.shootCharacter(target, this.shotgun);
        this.afterShot(this.dealer, target, shell);
        return true;
    }

    afterShot(shooter, target, shell) {
        if (target.isDead) {
            this.winner = target === this.player ? 'dealer' : 'player';
            this.log.emit('GAME_OVER', { winner: this.winner });
            return;
        }

        // Shooting yourself with a blank keeps your turn; anything else passes it.
        const keepsTurn = target === shooter && shell === 'blank';
        if (!keepsTurn) this.turn = this.turn === 'player' ? 'dealer' : 'player';

        if (this.shotgun.getBulletCount() === 0) {
            this.shotgun.initializeBullets(this.round);   // logs RELOAD
        }
        this.log.emit('TURN_START', { turn: this.turn });
    }

    getState() {
        return {
            round: this.round,
            turn: this.turn,
            winner: this.winner,
            shells: this.shotgun.getCounts(),
            player: { health: this.player.health, max: this.player.maxHealth },
            dealer: { health: this.dealer.health, max: this.dealer.maxHealth },
        };
    }

}
