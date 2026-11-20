// Collects end-of-game statistics from the game log (pure data, no graphics).
export class StatsTracker {
    constructor(log) {
        this.startedAt = Date.now();
        this.shotsFired = 0;
        this.liveShots = 0;
        this.blankShots = 0;
        this.selfShots = 0;
        this.damageDealt = 0;     // by you, to the dealer
        this.damageTaken = 0;     // by you
        this.itemsUsed = 0;       // by you
        this.itemsStolen = 0;     // by you (Adrenaline)
        this.turns = 0;
        this.lastShell = null;    // the shell that ended the game

        log.on('SHOT_FIRED', (e) => {
            this.shotsFired++;
            if (e.shell === 'live') this.liveShots++; else this.blankShots++;
            if (e.by === 'player' && e.target === 'player') this.selfShots++;
            this.lastShell = e.shell;
        });
        log.on('DAMAGE', (e) => {
            if (e.target === 'dealer') this.damageDealt += e.amount;
            else this.damageTaken += e.amount;
        });
        log.on('ITEM_USED', (e) => { if (e.by === 'player') this.itemsUsed++; });
        log.on('ITEM_STOLEN', (e) => { if (e.by === 'player') this.itemsStolen++; });
        log.on('TURN_START', (e) => { if (e.turn === 'player') this.turns++; });
    }

    rows() {
        const secs = Math.round((Date.now() - this.startedAt) / 1000);
        return [
            ['Time played', `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`],
            ['Turns taken', this.turns],
            ['Shots fired', `${this.shotsFired}  (${this.liveShots} live, ${this.blankShots} blank)`],
            ['Shots at yourself', this.selfShots],
            ['Damage dealt', this.damageDealt],
            ['Damage taken', this.damageTaken],
            ['Items used', this.itemsUsed],
            ['Items stolen', this.itemsStolen],
        ];
    }
}
