export const MAX_ITEMS = 8;

export class Character {
    constructor(id, maxHealth = 4) {
        this.id = id;
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.inventory = [];
    }

    get isDead() { return this.health <= 0; }

    takeDamage(amount) { this.health = Math.max(0, this.health - amount); }
    heal(amount) { this.health = Math.min(this.maxHealth, this.health + amount); }

    shootCharacter(target, shotgun) { return shotgun.fireBullet(this, target);}

    addItem(item) {
        if (this.inventory.length >= MAX_ITEMS) return false;
        this.inventory.push(item);
        return true;
    }

    removeItem(item) {
        const i = this.inventory.indexOf(item);
        if (i === -1) return false;
        this.inventory.splice(i, 1);
        return true;
    }
}