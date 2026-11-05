export const MAX_ITEMS = 8;

export class Character {
    constructor(maxHealth = 4) {
        this.id = id
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.inventory = [];
    }

    get isDead() { return this.health <= 0; }

    takeDamage(amount) { this.health = Math.max(0, this.health - amount); }

    shootCharacter(target, shotgun) { return shotgun.fireBullet(this, target);}

    useItem(inventoryIndex){ }

}
