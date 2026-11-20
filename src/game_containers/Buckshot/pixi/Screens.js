import { Container, Graphics, Sprite } from 'pixi.js';
import { W, H, FONT_MONO } from './config.js';
import { makeButton, makeText } from './ui.js';

// Title screen, double-or-nothing prompt and the stats / game-over screens. All Pixi text + buttons, so you can restyle them freely.
// Every method returns a promise that resolves with the id of the button the player clicked.
export class Screens {
    constructor({ layer, assets, tweens }) {
        this.layer = layer;
        this.assets = assets;
        this.tweens = tweens;
        this.current = null;
    }

    clear() {
        this.layer.removeChildren().forEach((c) => c.destroy({ children: true }));
        this.current = null;
    }

    async #show(build) {
        this.clear();
        const root = new Container();
        root.alpha = 0;
        this.layer.addChild(root);
        this.current = root;
        const result = new Promise((resolve) => build(root, resolve));
        await this.tweens.to(root, { alpha: 1 }, 300);
        return result;
    }

    #buttons(root, resolve, buttons, y) {
        const w = 400, gap = 24;
        const total = buttons.length * w + (buttons.length - 1) * gap;
        buttons.forEach((b, i) => {
            const btn = makeButton(b.label, { w, h: 76, size: 26, onTap: () => resolve(b.id) });
            btn.position.set(W / 2 - total / 2 + w / 2 + i * (w + gap), y);
            root.addChild(btn);
        });
    }

    title() {
        return this.#show((root, resolve) => {
            const bg = new Sprite(this.assets.tex('bg_title'));
            bg.width = W; bg.height = H;
            root.addChild(bg);
            const t = makeText('BUCKSHOT ROULETTE\nLITE PLUS', { size: 84, fill: 0xe8e1c9 });
            t.position.set(W / 2, 250);
            root.addChild(t);
            this.#buttons(root, resolve, [{ id: 'start', label: 'START' }], 470);
        });
    }

    // Shown over the table after a win at stage 2+: keep the money or go again.
    prompt({ prize, nextPrize }) {
        return this.#show((root, resolve) => {
            root.addChild(new Graphics().rect(0, 0, W, H).fill({ color: 0x000000, alpha: 0.6 }));
            const a = makeText(`YOU COULD WIN ${prize}`, { size: 64, fill: 0xffd34d });
            a.position.set(W / 2, 230);
            const b = makeText(`Double or nothing for ${nextPrize}?`, { size: 34, font: FONT_MONO });
            b.position.set(W / 2, 310);
            root.addChild(a, b);
            this.#buttons(root, resolve, [
                { id: 'take', label: `KEEP ${prize}` },
                { id: 'double', label: 'DOUBLE OR NOTHING' },
            ], 450);
        });
    }

    // Full black stats screen. `rows` = [[label, value]]. `chamber` = ['live'|'blank'] (shown on the game over screen only).
    stats({ heading, sub, rows, chamber = null, buttons }) {
        return this.#show((root, resolve) => {
            root.addChild(new Graphics().rect(0, 0, W, H).fill(0x000000));
            const h = makeText(heading, { size: 72, fill: 0xe8e1c9 });
            h.position.set(W / 2, 70);
            root.addChild(h);
            if (sub) {
                const s = makeText(sub, { size: 28, fill: 0xffd34d, font: FONT_MONO });
                s.position.set(W / 2, 150);
                root.addChild(s);
            }
            rows.forEach(([label, value], i) => {
                const y = 215 + i * 32;
                const l = makeText(label, { size: 24, font: FONT_MONO, anchor: [1, 0.5], stroke: false, fill: 0xaaaaaa });
                const v = makeText(String(value), { size: 24, font: FONT_MONO, anchor: [0, 0.5], stroke: false });
                l.position.set(W / 2 - 20, y);
                v.position.set(W / 2 + 20, y);
                root.addChild(l, v);
            });
            if (chamber) {
                const y = 215 + rows.length * 32 + 30;
                const cap = makeText(chamber.length ? 'SHELLS LEFT IN THE CHAMBER (next shell first)' : 'THE CHAMBER WAS EMPTY', { size: 22, font: FONT_MONO, stroke: false, fill: 0xaaaaaa });
                cap.position.set(W / 2, y);
                root.addChild(cap);
                chamber.forEach((kind, i) => {
                    const sp = new Sprite(this.assets.tex(`shell_${kind}`));
                    sp.anchor.set(0.5);
                    sp.scale.set(Math.min(70 / sp.texture.width, 70 / sp.texture.height));
                    sp.position.set(W / 2 + (i - (chamber.length - 1) / 2) * 54, y + 50);
                    root.addChild(sp);
                });
            }
            this.#buttons(root, resolve, buttons, H - 70);
        });
    }
}
