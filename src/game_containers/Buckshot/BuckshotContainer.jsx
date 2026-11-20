import { useEffect, useRef, useState } from 'react';
import { BuckshotPixiGame } from './pixi/BuckshotPixiGame.js';
import BuckshotLogContainer from './BuckshotLogContainer.jsx';

// The game always renders at 1280x720; this only changes how big the canvas is shown (CSS), so it never costs performance.
const SIZES = [
    { id: 'fit', label: 'Fit window' },
    { id: '1280', label: '1280' },
    { id: '960', label: '960' },
    { id: '640', label: '640' },
];
const STORAGE_KEY = 'buckshot.size';
const TOOLBAR_H = 44;

const BuckshotRouletteLitePlus = () => {
    const wrapRef = useRef(null);
    const hostRef = useRef(null);
    const [size, setSize] = useState(() => localStorage.getItem(STORAGE_KEY) || 'fit');
    const [logMode, setLogMode] = useState(false);          // the old text-log UI, handy for debugging the logic
    const [avail, setAvail] = useState({ w: 1280, h: 720 });

    // mount / unmount the Pixi game (it survives size changes; only the CSS box changes)
    useEffect(() => {
        if (logMode || !hostRef.current) return undefined;
        const game = new BuckshotPixiGame(hostRef.current);
        game.init().catch((err) => console.error('[Buckshot] failed to start', err));
        return () => game.destroy();
    }, [logMode]);

    // how much room is there? (for "Fit window")
    useEffect(() => {
        const measure = () => {
            const el = wrapRef.current;
            if (!el) return;
            const top = el.getBoundingClientRect().top;
            setAvail({ w: el.clientWidth, h: Math.max(240, window.innerHeight - top - TOOLBAR_H - 16) });
        };
        measure();
        window.addEventListener('resize', measure);
        const ro = new ResizeObserver(measure);
        if (wrapRef.current) ro.observe(wrapRef.current);
        return () => { window.removeEventListener('resize', measure); ro.disconnect(); };
    }, []);

    const pickSize = (id) => { setSize(id); localStorage.setItem(STORAGE_KEY, id); };
    const width = size === 'fit'
        ? Math.floor(Math.min(avail.w, avail.h * (16 / 9)))
        : Math.min(Number(size), avail.w);                  // never wider than its container

    if (logMode) {
        return (
            <div>
                <button onClick={() => setLogMode(false)} style={{ marginBottom: 8 }}>Back to visual game</button>
                <BuckshotLogContainer />
            </div>
        );
    }

    return (
        <div ref={wrapRef} style={{ width: '100%' }}>
            <div style={{ height: TOOLBAR_H, display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                <span>Size:</span>
                {SIZES.map((s) => (
                    <button key={s.id} onClick={() => pickSize(s.id)} style={size === s.id ? { outline: '2px solid #ffd34d' } : undefined}>{s.label}</button>
                ))}
                <span style={{ margin: '0 8px' }}>|</span>
                <button onClick={() => setLogMode(true)}>Log view</button>
                <span style={{ fontSize: 12, opacity: 0.7 }}>press D in-game for the debug overlay</span>
            </div>
            <div style={{ width, aspectRatio: '16 / 9', margin: '0 auto', background: '#000', overflow: 'hidden' }}>
                <div ref={hostRef} style={{ width: '100%', height: '100%' }} />
            </div>
        </div>
    );
};

export default BuckshotRouletteLitePlus;
