import { Container, Graphics, Text, Texture } from 'pixi.js';
import { ASSET_ROOT, TEXTURES, FONT_MONO } from './config.js';

// Loads every texture in config.TEXTURES. A missing or broken file becomes a labelled placeholder rectangle, so the game never breaks.
// NOTE: Vite/CRA dev servers answer unknown URLs with index.html (HTTP 200!), so we check the content-type instead of trusting `res.ok`.

export const assetUrl = (rel) => `${ASSET_ROOT}/${rel}`;

export class Assets {
    constructor(app) {
        this.app = app;
        this.textures = new Map();
        this.missing = [];
    }

    tex(key) {
        const t = this.textures.get(key);
        if (!t) throw new Error(`[Assets] unknown texture key "${key}" (add it to TEXTURES in config.js)`);
        return t;
    }

    async load(onProgress = () => {}) {
        const entries = Object.entries(TEXTURES);
        let done = 0;
        await Promise.all(entries.map(async ([key, def]) => {
            let texture = await this.#tryLoad(def.src);
            if (!texture) { this.missing.push(key); texture = this.#placeholder(def); }
            this.textures.set(key, texture);
            onProgress(++done / entries.length);
        }));
        if (this.missing.length) console.info(`[Buckshot] ${this.missing.length} texture(s) not found, using placeholders:`, this.missing.join(', '));
    }

    async #tryLoad(rel) {
        try {
            const res = await fetch(assetUrl(rel));
            if (!res.ok || !(res.headers.get('content-type') || '').startsWith('image/')) return null;
            const bitmap = await createImageBitmap(await res.blob());
            return Texture.from(bitmap);
        } catch { return null; }
    }

    #placeholder({ size: [w, h], color, label }) {
        const c = new Container();
        c.addChild(new Graphics().roundRect(0, 0, w, h, 10).fill({ color }).stroke({ width: 3, color: 0xffffff, alpha: 0.55 }));
        const t = new Text({
            text: label,
            style: { fontFamily: FONT_MONO, fontSize: Math.max(11, Math.min(22, Math.floor(w / 9))), fill: 0xffffff, align: 'center', wordWrap: true, wordWrapWidth: w - 10, stroke: { color: 0x000000, width: 3 } },
        });
        t.anchor.set(0.5);
        t.position.set(w / 2, h / 2);
        c.addChild(t);
        const texture = this.app.renderer.generateTexture({ target: c, resolution: 1 });
        c.destroy({ children: true });
        return texture;
    }

    destroy() { this.textures.forEach((t) => t.destroy(true)); this.textures.clear(); }
}
