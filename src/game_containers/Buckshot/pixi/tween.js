// Tiny promise-based tween engine driven by the Pixi ticker, so we don't need another dependency.
//   await tweens.to(sprite, { x: 100, alpha: 0, scale: 1.5 }, 300)
// `scale` is a shortcut for uniform scale. A new tween on the same property cancels the old one.

export const ease = {
    linear:   (t) => t,
    outCubic: (t) => 1 - (1 - t) ** 3,
    inCubic:  (t) => t ** 3,
    inOut:    (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
    outBack:  (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; },
};

const read  = (o, k) => (k === 'scale' ? o.scale.x : o[k]);
const write = (o, k, v) => { if (k === 'scale') o.scale.set(v); else o[k] = v; };

export class Tweens {
    constructor(ticker) {
        this.active = new Set();
        this.timers = new Set();
        this.ticker = ticker;
        this.tick = (t) => this.update(t.deltaMS);
        ticker.add(this.tick);
    }

    to(target, props, ms, easing = ease.outCubic) {
        return new Promise((resolve) => {
            if (!target || target.destroyed) return resolve();
            const keys = Object.keys(props);
            // cancel older tweens fighting over the same properties
            for (const tw of this.active) {
                if (tw.target !== target) continue;
                tw.keys = tw.keys.filter((k) => !keys.includes(k));
                if (tw.keys.length === 0) { this.active.delete(tw); tw.resolve(); }
            }
            if (ms <= 0) { keys.forEach((k) => write(target, k, props[k])); return resolve(); }
            const from = Object.fromEntries(keys.map((k) => [k, read(target, k)]));
            this.active.add({ target, keys, from, to: props, ms, t: 0, easing, resolve });
        });
    }

    wait(ms) {
        return new Promise((resolve) => { this.timers.add({ left: ms, resolve }); });
    }

    update(dt) {
        for (const tw of [...this.active]) {
            if (tw.target.destroyed) { this.active.delete(tw); tw.resolve(); continue; }
            tw.t = Math.min(tw.ms, tw.t + dt);
            const e = tw.easing(tw.t / tw.ms);
            for (const k of tw.keys) write(tw.target, k, tw.from[k] + (tw.to[k] - tw.from[k]) * e);
            if (tw.t >= tw.ms) { this.active.delete(tw); tw.resolve(); }
        }
        for (const tm of [...this.timers]) {
            tm.left -= dt;
            if (tm.left <= 0) { this.timers.delete(tm); tm.resolve(); }
        }
    }

    // finish everything instantly (used when the game is torn down)
    destroy() {
        this.ticker.remove(this.tick);
        this.active.forEach((t) => t.resolve());
        this.timers.forEach((t) => t.resolve());
        this.active.clear();
        this.timers.clear();
    }
}
