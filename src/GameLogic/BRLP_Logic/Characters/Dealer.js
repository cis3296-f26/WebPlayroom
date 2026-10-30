import { Character } from '../Interface/Character.js';


export class Dealer extends Character {
    constructor(initHealth = 5, difficulty = 1) { 
        super(initHealth); 
        this.difficulty = difficulty; 
        this.inventory = [];
    }

    shootCharacter(target)  { super.shootCharacter(target); }

    useItem(InventoryIndex) { }


    findBestMoves(){ }
    determineMoveset() { }
    executeMoveset() { }
}

