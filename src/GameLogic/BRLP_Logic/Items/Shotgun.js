import { Logic } from '../BRLP_Logic/buckshotLogic.js';

export class Shotgun {
    chamber = [];

    constructor() {
        initializeBullets();
    }

    initializeBullets() {
        minShells = 1; maxShells = 10;
        switch (Logic.roundNumber) {
            case 1:
                minShells = 2; maxShells = 4;
                break;
            case 2:
                minShells = 2; maxShells = 6;
                break;
            case 3:
                minShells = 3; maxShells = 7;
                break;
            default:
                minShells = 4; maxShells = 10;
        }

        const numShells = Math.floor(Math.random() * (maxShells - minShells + 1)) + minShells;
        this.chamber = Array(numShells).fill('live').concat(Array(10 - numShells).fill('blank'));
            numLive = this.chamber.filter((s) => s === 'live').length;
        //log how many live and blank
    }

    
    fireBullet(character, target) { 
        return chamber.eject(); 
        //log who fired, target, and live/blank
    }

    getBulletCount(){ return this.chamber.length; }

    setDoubleDamage(boolean) { }
    isDoubleDamage() { }
    removeBullet() { }
    revealBullet() { }
    reversePolarity() { }
}
