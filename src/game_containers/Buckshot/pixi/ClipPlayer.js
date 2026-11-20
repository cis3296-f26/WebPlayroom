import { Container, Graphics, Sprite, Text, Texture, VideoSource } from 'pixi.js';
import { W, H, CLIPS, FONT_MONO, TIMING } from './config.js';
import { assetUrl } from './assets.js';

// Plays the pre-rendered cutscene videos on a full-screen layer.
//
//   await clips.play(['player_shoot_dealer_live'])                 // plays, then crossfades back to the still scene underneath
//   await clips.play(['shotgun_pickup'], { hold: true })           // plays and KEEPS the last frame on screen (aiming pose)
//   await clips.release()                                          // fade the held frame away
//
// * Every clip is downloaded into memory (blob URL) at start-up, so playback never waits on the network.
// * `names` is a fallback list: the first clip whose file really exists is played. If none exist, a labelled
//   placeholder is shown instead (unless every candidate is `optional`, then nothing plays).
// * `cues` = { cueName: fn }. The cue times come from CLIPS[name].cues.
// * The video element itself is never added to the page: it is a Pixi texture, so the HUD can draw on top of it.

const nextFrame = (video) => new Promise((resolve) => {
    const done = () => resolve();
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(done);
    else video.addEventListener('timeupdate', done, { once: true });
    setTimeout(done, 400);   // never hang on a browser that doesn't deliver the event
});

const once = (el, ev, timeout = 1000) => new Promise((resolve) => {
    const h = () => { clearTimeout(t); resolve(); };
    const t = setTimeout(() => { el.removeEventListener(ev, h); resolve(); }, timeout);
    el.addEventListener(ev, h, { once: true });
});

export class ClipPlayer {
    constructor(app, tweens) {
        this.app = app;
        this.tweens = tweens;
        this.layer = new Container();
        this.layer.visible = false;
        this.sprite = new Sprite(Texture.EMPTY);
        this.sprite.width = W; this.sprite.height = H;
        this.layer.addChild(this.sprite);
        this.placeholder = this.#buildPlaceholder();
        this.layer.addChild(this.placeholder.container);

        this.manifest = this.#expandManifest();
        this.real = new Map();        // name -> { video, source, texture, url, duration }
        this.holding = false;
        this.token = 0;               // bumps on every play() so a stale 'ended' never resolves a newer clip
        this.missing = [];
    }

