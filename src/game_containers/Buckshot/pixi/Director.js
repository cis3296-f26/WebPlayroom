import { TIMING } from './config.js';

const who = (id) => (id === 'player' ? 'You' : 'The dealer');

// ----------------------------------------------------------------------------------------------
//  Director = the bridge between the game LOGIC and the visuals.
//
//  The logic runs instantly and writes facts into GameLog. The Director reads those events one at a time and
//  asks the Stage to PLAY each one (clip, sprite animation, HP change...), waiting for it to finish before the next.
//  It also decides when the player may click, and drives the dealer one action at a time.
//
//  It only ever talks to `stage` through plain method calls, so it can be tested without any graphics.
// ----------------------------------------------------------------------------------------------
export class Director {
    constructor({ game, stage, onGameOver }) {
        this.game = game;
        this.stage = stage;
        this.onGameOver = onGameOver;
        this.queue = [];
        this.cursor = 0;
        this.pumping = false;
        this.scheduled = false;
        this.destroyed = false;
        this.phase = 'busy';       // 'busy' | 'player' (free to click) | 'aiming' (shotgun raised) | 'over'
        this.pick = null;          // { sourceUid, mode, candidates } while Adrenaline/Duplicator waits for its 2nd click
        this.aiming = false;       // shotgun is already in the player's hands (video held on its last frame)
        this.sawed = false;
        this.bounce = false;
    }

    start() {
        const s = this.stage;
        s.handlers = {
            onItemTap: (uid) => this.#itemTap(uid),
            onShotgunTap: () => this.#shotgunTap(),
            onAim: (target) => this.#aim(target),
            onPutDown: () => this.#putDown(),
            onPickCancel: () => this.#cancelPick(),
        };
        this.unsubscribe = this.game.log.subscribe(() => this.#collect());
        this.game.start();      // emits GAME_START, RELOAD, ITEMS_DEALT, TURN_START
    }

    destroy() {
        this.destroyed = true;
        this.unsubscribe?.();
        this.queue.length = 0;
    }

    // ================================================================= event intake
    #collect() {
        const events = this.game.log.getEvents();
        while (this.cursor < events.length) this.queue.push(events[this.cursor++]);
        this.#schedule();
    }

    // Deferred by a microtask: the logic emits a whole action's events synchronously, and handlers (e.g. SHOT_FIRED)
    // peek ahead at the queue, so they must not start until all of those events have arrived.
    #schedule() {
        if (this.scheduled) return;
        this.scheduled = true;
        queueMicrotask(() => { this.scheduled = false; this.#pump(); });
    }

    async #pump() {
        if (this.pumping || this.destroyed) return;
        this.pumping = true;
        this.#setPhase('busy');
        try {
            while (!this.destroyed) {
                while (this.queue.length && !this.destroyed) {
                    const e = this.queue.shift();
                    try { await this.#handle(e); } catch (err) { console.error('[Director] failed presenting', e, err); }
                }
                if (this.destroyed || this.phase === 'over') break;
                if (this.game.turn === 'dealer' && !this.game.winner) {
                    await this.stage.wait(TIMING.dealerThink);   // presentation has caught up with the logic, so the dealer may act now
                    if (this.destroyed) break;
                    this.game.dealerAct();                        // ONE action; its events land in the queue
                    this.#collect();
                    continue;
                }
                break;
            }
        } finally {
            this.pumping = false;
        }
        if (!this.destroyed && this.phase !== 'over') {
            if (this.game.turn === 'player' && !this.game.winner) this.#setPhase('player');
        }
    }

    #setPhase(p) {
        this.phase = p;
        this.stage.setShotgunEnabled(p === 'player');
    }

    // ================================================================= presenting events
    async #handle(e) {
        const s = this.stage;
        s.debugLog?.(`${e.id} ${e.type}${e.by ? ' by ' + e.by : ''}${e.target ? ' -> ' + e.target : ''}${e.shell ? ' ' + e.shell : ''}`);
        const maxHp = (id) => this.game.getCharacter(id).maxHealth;

