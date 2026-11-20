// ============================================================================
//  config.js  -  EVERYTHING you will want to tweak lives in this file.
//
//  * TEXTURES  -> which image file each sprite uses (drop PNGs into public/buckshot/images/)
//  * CLIPS     -> which video file each cutscene uses (drop MP4s into public/buckshot/videos/)
//  * LAYOUT    -> where things sit on the 1280x720 canvas
//  * TIMING    -> how long things take
//
//  Any texture/clip whose file is missing is replaced by a labelled placeholder, so the whole game
//  is playable right now and gets nicer file by file as you add art. Press  D  in-game for the debug overlay.
// ============================================================================

export const W = 1280;
export const H = 720;
export const RESOLUTION = 1;                 // 1 = fastest. Raise to 2 for crisper text/vectors on HiDPI screens.
export const ASSET_ROOT = '/buckshot';       // served from  public/buckshot/  (Vite/CRA). Change if your static folder differs.

// ---------------------------------------------------------------- run / money
export const PRIZE_BASE = 70000;                          // payout for winning stage 1; doubles every stage after
export const prizeFor = (stage) => PRIZE_BASE * 2 ** (stage - 1);
export const roundForStage = (stage) => Math.min(stage, 3);   // feeds Shotgun.initializeBullets(): bigger shell counts at higher stages
export const formatMoney = (n) => '$' + n.toLocaleString('en-US');

// ---------------------------------------------------------------- textures
// size = placeholder size AND the size items are fitted into. Real PNGs may be any size; they are used as-is.
// Everything is centred (anchor 0.5) on its LAYOUT position.
const item = (id, color) => [`item_${id}`, { src: `images/items/${id}.png`, size: [110, 110], color, label: id.replace('_', '\n') }];

export const TEXTURES = {
    bg_table:            { src: 'images/bg_table.png',            size: [1280, 720], color: 0x2a211b, label: 'bg_table (1280x720)\nstill of the table, NO items, NO dealer' },
    bg_title:            { src: 'images/bg_title.png',            size: [1280, 720], color: 0x0b0b10, label: 'bg_title' },
    dealer:              { src: 'images/dealer.png',              size: [420, 520],  color: 0x4a4a5a, label: 'dealer' },
    dealer_helmet:       { src: 'images/dealer_helmet.png',       size: [200, 130],  color: 0x6a8a6a, label: 'dealer\nhelmet' },
    shotgun_table:       { src: 'images/shotgun_table.png',       size: [440, 110],  color: 0x6b4a2b, label: 'shotgun_table\n(click me)' },
    shotgun_table_sawed: { src: 'images/shotgun_table_sawed.png', size: [330, 110],  color: 0x8b5a2b, label: 'shotgun_table_sawed' },
    hand_open:           { src: 'images/hand_open.png',           size: [200, 260],  color: 0xd9b38c, label: 'hand_open' },
    hand_grab:           { src: 'images/hand_grab.png',           size: [200, 260],  color: 0xc99a70, label: 'hand_grab' },
    dealer_hand_open:    { src: 'images/dealer_hand_open.png',    size: [200, 260],  color: 0x9aa0b4, label: 'dealer_hand_open' },
    dealer_hand_grab:    { src: 'images/dealer_hand_grab.png',    size: [200, 260],  color: 0x8a90a4, label: 'dealer_hand_grab' },
    shell_live:          { src: 'images/shell_live.png',          size: [44, 120],   color: 0xc0392b, label: 'LIVE' },
    shell_blank:         { src: 'images/shell_blank.png',         size: [44, 120],   color: 0x2e6fb0, label: 'BLANK' },
    table_hole:          { src: 'images/table_hole.png',          size: [260, 90],   color: 0x050505, label: 'table_hole' },
    hp_full:             { src: 'images/hp_full.png',             size: [44, 44],    color: 0x3ddc84, label: 'HP' },
    hp_empty:            { src: 'images/hp_empty.png',            size: [44, 44],    color: 0x333a36, label: '' },
    icon_helmet:         { src: 'images/icon_helmet.png',         size: [44, 44],    color: 0x6a8a6a, label: 'helm' },
    icon_handcuffs:      { src: 'images/icon_handcuffs.png',      size: [44, 44],    color: 0xb0b0b0, label: 'cuff' },
    briefcase_hand:      { src: 'images/briefcase_hand.png',      size: [560, 420],  color: 0x3b3b3b, label: 'briefcase_hand\n(hand lowering a closed case)' },
    shackle_closed:      { src: 'images/shackle_closed.png',      size: [120, 120],  color: 0x777777, label: 'shackle\nclosed' },
    shackle_open:        { src: 'images/shackle_open.png',        size: [120, 120],  color: 0x44aa66, label: 'shackle\nopen' },
    ...Object.fromEntries([
        item('magnifying_glass', 0x4aa3a3), item('polarizer', 0xa34aa3), item('helmet', 0x6a8a6a), item('saw', 0xa3a34a),
        item('beer', 0xc9a227), item('adrenaline', 0xd35470), item('duplicator', 0x5470d3), item('burner_phone', 0x555566),
        item('cigarettes', 0xcfcfcf), item('handcuffs', 0x999999),
    ]),
};
export const ITEM_BOX = 110;   // item textures are scaled to fit inside this square

