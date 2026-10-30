import { Shotgun } from '../Items/Shotgun.js';
export const MAX_ITEMS = 8;

export class Character {
    constructor(maxHealth = 4) {
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.inventory = [];
    }

    shootCharacter(target) { Shotgun.fireBullet(this, target);}

    useItem(inventoryIndex){ }

}
