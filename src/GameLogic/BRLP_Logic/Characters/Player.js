import { Character } from '../Interface/Character.js';

export class Player extends Character {
    constructor(initHealth = 5) {
        super('player', initHealth);
        this.inventory = [];
        this.notebook = '';
    }
    
    viewNotebook() { }
    writeNotebook(text) { }

}