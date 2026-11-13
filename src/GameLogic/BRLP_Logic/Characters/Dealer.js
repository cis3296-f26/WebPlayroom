import { Character } from '../Interface/Character.js';


export class Dealer extends Character {
    constructor(initHealth = 5, difficulty = 1) { 
        super('dealer', initHealth); 
        this.difficulty = difficulty; 
        this.inventory = [];
    }
    
    chooseTarget(shotgun) {
        const { live, blank } = shotgun.getCounts();
        if (blank === 0) return 'opponent';
        if (live === 0) return 'self';
        return live / (live + blank) < 0.5 ? 'self' : 'opponent';
    }

    findBestMoves(){ }
    determineMoveset() { }
    executeMoveset() { }
}