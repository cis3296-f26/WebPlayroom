/*
Items to implement
Shotgun related weapons
 - Magnifying glass
 - Polarizer
 - helmet
 - saw
 - beer

General items
 - Adrenaline
 - duplicator
 - burner phone
 - cigarettes
 - curtain

Game loop item
 - Handcuffs
*/

import { GameLog } from './GameLog.js';
import { Shotgun } from './Items/Shotgun.js';
import { Player } from './Characters/Player.js';
import { Dealer } from './Characters/Dealer.js';

export class Item{
    constructor(name, description){
        this.name = name;
        this.description = description;
    }
    
    useItem(){}
    
}

const log = new GameLog();

export class MagnifyingGlass extends Item{
    constructor(){
        super("Magnifying glass", 
            "Reveals the current bullet in the chamber"
        );
    }

    useItem(){ 
        Shotgun.revealBullet();
        
    }

}

export class Polarizer extends Item{
    constructor(){
        super("Polarizer", 
            "Reverses the polarity of the bullet (Live -> Blank && Blank -> Live)"
        );
    }
}

export class Helmet extends Item{
    constructor(){
        super("Helmet", 
            "When shooting yourself, live bullet bounces off and hits the opposing character. Blanks do nothing"
        );
    }

    
}

export class Saw extends Item{
    constructor(){
        super("Saw", 
            "Saws off the end of the barrel, double damage on live shots"
        );
    }
}

export class Beer extends Item{
    constructor(){
        super("Beer", 
            "Cocks the gun, removing the current bullet in the chamber"
        );
    }


}