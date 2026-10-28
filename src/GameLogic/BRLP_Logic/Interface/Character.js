export const MAX_ITEMS = 8;


export class Character {
    constructor(maxHealth = 4) {
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        this.inventory = [];
    }

    shootCharacter(target) { }

}