        switch (e.type) {
            case 'GAME_START':
                await s.playClip(['intro']);
                break;

            case 'RELOAD':
                await this.#reload(e);
                break;

            case 'ITEMS_DEALT':
                await s.dealItems(e.target, e.items);
                break;

            case 'TURN_START':
                s.setTurn(e.turn);
                break;

            case 'TURN_SKIPPED':
                s.setStatus(e.target, { handcuffed: false });
                await s.toast(`${who(e.target)} ${e.target === 'player' ? 'are' : 'is'} handcuffed. Turn skipped.`);
                break;

            case 'ITEM_USED':
                if (e.by === 'dealer') s.toast(`Dealer uses ${e.itemName}`, 1100);
                await s.takeItem(e.by, e.uid);
                break;

            case 'ACTION_REJECTED':
                if (e.by === 'player') await s.rejectItem(e.uid, e.reason);
                break;

            case 'ITEM_STOLEN':
                await s.takeItem(e.by, e.uid);   // the hand reaches over to the victim's slot and takes it
                break;

            case 'ITEM_DUPLICATED':
                await s.dealItems(e.by, [e.copy]);
                break;

            case 'SHELL_REVEALED':
                // The log records the truth, so the "may the human see it?" decision is made HERE.
                if (e.by === 'player') await s.revealShell(e.shell, e.position);
                else await s.toast('The dealer peeks at the chamber', 1200);
                break;

            case 'POLARITY_REVERSED':
                await s.flashShotgun();
                break;

            case 'SHELL_EJECTED':
                await s.ejectShell(e.shell);
                break;

            case 'BARREL_SAWED':
                this.sawed = true;
                s.setSawed(true);
                await s.flashShotgun(0xffaa33);
                break;

            case 'HELMET_EQUIPPED':
                s.setStatus(e.by, { helmet: true });
                await s.wait(TIMING.beat);
                break;

            case 'HELMET_BOUNCE':
                this.bounce = true;               // the SHOT_FIRED that follows is the bounced shell
                s.setStatus(e.by, { helmet: false });
                break;

            case 'HEALED':
                await s.hpChange(e.target, e.health, maxHp(e.target), +e.amount);
                break;

            case 'HANDCUFFED':
                s.setStatus(e.target, { handcuffed: true });
                await s.wait(TIMING.beat);
                break;

            case 'SHOT_FIRED':
                await this.#shot(e);
                break;

            case 'DAMAGE':
                await s.hpChange(e.target, e.health, maxHp(e.target), -e.amount);
                break;

            case 'GAME_OVER':
                this.#setPhase('over');
                Promise.resolve(this.onGameOver?.(e.winner)).catch((err) => console.error(err));
                break;

            default:
                break;
        }
    }

    async #reload(e) {
        const s = this.stage;
        if (s.itemsShown) await s.setItemsVisible(false);
        await s.playClip(['reload'], {
            cues: { shellsIn: () => s.showShells(e.live, e.blank), shellsOut: () => s.hideShells() },
        });
        await s.hideShells();
        await s.setItemsVisible(true);
    }

    // Which video to play for a shot. Each list is a fallback chain; the first file that exists wins.
    #shotClips({ shooter, aimedAtSelf, hitSelf, live, lethal, bounced }) {
        const other = shooter === 'player' ? 'dealer' : 'player';
        if (bounced) {
            if (lethal) return shooter === 'player' ? ['player_kill_dealer'] : ['dealer_kill_player', 'player_death'];
            return [`${shooter}_helmet_bounce`, `${shooter}_shoot_${other}_live`];
        }
        if (!live) return [aimedAtSelf ? `${shooter}_shoot_self_blank` : `${shooter}_shoot_${other}_blank`];
        if (lethal) {
            const victim = hitSelf ? shooter : other;
            if (victim === 'dealer') return shooter === 'player' ? ['player_kill_dealer'] : ['dealer_die_self', 'player_kill_dealer'];
            return shooter === 'player' ? ['player_death'] : ['dealer_kill_player', 'player_death'];
        }
        return [aimedAtSelf ? `${shooter}_shoot_self_live` : `${shooter}_shoot_${other}_live`];
    }

    async #shot(e) {
        const s = this.stage;
        const next = this.queue[0];
        const lethal = next?.type === 'DAMAGE' && next.health <= 0;      // DAMAGE follows SHOT_FIRED in the log
        const bounced = this.bounce;
        this.bounce = false;
        const hitSelf = e.by === e.target;
        const victim = e.target;
        const names = this.#shotClips({
            shooter: e.by, aimedAtSelf: bounced || hitSelf, hitSelf, live: e.shell === 'live', lethal, bounced,
        });
        const chain = this.sawed ? names.flatMap((n) => [`${n}_sawed`, n]) : names;
        this.sawed = false;

        s.setPick(null);
        if (!this.aiming && s.itemsShown) await s.setItemsVisible(false);   // the video starts on an item-free table
        this.aiming = false;
        s.showAim(false);

        if (lethal && victim === 'player') {
            await s.playClip(chain, { hold: true });                         // stays on screen; the game-over flow fades it to black
            s.setSawed(false);
            return;
        }
        if (lethal && victim === 'dealer') {
            await s.playClip(chain, { hold: true });
            s.setSawed(false);
            await s.setDealerVisible(false, 0);                              // the still scene underneath now has no dealer
            await s.releaseClip();
            return;
        }
        await s.playClip(chain);
        s.setSawed(false);
        const reloadComing = this.queue.some((q) => q.type === 'RELOAD');
        if (!reloadComing) await s.setItemsVisible(true);                    // (the reload clip would only hide them again)
    }

    // ================================================================= player input
    #uidIndex(character, uid) { return character.inventory.findIndex((i) => i.uid === uid); }

    #itemTap(uid) {
        if (this.phase !== 'player') return;
        const g = this.game;

        if (this.pick) {
            if (uid === this.pick.sourceUid) return this.#cancelPick();
            if (!this.pick.candidates.includes(uid)) return;
            const sourceIndex = this.#uidIndex(g.player, this.pick.sourceUid);
            const owner = this.pick.mode === 'opponent_item' ? g.dealer : g.player;
            return this.#act({ type: 'USE_ITEM', index: sourceIndex, targetIndex: this.#uidIndex(owner, uid) });
        }

        const index = this.#uidIndex(g.player, uid);
        if (index === -1) return;                  // clicked one of the dealer's items
        const item = g.player.inventory[index];
        if (!item.targets) return this.#act({ type: 'USE_ITEM', index });

        const candidates = (item.targets === 'opponent_item' ? g.dealer.inventory : g.player.inventory)
            .filter((it) => it.uid !== uid).map((it) => it.uid);
        if (candidates.length === 0) {
            this.stage.toast(item.targets === 'opponent_item' ? 'The dealer has nothing to steal' : 'You have nothing to copy');
            return;
        }
        this.pick = { sourceUid: uid, mode: item.targets, candidates };
        this.stage.setPick({
            sourceUid: uid, candidates,
            text: item.targets === 'opponent_item' ? "Pick one of the dealer's items to steal" : 'Pick one of your items to copy',
        });
    }

    #cancelPick() {
        this.pick = null;
        this.stage.setPick(null);
    }

    async #shotgunTap() {
        if (this.phase !== 'player') return;
        this.#cancelPick();
        this.#setPhase('busy');
        const s = this.stage;
        await s.setItemsVisible(false);
        const names = this.sawed ? ['shotgun_pickup_sawed', 'shotgun_pickup'] : ['shotgun_pickup'];
        await s.playClip(names, { hold: true });    // ends on the aiming pose and STAYS there
        if (this.destroyed) return;
        this.aiming = true;
        this.#setPhase('aiming');
        s.showAim(true);
    }

    #aim(target) {
        if (this.phase !== 'aiming') return;
        this.stage.showAim(false);
        this.#act({ type: 'SHOOT', target });
    }

    async #putDown() {
        if (this.phase !== 'aiming') return;
        const s = this.stage;
        this.#setPhase('busy');
        s.showAim(false);
        const played = await s.playClip(['shotgun_putdown']);   // optional clip
        if (!played) await s.releaseClip();
        this.aiming = false;
        await s.setItemsVisible(true);
        if (!this.destroyed) this.#setPhase('player');
    }

    #act(action) {
        this.#setPhase('busy');
        this.pick = null;
        this.stage.setPick(null);
        this.game.determineAction('player', action);   // events (even rejections) flow back through the log
        this.#collect();
    }
}
