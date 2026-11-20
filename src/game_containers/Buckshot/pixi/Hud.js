import { Container, Sprite } from 'pixi.js';
import { LAYOUT, TIMING, FONT_MONO } from './config.js';
import { makeText } from './ui.js';

const ICON = 44;
const fit = (sprite, box) => { sprite.scale.set(Math.min(box / sprite.texture.width, box / sprite.texture.height)); return sprite; };

// Always-on-screen HP rows (+ helmet / handcuff icons), turn label and the "stage / prize" label.
export class Hud {
    constructor(assets, tweens) {
        this.assets = assets;
        this.tweens = tweens;
        this.container = new Container();
        this.rows = {};
        for (const who of ['player', 'dealer']) this.rows[who] = this.#buildRow(who);
        this.turnText = makeText('', { size: 26, font: FONT_MONO });
        this.turnText.position.set(LAYOUT.hud.turn.x, LAYOUT.hud.turn.y);
        this.runText = makeText('', { size: 24, font: FONT_MONO, anchor: [1, 0.5] });
        this.runText.position.set(LAYOUT.hud.run.x, LAYOUT.hud.run.y);
        this.container.addChild(this.turnText, this.runText);
    }

    #buildRow(who) {
        const pos = LAYOUT.hud[who];
        const container = new Container();
        container.position.set(pos.x, pos.y);
        const label = makeText(pos.label, { size: 22, anchor: [0, 0.5], font: FONT_MONO });
        label.position.set(0, -ICON / 2 - 12);
        const icons = new Container();
        const status = new Container();
        container.addChild(label, icons, status);
        this.container.addChild(container);
        return { container, icons, status, max: 0, hp: 0, baseX: pos.x };
    }

    setHp(who, hp, max) {
        const row = this.rows[who];
        if (row.max !== max) {   // (re)build the icon row
            row.icons.removeChildren().forEach((c) => c.destroy());
            for (let i = 0; i < max; i++) {
                const s = fit(new Sprite(this.assets.tex('hp_full')), ICON);
                s.anchor.set(0, 0.5);
                s.position.set(i * LAYOUT.hud.iconSpacing, 0);
                row.icons.addChild(s);
            }
            row.status.position.set(max * LAYOUT.hud.iconSpacing + 16, 0);
            row.max = max;
        }
        row.hp = hp;
        row.icons.children.forEach((s, i) => {
            s.texture = this.assets.tex(i < hp ? 'hp_full' : 'hp_empty');
            fit(s, ICON);
        });
    }

    async hit(who, hp, max, amount) {
        const row = this.rows[who];
        this.setHp(who, hp, max);
        const sign = amount < 0 ? `${amount}` : `+${amount}`;
        const pop = makeText(sign, { size: 40, fill: amount < 0 ? 0xff4d4d : 0x4dff88 });
        pop.position.set(max * LAYOUT.hud.iconSpacing / 2, who === 'player' ? -60 : 60);
        row.container.addChild(pop);
        const floatUp = this.tweens.to(pop, { y: pop.y - 30, alpha: 0 }, TIMING.hpShake + 300);
        if (amount < 0) {
            const x = row.baseX;
            for (const dx of [10, -10, 7, -7, 3, 0]) await this.tweens.to(row.container, { x: x + dx }, TIMING.hpShake / 6, (t) => t);
        }
        await floatUp;
        pop.destroy();
    }

    setStatus(who, { helmet, handcuffed }) {
        const row = this.rows[who];
        row.status.removeChildren().forEach((c) => c.destroy());
        let n = 0;
        for (const [on, key] of [[helmet, 'icon_helmet'], [handcuffed, 'icon_handcuffs']]) {
            if (!on) continue;
            const s = fit(new Sprite(this.assets.tex(key)), ICON);
            s.anchor.set(0, 0.5);
            s.position.set(n++ * (ICON + 8), 0);
            row.status.addChild(s);
        }
    }

    setTurn(text) { this.turnText.text = text; }
    setRun(text) { this.runText.text = text; }
    show(v) { this.container.visible = v; }
}
