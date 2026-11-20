import { Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import { W, H, LAYOUT, TIMING, ITEM_BOX, FONT_MONO } from './config.js';
import { ease } from './tween.js';
import { Hud } from './Hud.js';
import { Toast, Tooltip, makeButton, makeText } from './ui.js';

const fit = (sprite, box) => { const s = Math.min(box / sprite.texture.width, box / sprite.texture.height); sprite.scale.set(s); return s; };
const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

// ----------------------------------------------------------------------------------------------
//  Stage = the still-image "game container": table, dealer, shotgun, items, hands, HUD and all the
//  small sprite animations. Full-screen videos are played by ClipPlayer on top of it.
//  The Director (Director.js) tells the Stage what to show; the Stage never talks to the game logic.
// ----------------------------------------------------------------------------------------------
export class Stage {
    constructor({ app, assets, tweens, clips }) {
        this.app = app;
        this.assets = assets;
        this.tweens = tweens;
        this.clips = clips;
        this.handlers = {};          // set by the Director: onItemTap, onShotgunTap, onAim, onPutDown, onPickCancel
        this.time = 0;
        this.bobbers = [];
        this.items = new Map();      // uid -> ItemSprite
        this.slots = {
            player: LAYOUT.slots.player.map((p, i) => ({ ...p, owner: 'player', index: i, uid: null })),
            dealer: LAYOUT.slots.dealer.map((p, i) => ({ ...p, owner: 'dealer', index: i, uid: null })),
        };
        this.status = { player: { helmet: false, handcuffed: false }, dealer: { helmet: false, handcuffed: false } };
        this.pick = null;
        this.itemsShown = true;

        const stage = app.stage;
        this.world = new Container();
        this.hud = new Hud(assets, tweens);
        this.overlay = new Container();
        this.fadeRect = new Graphics().rect(0, 0, W, H).fill(0x000000);
        this.fadeRect.alpha = 0;
        this.fadeRect.eventMode = 'none';
        this.tooltip = new Tooltip(tweens, { w: W, h: H });
        this.toastBox = new Toast(tweens, W / 2, 80);
        this.screenLayer = new Container();   // Screens.js draws into this one
        this.debugLayer = new Container();
        this.debugLayer.visible = false;

        stage.addChild(this.world, clips.layer, this.hud.container, this.overlay, this.tooltip.container, this.toastBox.container, this.fadeRect, this.screenLayer, this.debugLayer);

        this.#buildWorld();
        this.#buildOverlay();
        this.#buildDebug();
        app.ticker.add(this.#update, this);
    }

    // ================================================================= building
    #buildWorld() {
        const A = this.assets;
        this.bg = new Sprite(A.tex('bg_table'));
        this.bg.width = W; this.bg.height = H;

        // dealer (+ helmet) with a gentle idle bob
        this.dealerNode = new Container();
        this.dealerNode.position.set(LAYOUT.dealer.x, LAYOUT.dealer.y);
        this.dealerBody = this.#bobSprite(A.tex('dealer'), 5, 0.0016, 0);
        this.dealerHelmet = new Sprite(A.tex('dealer_helmet'));
        this.dealerHelmet.anchor.set(0.5);
        this.dealerHelmet.position.set(LAYOUT.dealerHelmet.x - LAYOUT.dealer.x, LAYOUT.dealerHelmet.y - LAYOUT.dealer.y);
        this.dealerHelmet.visible = false;
        this.dealerNode.addChild(this.dealerBody, this.dealerHelmet);

        // shotgun on the table (click to pick up)
        this.shotgun = new Sprite(A.tex('shotgun_table'));
        this.shotgun.anchor.set(0.5);
        this.shotgun.position.set(LAYOUT.shotgun.x, LAYOUT.shotgun.y);
        this.shotgun.on('pointerover', () => { if (this.shotgunEnabled) this.shotgun.tint = 0xfff2b0; });
        this.shotgun.on('pointerout', () => { this.shotgun.tint = 0xffffff; });
        this.shotgun.on('pointertap', () => { if (this.shotgunEnabled) this.handlers.onShotgunTap?.(); });
        this.setShotgunEnabled(false);

        this.hole = new Sprite(A.tex('table_hole'));
        this.hole.anchor.set(0.5);
        this.hole.position.set(LAYOUT.hole.x, LAYOUT.hole.y);
        this.hole.scale.set(0);

        this.itemsLayer = new Container();
        this.itemsLayer.sortableChildren = true;

        this.hands = {};
        for (const who of ['player', 'dealer']) {
            const L = LAYOUT.hands[who];
            const c = new Container();
            c.position.set(L.rest.x, L.rest.y);
            const sprite = new Sprite(A.tex(who === 'player' ? 'hand_open' : 'dealer_hand_open'));
            sprite.anchor.set(0.5);
            c.addChild(sprite);
            this.hands[who] = { container: c, sprite, open: A.tex(who === 'player' ? 'hand_open' : 'dealer_hand_open'), grab: A.tex(who === 'player' ? 'hand_grab' : 'dealer_hand_grab') };
        }

        // briefcase (a hand lowering a case). Parked above the screen until the player wins.
        this.briefcase = new Container();
        this.briefcase.position.set(LAYOUT.briefcase.x, LAYOUT.briefcase.raisedY);
        const bc = new Sprite(A.tex('briefcase_hand'));
        bc.anchor.set(0.5);
        this.briefcase.addChild(bc);
        this.shackleLayer = new Container();

        this.world.addChild(this.bg, this.dealerNode, this.shotgun, this.hole, this.itemsLayer, this.hands.dealer.container, this.hands.player.container, this.briefcase, this.shackleLayer);
    }

    #buildOverlay() {
        this.shellRow = new Container();
        this.pickPrompt = new Container();
        this.pickPrompt.visible = false;
        this.pickText = makeText('', { size: 30, font: FONT_MONO });
        this.pickText.position.set(W / 2, 640);
        const cancel = makeButton('Cancel', { w: 160, h: 48, size: 24, onTap: () => this.handlers.onPickCancel?.() });
        cancel.position.set(W / 2, 690);
        this.pickPrompt.addChild(this.pickText, cancel);

        // aiming UI: shown while the shotgun is up. The hit box sits over the dealer; the text buttons are the alternative.
        const L = LAYOUT.aim;
        this.aim = new Container();
        this.aim.visible = false;
        const hit = new Graphics().rect(0, 0, L.dealerHit.w, L.dealerHit.h).fill({ color: 0xffffff, alpha: 0.001 });
        hit.position.set(L.dealerHit.x, L.dealerHit.y);
        hit.eventMode = 'static'; hit.cursor = 'crosshair';
        this.btnDealer = makeButton('SHOOT THE DEALER', { w: 380, onTap: () => this.handlers.onAim?.('dealer') });
        this.btnDealer.position.set(L.shootDealer.x, L.shootDealer.y);
        this.btnSelf = makeButton('SHOOT YOURSELF', { w: 380, onTap: () => this.handlers.onAim?.('player') });
        this.btnSelf.position.set(L.shootSelf.x, L.shootSelf.y);
        const down = makeButton('Put down', { w: 190, h: 52, size: 24, onTap: () => this.handlers.onPutDown?.() });
        down.position.set(L.putDown.x, L.putDown.y);
        hit.on('pointerover', () => this.btnDealer.scale.set(1.08));
        hit.on('pointerout', () => this.btnDealer.scale.set(1));
        hit.on('pointertap', () => this.handlers.onAim?.('dealer'));
        this.aim.addChild(hit, this.btnDealer, this.btnSelf, down);

        this.overlay.addChild(this.shellRow, this.pickPrompt, this.aim);
    }

    #buildDebug() {
        this.debugSlots = new Graphics();
        for (const who of ['player', 'dealer']) {
            for (const s of this.slots[who]) {
                const half = (ITEM_BOX * s.scale) / 2;
                this.debugSlots.rect(s.x - half, s.y - half, half * 2, half * 2).stroke({ width: 2, color: who === 'player' ? 0x00ff88 : 0xff8800 });
            }
        }
        this.debugSlots.rect(LAYOUT.aim.dealerHit.x, LAYOUT.aim.dealerHit.y, LAYOUT.aim.dealerHit.w, LAYOUT.aim.dealerHit.h).stroke({ width: 2, color: 0xff00ff });
        LAYOUT.shackles.forEach((s) => this.debugSlots.circle(s.x, s.y, 50).stroke({ width: 2, color: 0x00aaff }));
        this.debugText = makeText('', { size: 14, font: FONT_MONO, anchor: [0, 0], align: 'left' });
        this.debugText.position.set(200, 70);
        this.debugLayer.addChild(this.debugSlots, this.debugText);
        this.debugLines = [];
        this.fpsAcc = 0;
        this.fps = 0;
    }

    #bobSprite(texture, amp, speed, phase) {
        const holder = new Container();
        const body = new Sprite(texture);
        body.anchor.set(0.5);
        holder.addChild(body);
        this.bobbers.push({ body, amp, speed, phase });
        holder.body = body;
        return holder;
    }

    #update(ticker) {
        this.time += ticker.deltaMS;
        for (let i = this.bobbers.length - 1; i >= 0; i--) {
            const b = this.bobbers[i];
            if (b.body.destroyed) { this.bobbers.splice(i, 1); continue; }
            b.body.y = Math.sin(this.time * b.speed + b.phase) * b.amp;
        }
        if (this.debugLayer.visible) {
            this.fpsAcc += ticker.deltaMS;
            if (this.fpsAcc > 500) { this.fps = Math.round(this.app.ticker.FPS); this.fpsAcc = 0; }
            this.debugText.text = `FPS ${this.fps}\n` + this.debugLines.join('\n');
        }
    }

    // ================================================================= debug
    setDebug(on) { this.debugLayer.visible = on; }
    debugLog(line) { this.debugLines.push(line); if (this.debugLines.length > 14) this.debugLines.shift(); }

    // ================================================================= scene state
    resetForGame({ game, stage, prizeText }) {
        for (const item of this.items.values()) item.destroy({ children: true });
        this.items.clear();
        for (const who of ['player', 'dealer']) this.slots[who].forEach((s) => { s.uid = null; });
        this.dealerNode.alpha = 1;
        this.dealerNode.visible = true;
        this.itemsLayer.alpha = 1;
        this.itemsShown = true;
        this.hole.scale.set(0);
        this.shellRow.removeChildren().forEach((c) => c.destroy({ children: true }));
        this.status = { player: { helmet: false, handcuffed: false }, dealer: { helmet: false, handcuffed: false } };
        this.#syncStatus();
        this.setSawed(false);
        this.setPick(null);
        this.showAim(false);
        this.setShotgunEnabled(false);
        this.setBriefcaseDown(false);
        this.shackleLayer.removeChildren().forEach((c) => c.destroy());
        this.hud.setHp('player', game.player.health, game.player.maxHealth);
        this.hud.setHp('dealer', game.dealer.health, game.dealer.maxHealth);
        this.hud.setTurn('');
    }

    setHudVisible(v) { this.hud.show(v); }
    setTurn(who) { this.hud.setTurn(who === 'player' ? 'YOUR TURN' : who === 'dealer' ? "DEALER'S TURN" : ''); }
    setSawed(on) { this.shotgun.texture = this.assets.tex(on ? 'shotgun_table_sawed' : 'shotgun_table'); }
    setShotgunEnabled(on) {
        this.shotgunEnabled = on;
        this.shotgun.eventMode = on ? 'static' : 'none';
        this.shotgun.cursor = on ? 'pointer' : 'default';
        if (!on) this.shotgun.tint = 0xffffff;
    }

    setStatus(who, patch) { Object.assign(this.status[who], patch); this.#syncStatus(); }
    #syncStatus() {
        this.hud.setStatus('player', this.status.player);
        this.hud.setStatus('dealer', this.status.dealer);
        this.dealerHelmet.visible = this.status.dealer.helmet;
    }

    setHp(who, hp, max) { this.hud.setHp(who, hp, max); }
    hpChange(who, hp, max, amount) { return this.hud.hit(who, hp, max, amount); }

    async setDealerVisible(v, ms = 300) {
        if (v) this.dealerNode.visible = true;
        await this.tweens.to(this.dealerNode, { alpha: v ? 1 : 0 }, ms);
        if (!v) this.dealerNode.visible = false;
    }

    toast(msg, ms = TIMING.toast) { return this.toastBox.show(msg, ms); }
    wait(ms) { return this.tweens.wait(ms); }

    async blackout(on, ms = 500) { await this.tweens.to(this.fadeRect, { alpha: on ? 1 : 0 }, ms, ease.linear); }

    // ================================================================= video clips
    playClip(names, opts) { return this.clips.play(names, opts); }
    releaseClip(ms) { return this.clips.release(ms); }

    async setItemsVisible(v, ms = TIMING.itemsFade) {
        this.itemsShown = v;
        this.itemsLayer.eventMode = v ? 'passive' : 'none';
        this.tooltip.hide();
        await this.tweens.to(this.itemsLayer, { alpha: v ? 1 : 0 }, ms, ease.linear);
    }

    // ================================================================= items
    #freeSlot(owner) { return this.slots[owner].find((s) => s.uid === null); }

    #createItem(owner, desc, slot) {
        const holder = new Container();
        const body = new Sprite(this.assets.tex(`item_${desc.id}`));
        body.anchor.set(0.5);
        const base = fit(body, ITEM_BOX);
        holder.addChild(body);
        holder.body = body;
        this.bobbers.push({ body, amp: 3, speed: 0.002, phase: Math.random() * 6.28 });
        holder.hitArea = new Rectangle(-ITEM_BOX / 2, -ITEM_BOX / 2, ITEM_BOX, ITEM_BOX);   // invisible button, bigger than the art
        holder.eventMode = 'static';
        holder.cursor = 'pointer';
        holder.uid = desc.uid;
        holder.owner = owner;
        holder.desc = desc;
        holder.slot = slot;
        holder.baseBodyScale = base;
        holder.position.set(slot.x, slot.y);
        holder.scale.set(slot.scale);
        holder.zIndex = slot.y;
        slot.uid = desc.uid;
        holder.on('pointerover', () => this.#hover(holder, true));
        holder.on('pointerout', () => this.#hover(holder, false));
        holder.on('pointertap', () => this.handlers.onItemTap?.(holder.uid));
        this.itemsLayer.addChild(holder);
        this.items.set(desc.uid, holder);
        return holder;
    }

    #hover(item, on) {
        if (!on || this.itemsLayer.alpha < 0.5) { this.tooltip.hide(); this.tweens.to(item.body, { scale: item.baseBodyScale }, 90); return; }
        this.tweens.to(item.body, { scale: item.baseBodyScale * 1.1 }, 90);
        const half = (ITEM_BOX * item.slot.scale) / 2;
        this.tooltip.show(item.desc.name, item.desc.description, item.x, item.owner === 'player' ? item.y - half : item.y + half, item.owner === 'player');
    }

    #freeItem(uid) {
        const item = this.items.get(uid);
        if (!item) return;
        item.slot.uid = null;
        this.items.delete(uid);
        item.destroy({ children: true });
    }

    getItemOwner(uid) { return this.items.get(uid)?.owner ?? null; }

    // New items rise out of a hole in the table and slide to their slots.
    async dealItems(owner, descs) {
        if (!descs.length) return;
        await this.tweens.to(this.hole, { scale: 1 }, 260, ease.outBack);
        await Promise.all(descs.map(async (desc, i) => {
            const slot = this.#freeSlot(owner);
            if (!slot) return;
            const item = this.#createItem(owner, desc, slot);
            item.position.set(LAYOUT.hole.x, LAYOUT.hole.y);
            item.scale.set(slot.scale * 0.2);
            item.alpha = 0;
            await this.tweens.wait(i * TIMING.dealStagger);
            await this.tweens.to(item, { x: slot.x, y: slot.y, scale: slot.scale, alpha: 1 }, TIMING.dealMove, ease.outBack);
        }));
        await this.tweens.to(this.hole, { scale: 0 }, 220);
    }

    // A hand (the player's from the bottom, the dealer's from the top) reaches an item, grabs it and carries it away.
    // Used for: using your own item, the dealer using his, and Adrenaline stealing (the item is "taken" from its owner).
    async takeItem(by, uid) {
        const item = this.items.get(uid);
        if (!item) return;
        const L = LAYOUT.hands[by];
        const hand = this.hands[by];
        item.zIndex = 10000;
        hand.sprite.texture = hand.open;
        hand.container.zIndex = 0;
        this.tooltip.hide();

        await this.tweens.to(hand.container, { x: item.x - L.grip.x, y: item.y - L.grip.y }, TIMING.handReach, ease.outCubic);
        hand.sprite.texture = hand.grab;
        await this.tweens.wait(TIMING.handGrab);

        const to = L.carryTo;
        await Promise.all([
            this.tweens.to(hand.container, { x: to.x, y: to.y, scale: to.scale }, TIMING.handCarry, ease.inOut),
            this.tweens.to(item, { x: to.x + L.grip.x * to.scale, y: to.y + L.grip.y * to.scale, scale: item.scale.x * to.scale }, TIMING.handCarry, ease.inOut),
        ]);
        this.#freeItem(uid);
        hand.container.scale.set(1);
        hand.container.position.set(L.rest.x, L.rest.y);
        hand.sprite.texture = hand.open;
    }

    // Rejected item use (e.g. "already at full health"): shake it and say why.
    async rejectItem(uid, reason) {
        const item = this.items.get(uid);
        const t = this.toast(reason);
        if (item) {
            const x = item.slot.x;
            for (const dx of [8, -8, 6, -6, 0]) await this.tweens.to(item, { x: x + dx }, 50, ease.linear);
        }
        await t;
    }

    // ---- item pick mode (Adrenaline / Duplicator need a second click)
    setPick(pick) {   // { sourceUid, candidates:[uid], text } | null
        this.pick = pick;
        for (const item of this.items.values()) item.body.tint = 0xffffff;
        this.pickPrompt.visible = !!pick;
        if (!pick) return;
        const src = this.items.get(pick.sourceUid);
        if (src) src.body.tint = 0x88ff88;
        pick.candidates.forEach((uid) => { const it = this.items.get(uid); if (it) it.body.tint = 0xffe066; });
        this.pickText.text = pick.text;
    }

    // ================================================================= shells
    // The reload clip's cues call these: the real shell counts are drawn (in random order, like the real game) over the video.
    async showShells(live, blank) {
        this.shellRow.removeChildren().forEach((c) => c.destroy({ children: true }));
        const kinds = shuffle([...Array(live).fill('live'), ...Array(blank).fill('blank')]);
        const { x, y, spacing } = LAYOUT.shells;
        kinds.forEach((kind, i) => {
            const s = new Sprite(this.assets.tex(`shell_${kind}`));
            s.anchor.set(0.5);
            fit(s, 120);
            s.position.set(x + (i - (kinds.length - 1) / 2) * spacing, y + 30);
            s.alpha = 0;
            this.shellRow.addChild(s);
            this.tweens.wait(i * 70).then(() => this.tweens.to(s, { alpha: 1, y }, 260));
        });
        await this.tweens.wait(kinds.length * 70 + 260);
    }

    async hideShells() {
        await this.tweens.to(this.shellRow, { alpha: 0 }, 250);
        this.shellRow.removeChildren().forEach((c) => c.destroy({ children: true }));
        this.shellRow.alpha = 1;
    }

    // Magnifying glass / burner phone result. Only shown to the player.
    async revealShell(shell, position) {
        const c = new Container();
        const s = new Sprite(this.assets.tex(`shell_${shell}`));
        s.anchor.set(0.5);
        fit(s, 170);
        const label = makeText(`SHELL ${position}: ${shell.toUpperCase()}`, { size: 38, fill: shell === 'live' ? 0xff5555 : 0x66aaff });
        label.position.set(0, 130);
        c.addChild(s, label);
        c.position.set(LAYOUT.revealPopup.x, LAYOUT.revealPopup.y);
        c.alpha = 0;
        this.overlay.addChild(c);
        await this.tweens.to(c, { alpha: 1 }, 180);
        await this.tweens.wait(TIMING.revealHold);
        await this.tweens.to(c, { alpha: 0 }, 250);
        c.destroy({ children: true });
    }

    // Beer: the shell pops out of the gun and flies off.
    async ejectShell(shell) {
        const s = new Sprite(this.assets.tex(`shell_${shell}`));
        s.anchor.set(0.5);
        fit(s, 110);
        s.position.set(LAYOUT.shotgun.x, LAYOUT.shotgun.y);
        this.world.addChild(s);
        await Promise.all([
            this.tweens.to(s, { x: s.x + 380, y: s.y - 160, rotation: 8, alpha: 0 }, 700, ease.outCubic),
        ]);
        s.destroy();
    }

    async flashShotgun(tint = 0xaa66ff) {
        for (let i = 0; i < 2; i++) {
            this.shotgun.tint = tint;
            await this.tweens.wait(110);
            this.shotgun.tint = 0xffffff;
            await this.tweens.wait(110);
        }
    }

    // ================================================================= aiming UI
    showAim(on) { this.aim.visible = on; this.btnDealer.scale.set(1); }

    // ================================================================= briefcase
    setBriefcaseDown(down) {
        this.briefcase.y = down ? LAYOUT.briefcase.y : LAYOUT.briefcase.raisedY;
    }
    async briefcaseLower() { await this.tweens.to(this.briefcase, { y: LAYOUT.briefcase.y }, TIMING.briefcaseLower, ease.outCubic); }
    async briefcaseRaise() { await this.tweens.to(this.briefcase, { y: LAYOUT.briefcase.raisedY }, TIMING.briefcaseRaise, ease.inOut); }

    // Shows the shackle buttons; resolves when the player has clicked every one.
    unlockShackles() {
        return new Promise((resolve) => {
            let left = LAYOUT.shackles.length;
            this.shackleLayer.removeChildren().forEach((c) => c.destroy());
            for (const pos of LAYOUT.shackles) {
                const s = new Sprite(this.assets.tex('shackle_closed'));
                s.anchor.set(0.5);
                s.position.set(pos.x, pos.y);
                s.eventMode = 'static';
                s.cursor = 'pointer';
                s.hitArea = new Rectangle(-60, -60, 120, 120);
                s.on('pointerover', () => { if (s.eventMode === 'static') s.scale.set(1.1); });
                s.on('pointerout', () => s.scale.set(1));
                s.on('pointertap', async () => {
                    if (s.eventMode !== 'static') return;
                    s.eventMode = 'none';
                    s.scale.set(1);
                    s.texture = this.assets.tex('shackle_open');
                    if (--left === 0) {
                        await this.tweens.wait(450);
                        this.shackleLayer.removeChildren().forEach((c) => c.destroy());
                        resolve();
                    }
                });
                this.shackleLayer.addChild(s);
            }
        });
    }

    destroy() {
        this.app.ticker.remove(this.#update, this);
    }
}
