import { GameLog } from './GameLog.js';
import { Shotgun } from './Items/Shotgun.js';
import { Player } from './Characters/Player.js';
import { Dealer } from './Characters/Dealer.js';
import { randomItem } from './Items/Items.js';

const ITEMS_PER_RELOAD = 2;

export class BuckshotGame {
    constructor(log = new GameLog(), { round = 1 } = {}) {
        this.log = log;
        this.player = new Player();
        this.dealer = new Dealer();
        this.shotgun = new Shotgun(this.log);
        this.turn = 'player';
        this.round = round;
        this.winner = null;
        this.dealer.watch(this.log);   // lets the dealer remember what its own magnifying glass showed
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

        let result;
        switch (action?.type) {
            case 'USE_ITEM': result = this.useItem(actor, action.index, { targetIndex: action.targetIndex }); break;
            case 'SHOOT': result = this.shoot(actor, action.target); break;
            default: result = { valid: false, reason: `Unknown action: ${action?.type}` };
        }
        // useItem answered with {valid} and shoot with {ok}; callers can now check either one.
        const ok = result.ok ?? result.valid ?? false;
        return { ...result, ok, valid: ok };
    }

    useItem(user, index, args = {}) {
        const item = user.inventory[index];
        if (!item) return { valid: false, reason: 'No item in that slot' };

        const reason = item.blockedReason(this, user, args);
        if (reason) {
            this.log.emit('ACTION_REJECTED', { by: user.id, item: item.id, itemName: item.name, uid: item.uid, reason });
            return { valid: false, reason };
        }

        this.log.emit('ITEM_USED', { by: user.id, item: item.id, itemName: item.name, uid: item.uid });
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

    // Performs ONE dealer action (use an item, or take the shot). Call it again while it is still the dealer's turn.
    // The visual layer calls this one step at a time so each action can be animated before the next.
    dealerAct() {
        if (this.winner || this.turn !== 'dealer') return false;

        const action = this.dealer.chooseAction(this);
        let result = this.determineAction('dealer', action);
        if (!result.ok) {   // the AI picked something the rules reject; fall back to a shot so the game can never stall
            const target = this.dealer.chooseTarget(this.shotgun) === 'self' ? 'dealer' : 'player';
            result = this.determineAction('dealer', { type: 'SHOOT', target });
        }
        return result.ok;
    }

    dealerTurn() { return this.dealerAct(); }   // kept so the old log UI keeps working

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