// ---------------------------------------------------------------- video clips
// src      : file under public/buckshot/
// optional : if the file is missing the clip is silently skipped (no placeholder). Required clips show a placeholder instead.
// cues     : named moments (seconds) the game reacts to while the clip plays
// placeholderMs : how long the placeholder lasts when the real file is missing
//
// Every clip named  player_* / dealer_* / shotgun_pickup  automatically also looks for a  <name>_sawed  variant
// (e.g. videos/player_shoot_dealer_live_sawed.mp4) which is used when the barrel is sawed off. Totally optional.
const clip = (name, extra = {}) => [name, { src: `videos/${name}.mp4`, placeholderMs: 1400, ...extra }];

export const CLIPS = Object.fromEntries([
    // -- round setup
    clip('intro',  { optional: true, placeholderMs: 900 }),                                  // dealer sits down / lights come up (optional)
    clip('reload', { cues: { shellsIn: 1.1, shellsOut: 2.6 }, placeholderMs: 3200 }),         // shell container opens; game draws the shells at "shellsIn", removes them at "shellsOut"

    // -- player shooting. Every one starts on the "aiming at dealer" pose and ends on the normal table view (gun on the table).
    clip('shotgun_pickup'),                    // starts on table view (items hidden), ends on the aiming pose. The last frame is HELD while you choose a target.
    clip('shotgun_putdown', { optional: true }),   // aiming pose -> table view (when you click "Put down"). Skipped if missing.
    clip('player_shoot_dealer_live'),          // live shell at dealer, dealer SURVIVES: recoil, put gun down
    clip('player_shoot_dealer_blank'),         // blank at dealer: put gun down
    clip('player_shoot_self_blank'),           // blank at yourself: turn gun round, put it down
    clip('player_shoot_self_live'),            // live at yourself, you SURVIVE (2+ HP before the shot): resuscitated, back to table view
    clip('player_kill_dealer'),                // live shell that KILLS the dealer: dealer shot off screen and does not return. Ends on the table WITHOUT the dealer.
    clip('player_death'),                      // live shell that KILLS YOU (shot at yourself, or dealer shoots you). Ends black-ish; game over screen follows.
    clip('player_helmet_bounce', { optional: true }),   // you shoot yourself wearing a helmet, live shell bounces into the dealer (falls back to player_shoot_dealer_live)

    // -- dealer shooting (dealer picks up the gun himself)
    clip('dealer_shoot_player_live'),          // you take a live shell and survive
    clip('dealer_shoot_player_blank'),
    clip('dealer_shoot_self_blank'),
    clip('dealer_shoot_self_live'),            // dealer shoots himself live and survives
    clip('dealer_kill_player', { optional: true }),     // dealer kills you (falls back to player_death)
    clip('dealer_die_self',    { optional: true }),     // dealer shoots himself dead (falls back to player_kill_dealer)
    clip('dealer_helmet_bounce', { optional: true }),   // dealer helmet bounce (falls back to dealer_shoot_player_live)

    // -- winning
    clip('briefcase_open',  { placeholderMs: 1800 }),   // starts on "case on table, shackles open", ends on the opened case (then the game fades to black)
    clip('briefcase_close', { placeholderMs: 1500 }),   // starts on the opened case, ends on "case closed on the table" (same as the table view with the case down)
]);

