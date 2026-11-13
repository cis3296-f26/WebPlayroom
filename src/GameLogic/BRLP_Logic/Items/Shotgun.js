export class Shotgun {
    chamber = [];            // 'live' | 'blank'; index 0 fires next
    doubleDamage = false;

    constructor(log) { this.log = log; }

    initializeBullets(roundNumber = 1) {
        let minShells, maxShells;
        switch (roundNumber) {
            case 1: minShells = 2; maxShells = 4; break;
            case 2: minShells = 2; maxShells = 6; break;
            case 3: minShells = 3; maxShells = 7; break;
            default: minShells = 4; maxShells = 10;
        }

        const total = Math.floor(Math.random() * (maxShells - minShells + 1)) + minShells;
        const live = 1 + Math.floor(Math.random() * (total - 1));
        const shells = Array(live).fill('live').concat(Array(total - live).fill('blank'));

        for (let i = shells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shells[i], shells[j]] = [shells[j], shells[i]];
        }
        this.chamber = shells;

        const counts = this.getCounts();
        this.log.emit('RELOAD', counts);
        return counts;
    }

    fireBullet(character, target) {
        const shell = this.chamber.shift();          
        const damage = shell === 'live' ? (this.doubleDamage ? 2 : 1) : 0;
        this.doubleDamage = false;

        this.log.emit('SHOT_FIRED', { by: character.id, target: target.id, shell, damage });
        if (damage > 0) {
            target.takeDamage(damage);
            this.log.emit('DAMAGE', { target: target.id, amount: damage, health: target.health });
        }
        return shell;
    }

    getBulletCount() { return this.chamber.length; }

    getCounts() {
        const live = this.chamber.filter((s) => s === 'live').length;
        return { live, blank: this.chamber.length - live };
    }


    setDoubleDamage(value) { this.doubleDamage = value; }
    isDoubleDamage() { return this.doubleDamage; }

    revealBullet(index = 0) { return this.chamber[index]; }

    removeBullet() { return this.chamber.shift(); }

    reversePolarity() {
        if (this.chamber.length === 0) return;
        this.chamber[0] = this.chamber[0] === 'live' ? 'blank' : 'live';
    }

}