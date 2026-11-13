import { GameLog } from './GameLog.js';
import { Shotgun } from './Items/Shotgun.js';
import { Player } from './Characters/Player.js';
import { Dealer } from './Characters/Dealer.js';
import { randomItem } from './Items/Items.js';

const ITEMS_PER_RELOAD = 2;

export class BuckshotGame {
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
        this.log.emit('GAME_START');
        this.reload();
        this.log.emit('TURN_START', { turn: this.turn });
    }

    determineAction(actorId, action) {
        const actor = this.getCharacter(actorId);
        if (!actor) return { valid: false, reason: `Unknown character: ${actorId}` };
        if (this.winner) return { valid: false, reason: 'The game is over' };
        if (this.turn !== actor.id) return { valid: false, reason: 'It is not your turn' };

        switch (action?.type) {
            case 'USE_ITEM': return this.useItem(actor, action.index, { targetIndex: action.targetIndex });
            case 'SHOOT': return this.shoot(actor, action.target);
            default: return { valid: false, reason: `Unknown action: ${action?.type}` };
        }

    }

    useItem(user, index, args = {}) {
        const item = user.inventory[index];
        if (!item) return { valid: false, reason: 'No item in that slot' };

        const reason = item.blockedReason(this, user, args);
        if (reason) {
            this.log.emit('ACTION_REJECTED', { by: user.id, item: item.id, itemName: item.name, reason });
            return { valid: false, reason };
        }

        this.log.emit('ITEM_USED', { by: user.id, item: item.id, itemName: item.name });
        item.useItem(this, user, args);
        user.removeItem(item);
        return { valid: true };
    }

    shoot(shooter, targetId) {
        const aimedAt = this.getCharacter(targetId);
        if (!aimedAt) return { ok: false, reason: `Unknown target: ${targetId}` };

        let target = aimedAt;

        if (aimedAt === shooter && shooter.helmet && this.shotgun.revealBullet() === 'live') {
            shooter.helmet = false;
            target = this.opponentOf(shooter);
            this.log.emit('HELMET_BOUNCE', { by: shooter.id, target: target.id });
        }

        const shell = shooter.shootCharacter(target, this.shotgun);
        this.afterShot(shooter, target, shell);
        return { ok: true };
    }

    dealerTurn() {
        if (this.winner || this.turn !== 'dealer') return false;
        const choice = this.dealer.chooseTarget(this.shotgun);
        const target = choice === 'self' ? 'dealer' : 'player';
        return this.determineAction('dealer', { type: 'SHOOT', target }).ok;
    }

    afterShot(shooter, target, shell) {
        if (target.isDead) {
            this.winner = target === this.player ? 'dealer' : 'player';
            this.log.emit('GAME_OVER', { winner: this.winner });
            return;
        }

        const keepsTurn = target === shooter && shell === 'blank';
        if (!keepsTurn) this.passTurn();

        this.reloadIfEmpty();
        this.log.emit('TURN_START', { turn: this.turn });
    }

    passTurn() {
        const next = this.turn === 'player' ? 'dealer' : 'player';
        const nextCharacter = this.getCharacter(next);
        if (nextCharacter.handcuffed) {
            nextCharacter.handcuffed = false;
            this.log.emit('TURN_SKIPPED', { target: next });
            return;
        }
        this.turn = next;
    }


    reload() {
        this.shotgun.initializeBullets(this.round);   // emits RELOAD
        this.dealItems();
    }

    reloadIfEmpty() { if (this.shotgun.getBulletCount() === 0) this.reload(); }

    dealItems() {
        for (const character of [this.player, this.dealer]) {
            const dealt = [];
            for (let i = 0; i < ITEMS_PER_RELOAD; i++) {
                const item = randomItem();
                if (character.addItem(item)) dealt.push(item.describe());
            }
            if (dealt.length > 0) this.log.emit('ITEMS_DEALT', { target: character.id, items: dealt });
        }
    }

    // ----------------------------------------

    getCharacter(id) {
        if (id === 'player') return this.player;
        if (id === 'dealer') return this.dealer;
        return null;
    }

    opponentOf(character) {
        return character === this.player ? this.dealer : this.player;
    }

    getState() {
        const side = (c) => ({
            health: c.health,
            max: c.maxHealth,
            items: c.inventory.map((item) => item.describe()),
            helmet: c.helmet,
            handcuffed: c.handcuffed,
        });
        return {
            round: this.round,
            turn: this.turn,
            winner: this.winner,
            shells: this.shotgun.getCounts(),
            sawed: this.shotgun.isDoubleDamage(),
            player: side(this.player),
            dealer: side(this.dealer),
        };
    }
}