// ---------------------------------------------------------------- layout (1280x720 canvas, centre-anchored)
const grid = ({ x0, y0, dx, dy, cols, rows, scale = 1 }) => {
    const out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push({ x: x0 + c * dx, y: y0 + r * dy, scale });
    return out;
};

export const LAYOUT = {
    dealer:        { x: 640, y: 215 },
    dealerHelmet:  { x: 640, y: 70 },
    shotgun:       { x: 640, y: 462 },
    hole:          { x: 640, y: 392 },            // where new items rise out of the table
    shells:        { x: 640, y: 400, spacing: 56 },
    revealPopup:   { x: 640, y: 330 },            // magnifying glass / burner phone result

    // 8 slots per side (MAX_ITEMS = 8): index 0 is the first free slot that gets used. Edit freely, or write the arrays by hand.
    slots: {
        player: grid({ x0: 445, y0: 568, dx: 130, dy: 96, cols: 4, rows: 2, scale: 1.0 }),
        dealer: grid({ x0: 445, y0: 335, dx: 130, dy: 52, cols: 4, rows: 2, scale: 0.8 }),
    },

    // Hands slide in from off-screen. `grip` = the point on the hand sprite (relative to its centre) that holds the item.
    hands: {
        player: { rest: { x: 900, y: 900 }, grip: { x: 0, y: -70 }, carryTo: { x: 640, y: 940, scale: 1.9 } },   // carried "towards you", off the bottom
        dealer: { rest: { x: 640, y: -260 }, grip: { x: 0, y: 70 },  carryTo: { x: 640, y: -300, scale: 0.6 } },  // carried away off the top
    },

    hud: {
        player: { x: 28,  y: 668, label: 'YOU' },
        dealer: { x: 28,  y: 66,  label: 'DEALER' },
        iconSpacing: 50,
        turn:   { x: 640, y: 26 },
        run:    { x: 1252, y: 26 },
    },

    aim: {
        dealerHit:  { x: 440, y: 60, w: 400, h: 400 },          // clickable box over the dealer in the aiming pose
        shootDealer:{ x: 640, y: 40 },
        shootSelf:  { x: 640, y: 660 },
        putDown:    { x: 1170, y: 670 },
    },

    briefcase: { x: 640, y: 470, raisedY: -520 },
    shackles:  [{ x: 380, y: 585 }, { x: 900, y: 585 }],       // click both to unlock the case
};

// ---------------------------------------------------------------- timing (ms)
export const TIMING = {
    dealerThink: 750,        // pause before each dealer action
    itemsFade: 260,          // items fading out/in around full-screen clips
    clipFade: 140,           // video -> still crossfade (hides tiny colour differences between the last video frame and your PNG)
    handReach: 380,
    handGrab: 120,
    handCarry: 480,
    dealStagger: 130,
    dealMove: 420,
    revealHold: 1500,
    toast: 1600,
    hpShake: 450,
    beat: 250,               // generic short pause between events
    briefcaseLower: 900,
    briefcaseRaise: 800,
};

export const FONT = 'Impact, "Arial Black", sans-serif';
export const FONT_MONO = '"Courier New", monospace';
