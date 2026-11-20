import { Application } from 'pixi.js';
import { BuckshotGame } from '../../../GameLogic/BRLP_Logic/buckshotLogic.js';
import { GameLog } from '../../../GameLogic/BRLP_Logic/GameLog.js';
import { W, H, RESOLUTION, prizeFor, roundForStage, formatMoney } from './config.js';
import { Tweens } from './tween.js';
import { Assets } from './assets.js';
import { ClipPlayer } from './ClipPlayer.js';
import { Stage } from './Stage.js';
import { Screens } from './Screens.js';
import { Director } from './Director.js';
import { StatsTracker } from './Stats.js';
import { makeText } from './ui.js';

// ----------------------------------------------------------------------------------------------
//  BuckshotPixiGame = the whole visual game, mounted into any DOM element:
//      const game = new BuckshotPixiGame(divElement);  await game.init();  ...  game.destroy();
//
//  It owns the Pixi Application and the "run" (stage 1, 2, 3... double-or-nothing, money).
//  One BuckshotGame (logic) + one Director exist per round-of-play; this class creates/replaces them.
// ----------------------------------------------------------------------------------------------
export class BuckshotPixiGame {
    constructor(host) {
        this.host = host;
        this.destroyed = false;
        this.run = { stage: 1 };
        this.onKey = (e) => { if (e.code === 'KeyD' && !e.repeat && this.stage && !/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName)) this.stage.setDebug(!this.stage.debugLayer.visible); };
    }

    async init() {
        const app = new Application();
        await app.init({ width: W, height: H, background: 0x000000, antialias: true, resolution: RESOLUTION, autoDensity: true, powerPreference: 'high-performance' });
        this.app = app;
        if (this.destroyed) return this.#teardown();

        app.canvas.style.cssText = 'width:100%;height:100%;display:block;touch-action:none;';
        this.host.appendChild(app.canvas);

        this.tweens = new Tweens(app.ticker);
        this.assets = new Assets(app);
        this.clips = new ClipPlayer(app, this.tweens);

        const loading = makeText('LOADING 0%', { size: 40 });
        loading.position.set(W / 2, H / 2);
        app.stage.addChild(loading);
        const progress = { a: 0, b: 0 };
        const report = () => { loading.text = `LOADING ${Math.round(((progress.a + progress.b) / 2) * 100)}%`; };
        await Promise.all([
            this.assets.load((p) => { progress.a = p; report(); }),
            this.clips.preload((p) => { progress.b = p; report(); }),
        ]);
        if (this.destroyed) return this.#teardown();
        loading.destroy();

        this.stage = new Stage({ app, assets: this.assets, tweens: this.tweens, clips: this.clips });
        this.screens = new Screens({ layer: this.stage.screenLayer, assets: this.assets, tweens: this.tweens });
        this.stage.setHudVisible(false);
        window.addEventListener('keydown', this.onKey);

        this.#title().catch((err) => console.error('[Buckshot] run flow failed', err));   // not awaited: it lives as long as the game
    }

    destroy() {
        this.destroyed = true;
        window.removeEventListener('keydown', this.onKey);
        this.#teardown();
    }

    #teardown() {
        this.director?.destroy();
        this.tweens?.destroy();
        this.stage?.destroy();
        try { this.app?.destroy({ removeView: true }, { children: true }); } catch (e) { /* already gone */ }
        this.assets?.destroy();
        this.clips?.destroy();
        this.app = this.tweens = this.stage = this.assets = this.clips = this.director = null;
    }

    // ================================================================= run flow
    async #title() {
        await this.screens.title();
        if (this.destroyed) return;
        this.run.stage = 1;
        await this.#newGame();
    }

    // Fade to black, build a fresh game + Director, fade in and let the Director present the opening events.
    async #newGame() {
        const s = this.stage;
        this.director?.destroy();
        await s.blackout(true, 350);
        if (this.destroyed) return;
        await this.clips.release(0);
        this.screens.clear();

        const stageNo = this.run.stage;
        const game = new BuckshotGame(new GameLog(), { round: roundForStage(stageNo) });
        this.stats = new StatsTracker(game.log);
        s.resetForGame({ game, stage: stageNo, prizeText: `PLAYING FOR ${formatMoney(prizeFor(stageNo))}` });
        s.setHudVisible(true);
        await s.blackout(false, 450);
        if (this.destroyed) return;

        this.director = new Director({ game, stage: s, onGameOver: (winner) => this.#gameOver(winner, game, stageNo) });
        this.director.start();
    }

    async #gameOver(winner, game, stageNo) {
        if (this.destroyed) return;
        if (winner === 'player') await this.#win(stageNo);
        else await this.#lose(game, stageNo);
    }

    async #lose(game, stageNo) {
        const s = this.stage;
        await this.tweens.wait(700);                       // let the last frame of the death clip linger
        await s.blackout(true, 900);
        if (this.destroyed) return;
        await this.clips.release(0);
        s.setHudVisible(false);
        await this.screens.stats({
            heading: 'GAME OVER',
            sub: stageNo > 1 ? `You lost ${formatMoney(prizeFor(stageNo - 1))}` : 'The dealer wins',
            rows: this.stats.rows(),
            chamber: game.shotgun.chamber.slice(),
            buttons: [{ id: 'again', label: 'TRY AGAIN' }],
        });
        if (this.destroyed) return;
        this.run.stage = 1;
        await this.#newGame();
    }

    async #win(stageNo) {
        const s = this.stage;
        s.setTurn(null);
        const prize = prizeFor(stageNo);
        const next = prize * 2;

        if (stageNo === 1) {
            // First win: the case comes down and opens, then (on black) the choice is offered.
            const choice = await this.#briefcaseSequence({
                sub: `You won ${formatMoney(prize)}`,
                buttons: [
                    { id: 'double', label: 'DOUBLE OR NOTHING' },
                    { id: 'take', label: `KEEP ${formatMoney(prize)}` },
                ],
                extra: `Double or nothing: ${formatMoney(next)}`,
            });
            if (this.destroyed) return;
            if (choice === 'double') {
                await this.#closeBriefcase();
                if (this.destroyed) return;
                this.run.stage = 2;
            } else {
                this.run.stage = 1;
            }
            await this.#newGame();
            return;
        }

        // Later wins: no case yet. Ask first.
        const choice = await this.screens.prompt({ prize: formatMoney(prize), nextPrize: formatMoney(next) });
        if (this.destroyed) return;
        this.screens.clear();
        if (choice === 'double') {
            this.run.stage = stageNo + 1;
            await this.#newGame();                          // no briefcase at all, straight into the next game
            return;
        }
        await this.#briefcaseSequence({
            sub: `You take home ${formatMoney(prize)}`,
            buttons: [{ id: 'again', label: 'PLAY AGAIN' }],
        });
        if (this.destroyed) return;
        this.run.stage = 1;
        await this.#newGame();
    }

    // case lowers -> click both shackles -> case-opening video -> fade to black -> stats. Resolves with the clicked button id.
    async #briefcaseSequence({ sub, buttons, extra }) {
        const s = this.stage;
        await s.briefcaseLower();
        await s.unlockShackles();
        if (this.destroyed) return null;
        await s.playClip(['briefcase_open'], { hold: true });
        await s.blackout(true, 700);
        if (this.destroyed) return null;
        await this.clips.release(0);
        s.setHudVisible(false);
        return this.screens.stats({
            heading: 'CONGRATULATIONS',
            sub: extra ? `${sub}\n${extra}` : sub,
            rows: this.stats.rows(),
            buttons,
        });
    }

    // From the black stats screen: the case-closing video fades in, then the case sprite lifts away.
    async #closeBriefcase() {
        const s = this.stage;
        this.screens.clear();                               // the fade rectangle is still fully black
        s.setBriefcaseDown(true);                           // the still underneath = "case closed on the table"
        const playing = s.playClip(['briefcase_close'], { hold: true });
        await s.wait(60);
        await s.blackout(false, 500);
        await playing;
        if (this.destroyed) return;
        await s.releaseClip();
        await s.briefcaseRaise();
    }
}