    // ---- loading -----------------------------------------------------------------
    #expandManifest() {
        const m = { ...CLIPS };
        for (const [name, def] of Object.entries(CLIPS)) {
            if (/^(player_|dealer_|shotgun_pickup)/.test(name) && !name.endsWith('_sawed')) {
                m[`${name}_sawed`] = { ...def, src: def.src.replace(/\.mp4$/, '_sawed.mp4'), optional: true, variantOf: name };
            }
        }
        return m;
    }

    async preload(onProgress = () => {}) {
        const names = Object.keys(this.manifest);
        let done = 0;
        await Promise.all(names.map(async (name) => {
            const ok = await this.#loadOne(name, this.manifest[name]);
            if (!ok && !this.manifest[name].variantOf && !this.manifest[name].optional) this.missing.push(name);
            onProgress(++done / names.length);
        }));
        if (this.missing.length) console.info(`[Buckshot] ${this.missing.length} required video(s) not found, showing placeholders:`, this.missing.join(', '));
    }

    async #loadOne(name, def) {
        try {
            const res = await fetch(assetUrl(def.src));
            if (!res.ok || !(res.headers.get('content-type') || '').startsWith('video/')) return false;
            const url = URL.createObjectURL(await res.blob());
            const video = document.createElement('video');
            video.muted = true; video.playsInline = true; video.preload = 'auto'; video.src = url;
            await new Promise((resolve, reject) => {
                video.addEventListener('canplaythrough', resolve, { once: true });
                video.addEventListener('error', () => reject(new Error('decode error')), { once: true });
                setTimeout(resolve, 10000);
                video.load();
            });
            const source = new VideoSource({ resource: video, autoPlay: false, autoLoad: true, loop: false });
            this.real.set(name, { video, source, texture: new Texture({ source }), url, duration: video.duration || 0 });
            return true;
        } catch (err) {
            console.warn(`[Buckshot] video "${name}" could not be loaded:`, err.message);
            return false;
        }
    }

    // ---- choosing ------------------------------------------------------------------
    // -> { name, real } | null
    pick(names) {
        for (const n of names) if (this.real.has(n)) return { name: n, real: true };
        // nothing real. Show a placeholder for the first REQUIRED, non-variant candidate; if all are optional, skip.
        for (const n of names) {
            const def = this.manifest[n];
            if (def && !def.optional && !def.variantOf) return { name: n, real: false };
        }
        return null;
    }

    // ---- playing ---------------------------------------------------------------------
    async play(names, { hold = false, cues = {}, fadeMs = TIMING.clipFade } = {}) {
        const pick = this.pick(names);
        if (!pick) return null;
        const my = ++this.token;
        this.tweens.to(this.layer, { alpha: 1 }, 0);

        const def = this.manifest[pick.name];
        const fired = new Set();
        const fire = (t) => {
            for (const [cue, at] of Object.entries(def.cues || {})) {
                if (!fired.has(cue) && t >= at) {
                    fired.add(cue);
                    try { Promise.resolve(cues[cue]?.()).catch((e) => console.error(e)); } catch (e) { console.error(e); }
                }
            }
        };

        if (pick.real) await this.#playReal(this.real.get(pick.name), fire, my);
        else await this.#playPlaceholder(pick.name, def, fire);

        fire(Infinity);                       // make sure no cue is ever skipped (e.g. tab was in the background)
        if (my !== this.token) return pick.name;
        this.holding = true;
        if (!hold) await this.release(fadeMs);
        return pick.name;
    }

    async #playReal(clip, fire, my) {
        const { video, source } = clip;
        video.pause();
        if (video.currentTime > 0.001) { video.currentTime = 0; await once(video, 'seeked'); }
        const ended = new Promise((resolve) => {
            const done = () => { video.removeEventListener('ended', done); resolve(); };
            video.addEventListener('ended', done);
            setTimeout(done, (clip.duration + 2) * 1000 + 500);   // safety net
        });
        try { await video.play(); } catch (err) { console.warn('[Buckshot] video.play() failed, skipping clip', err); return; }
        await nextFrame(video);                      // wait until a real frame exists so we never flash an empty texture
        if (my !== this.token) return;
        this.placeholder.container.visible = false;
        this.sprite.texture = clip.texture;
        this.sprite.visible = true;
        this.layer.visible = true;

        const tick = () => fire(video.currentTime);
        this.app.ticker.add(tick);
        try { await ended; } finally { this.app.ticker.remove(tick); }
        source.update();                             // make sure the texture holds the true LAST frame
    }

    async #playPlaceholder(name, def, fire) {
        const maxCue = Math.max(0, ...Object.values(def.cues || {}));
        const total = Math.max(def.placeholderMs || 1400, (maxCue + 0.5) * 1000);
        const p = this.placeholder;
        p.label.text = `▶ VIDEO PLACEHOLDER\n\n${name}\n\nadd public/buckshot/${def.src}`;
        p.container.visible = true;
        this.sprite.visible = false;
        this.layer.visible = true;
        let elapsed = 0;
        await new Promise((resolve) => {
            const tick = (t) => {
                elapsed += t.deltaMS;
                p.bar.clear().rect(160, H - 90, (W - 320) * Math.min(1, elapsed / total), 14).fill(0xffffff);
                fire(elapsed / 1000);
                if (elapsed >= total) { this.app.ticker.remove(tick); resolve(); }
            };
            this.app.ticker.add(tick);
        });
    }

    // Fade the (held) frame away, revealing the still scene underneath. Call this AFTER you have updated the still scene.
    async release(fadeMs = TIMING.clipFade) {
        if (!this.holding && !this.layer.visible) return;
        this.holding = false;
        const my = this.token;
        await this.tweens.to(this.layer, { alpha: 0 }, fadeMs);
        if (my !== this.token) return;               // another clip started during the fade
        this.layer.visible = false;
        this.layer.alpha = 1;
        this.sprite.texture = Texture.EMPTY;
        this.placeholder.container.visible = false;
    }

    #buildPlaceholder() {
        const container = new Container();
        container.visible = false;
        container.addChild(new Graphics().rect(0, 0, W, H).fill(0x0d0f16));
        container.addChild(new Graphics().rect(20, 20, W - 40, H - 40).stroke({ width: 4, color: 0x5566aa }));
        const label = new Text({ text: '', style: { fontFamily: FONT_MONO, fontSize: 30, fill: 0xcdd6ff, align: 'center', lineHeight: 40 } });
        label.anchor.set(0.5);
        label.position.set(W / 2, H / 2 - 30);
        const bar = new Graphics();
        container.addChild(label, bar);
        return { container, label, bar };
    }

    destroy() {
        this.token++;
        this.real.forEach(({ video, texture, url }) => { texture.destroy(true); video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url); });
        this.real.clear();
        this.layer.destroy({ children: true });
    }
}
