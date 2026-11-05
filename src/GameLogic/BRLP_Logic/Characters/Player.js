import { Character } from '../Interface/Character.js';

export class Player extends Character {
    constructor(initHealth = 5) {
        this.inventory = [];
        this.notebook = '';
    }

    // shootCharacter(target) { super.shootCharacter(target); }

    useItem(InventoryIndex){ }

    viewNotebook() { }
    writeNotebook(text) { }

}
