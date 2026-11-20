import { Character } from '../Interface/Character.js';

// When the dealer steals with Adrenaline it picks the first stealable item from this list.
const STEAL_PRIORITY = ['cigarettes', 'handcuffs', 'magnifying_glass', 'saw', 'helmet', 'polarizer', 'beer', 'burner_phone'];
const MAX_ACTIONS_PER_TURN = 10;   // safety net: after this many item uses in one turn the dealer just shoots

export class Dealer extends Character {
    constructor(initHealth = 5, difficulty = 1) {
        super('dealer', initHealth);
        this.difficulty = difficulty;
        this.inventory = [];
        this.knownCurrent = null;   // 'live' | 'blank' | null: what the dealer's own magnifying glass told it about the next shell
        this.actionsThisTurn = 0;
    }

    // Hook the dealer's memory up to the game log so it forgets/updates what it knows as the chamber changes.
    watch(log) {
        log.on('SHELL_REVEALED', (e) => { if (e.by === 'dealer' && e.position === 1) this.knownCurrent = e.shell; });
        log.on('POLARITY_REVERSED', () => {
            if (this.knownCurrent) this.knownCurrent = this.knownCurrent === 'live' ? 'blank' : 'live';
        });
        log.on('SHELL_EJECTED', () => { this.knownCurrent = null; });
        log.on('RELOAD', () => { this.knownCurrent = null; });
        log.on('SHOT_FIRED', () => { this.knownCurrent = null; this.actionsThisTurn = 0; });
    }

    // 'self' | 'opponent', based only on the odds (used when the dealer has no inside information)
    chooseTarget(shotgun) {
        const { live, blank } = shotgun.getCounts();
        if (blank === 0) return 'opponent';
        if (live === 0) return 'self';
        return live / (live + blank) < 0.5 ? 'self' : 'opponent';
    }

    // Returns ONE action: { type: 'USE_ITEM', index, targetIndex? } or { type: 'SHOOT', target }.
    // The game calls this again after each action until the dealer shoots (or the turn changes).
    chooseAction(game) {
        const foe = game.opponentOf(this);
        const gun = game.shotgun;
        const { live, blank } = gun.getCounts();
        const known = this.knownCurrent;
        const liveOdds = live / Math.max(1, live + blank);

        const canShoot = () => ({ type: 'SHOOT', target: this.#shootTarget(gun) });
        if (this.actionsThisTurn >= MAX_ACTIONS_PER_TURN) return canShoot();

        // index of the first item with this id the dealer may use right now (items that need a target are handled separately)
        const find = (id) => this.inventory.findIndex((it) => it.id === id && !it.targets && !it.blockedReason(game, this, {}));
        const use = (index, extra = {}) => { this.actionsThisTurn++; return { type: 'USE_ITEM', index, ...extra }; };

        let i;
        if (this.health < this.maxHealth && (i = find('cigarettes')) !== -1) return use(i);
        if ((i = find('helmet')) !== -1) return use(i);
        if (known === null && (i = find('magnifying_glass')) !== -1) return use(i);
        if (!foe.handcuffed && gun.getBulletCount() > 1 && (i = find('handcuffs')) !== -1) return use(i);

        // Known blank and the foe is close to dead: flip it into a live shell.
        if (known === 'blank' && foe.health <= 2 && (i = find('polarizer')) !== -1) return use(i);

        // Saw when the next shot is (probably) going at the player.
        const aimingAtFoe = known === 'live' || (known === null && liveOdds >= 0.5);
        if (aimingAtFoe && (i = find('saw')) !== -1) return use(i);

        // Re-roll a coin-flip shell.
        if (known === null && liveOdds === 0.5 && (i = find('beer')) !== -1) return use(i);

        if (gun.getBulletCount() > 1 && (i = find('burner_phone')) !== -1) return use(i);

        // Adrenaline: steal the most useful thing the player has.
        const adr = this.inventory.findIndex((it) => it.id === 'adrenaline');
        if (adr !== -1) {
            for (const wanted of STEAL_PRIORITY) {
                const t = foe.inventory.findIndex((it) => it.id === wanted);
                if (t !== -1 && !this.inventory[adr].blockedReason(game, this, { targetIndex: t })) {
                    return use(adr, { targetIndex: t });
                }
            }
        }

        // Duplicator: copy something that is worth having twice (never another Duplicator, that would loop forever).
        const dup = this.inventory.findIndex((it) => it.id === 'duplicator');
        if (dup !== -1) {
            const src = this.inventory.findIndex((it, n) => n !== dup && it.id !== 'duplicator' && !it.targets);
            if (src !== -1 && !this.inventory[dup].blockedReason(game, this, { targetIndex: src })) {
                return use(dup, { targetIndex: src });
            }
        }

        return canShoot();
    }

    #shootTarget(gun) {
        if (this.knownCurrent === 'live') return 'player';
        if (this.knownCurrent === 'blank') return 'dealer';
        return this.chooseTarget(gun) === 'self' ? 'dealer' : 'player';
    }
}
