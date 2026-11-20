import { Container, Graphics, Text } from 'pixi.js';
import { FONT, FONT_MONO } from './config.js';

export const makeText = (text, { size = 26, fill = 0xffffff, font = FONT, align = 'center', anchor = [0.5, 0.5], stroke = true, wrap = 0 } = {}) => {
    const t = new Text({
        text,
        style: {
            fontFamily: font, fontSize: size, fill, align,
            ...(stroke ? { stroke: { color: 0x000000, width: Math.max(2, size / 8) } } : {}),
            ...(wrap ? { wordWrap: true, wordWrapWidth: wrap } : {}),
        },
    });
    t.anchor.set(...anchor);
    return t;
};

// A text button. To use your own art later, replace the Graphics background with a Sprite.
export function makeButton(label, { w = 320, h = 64, size = 30, fill = 0x111111, border = 0xffffff, onTap } = {}) {
    const c = new Container();
    const bg = new Graphics();
    const draw = (hover) => bg.clear().roundRect(-w / 2, -h / 2, w, h, 10)
        .fill({ color: hover ? 0x2a2a2a : fill, alpha: 0.85 }).stroke({ width: 3, color: hover ? 0xffd34d : border });
    draw(false);
    const text = makeText(label, { size, fill: 0xffffff });
    c.addChild(bg, text);
    c.eventMode = 'static';
    c.cursor = 'pointer';
    c.on('pointerover', () => { draw(true); c.scale.set(1.04); });
    c.on('pointerout',  () => { draw(false); c.scale.set(1); });
    c.on('pointertap',  () => onTap?.());
    c.setLabel = (s) => { text.text = s; };
    return c;
}

// Floating one-line message near the top of the screen.
export class Toast {
    constructor(tweens, x, y) {
        this.tweens = tweens;
        this.container = new Container();
        this.container.position.set(x, y);
        this.container.alpha = 0;
        this.bg = new Graphics();
        this.text = makeText('', { size: 28, font: FONT_MONO });
        this.container.addChild(this.bg, this.text);
        this.token = 0;
    }

    async show(msg, ms = 1600) {
        const my = ++this.token;
        this.text.text = msg;
        const w = this.text.width + 40, h = this.text.height + 20;
        this.bg.clear().roundRect(-w / 2, -h / 2, w, h, 8).fill({ color: 0x000000, alpha: 0.75 });
        await this.tweens.to(this.container, { alpha: 1 }, 120);
        await this.tweens.wait(ms);
        if (my === this.token) await this.tweens.to(this.container, { alpha: 0 }, 250);
    }
}

// Item description bubble: fades in quickly on hover.
export class Tooltip {
    constructor(tweens, bounds) {
        this.tweens = tweens;
        this.bounds = bounds;
        this.container = new Container();
        this.container.alpha = 0;
        this.container.visible = false;
        this.bg = new Graphics();
        this.title = makeText('', { size: 24, anchor: [0, 0], fill: 0xffd34d });
        this.body = makeText('', { size: 17, anchor: [0, 0], font: FONT_MONO, wrap: 300, align: 'left', stroke: false });
        this.container.addChild(this.bg, this.title, this.body);
    }

    show(name, description, x, y, above = true) {
        this.title.text = name;
        this.body.text = description;
        this.title.position.set(12, 8);
        this.body.position.set(12, 8 + this.title.height + 4);
        const w = Math.max(this.title.width, this.body.width) + 24;
        const h = this.body.y + this.body.height + 10;
        this.bg.clear().roundRect(0, 0, w, h, 8).fill({ color: 0x000000, alpha: 0.88 }).stroke({ width: 2, color: 0xffd34d, alpha: 0.8 });
        let px = x - w / 2;
        let py = above ? y - h - 14 : y + 14;
        px = Math.max(8, Math.min(this.bounds.w - w - 8, px));
        py = Math.max(8, Math.min(this.bounds.h - h - 8, py));
        this.container.position.set(px, py);
        this.container.visible = true;
        this.tweens.to(this.container, { alpha: 1 }, 110);
    }

    hide() {
        this.tweens.to(this.container, { alpha: 0 }, 90).then(() => { if (this.container.alpha === 0) this.container.visible = false; });
    }
}
