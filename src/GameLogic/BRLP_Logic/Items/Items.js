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

import { Item } from '../Interface/Item.js';

//Shotgun related items
export class MagnifyingGlass extends Item {
    constructor() {
        super('magnifying_glass', 'Magnifying glass', 'Reveals the current bullet in the chamber');
    }

    useItem(game, user) {
        // position 1 = the shell that fires next. 
        const shell = game.shotgun.revealBullet(0);
        game.log.emit('SHELL_REVEALED', { by: user.id, position: 1, shell });
    }
}

export class Polarizer extends Item {
    constructor() {
        super('polarizer', 'Polarizer', 'Reverses the polarity of the bullet (Live -> Blank && Blank -> Live)');
    }

    useItem(game, user) {
        game.shotgun.reversePolarity();

        game.log.emit('POLARITY_REVERSED', { by: user.id });
    }
}

export class Helmet extends Item {
    constructor() {
        super('helmet', 'Helmet',
            'When shooting yourself, live bullet bounces off and hits the opposing character. Blanks do nothing');
    }

    blockedReason(game, user) { return user.helmet ? 'You are already wearing a helmet' : null; }

    useItem(game, user) {
        user.helmet = true;
        game.log.emit('HELMET_EQUIPPED', { by: user.id });
    }
}

export class Saw extends Item {
    constructor() {
        super('saw', 'Saw', 'Saws off the end of the barrel, double damage on live shots');
    }

    blockedReason(game) {
        return game.shotgun.isDoubleDamage() ? 'The barrel is already sawed off' : null;
    }

    useItem(game, user) {
        game.shotgun.setDoubleDamage(true);
        game.log.emit('BARREL_SAWED', { by: user.id });
    }
}

export class Beer extends Item {
    constructor() {
        super('beer', 'Beer', 'Cocks the gun, removing the current bullet in the chamber');
    }

    useItem(game, user) {
        const shell = game.shotgun.removeBullet();
        game.log.emit('SHELL_EJECTED', { by: user.id, shell });
        game.reloadIfEmpty();
    }
}

// General Items

export class Adrenaline extends Item {
    constructor() {
        super('adrenaline', 'Adrenaline', 'Steal one of the opponent\'s items and use it immediately',
            { targets: 'opponent_item' });
    }

    blockedReason(game, user, { targetIndex } = {}) {
        const stolen = game.opponentOf(user).inventory[targetIndex];
        if (!stolen) return 'Pick one of the opponent\'s items to steal';

        if (stolen.targets) return `${stolen.name} can't be stolen (it needs a target of its own)`;

        return stolen.blockedReason(game, user, {});
    }

    useItem(game, user, { targetIndex }) {
        const opponent = game.opponentOf(user);
        const stolen = opponent.inventory[targetIndex];
        opponent.removeItem(stolen);
        game.log.emit('ITEM_STOLEN', { by: user.id, from: opponent.id, item: stolen.id, itemName: stolen.name });
        stolen.useItem(game, user, {}); //immediately used
    }
}

export class Duplicator extends Item {
    constructor() {
        super('duplicator', 'Duplicator', 'Creates a copy of another item in your inventory',
            { targets: 'own_item' });
    }

    blockedReason(game, user, { targetIndex } = {}) {
        const source = user.inventory[targetIndex];
        if (!source) return 'Pick one of your items to copy';
        if (source === this) return 'The Duplicator can\'t copy itself';
        return null;
    }

    useItem(game, user, { targetIndex }) {
        const source = user.inventory[targetIndex];
        const copy = new source.constructor();

        user.inventory.push(copy);
        game.log.emit('ITEM_DUPLICATED', { by: user.id, item: source.id, itemName: source.name });
    }
}

export class BurnerPhone extends Item {
    constructor() {
        super('burner_phone', 'Burner phone', 'Reveals a random bullet further down the chamber');
    }

    blockedReason(game) {
        return game.shotgun.getBulletCount() < 2 ? 'There is nothing beyond the current shell to reveal' : null;
    }

    useItem(game, user) {
        const count = game.shotgun.getBulletCount();
        const index = 1 + Math.floor(Math.random() * (count - 1));
        game.log.emit('SHELL_REVEALED', {
            by: user.id,
            position: index + 1,
            shell: game.shotgun.revealBullet(index),
        });
    }
}

export class Cigarettes extends Item {
    constructor() {
        super('cigarettes', 'Cigarettes', 'Calms the nerves, heals 1hp');
    }

    blockedReason(game, user) {
        return user.health >= user.maxHealth ? 'You are already at full health' : null;
    }

    useItem(game, user) {
        user.heal(1);
        game.log.emit('HEALED', { target: user.id, amount: 1, health: user.health });
    }
}

//Game Loop

export class Handcuffs extends Item {
    constructor() {
        super('handcuffs', 'Handcuffs', 'The opponent skips their next turn');
    }

    blockedReason(game, user) {
        return game.opponentOf(user).handcuffed ? 'The opponent is already handcuffed' : null;
    }


    useItem(game, user) {
        const opponent = game.opponentOf(user);
        opponent.handcuffed = true;
        game.log.emit('HANDCUFFED', { by: user.id, target: opponent.id });
    }
}

// Only useful if multiplayer is implemented

// export class Curtain extends Item {
//     constructor() {
//         super('curtain', 'Curtain', 'Cover your items so other players can\'t see');
//     }

//     blockedReason() {
//         return;
//     }
// }

export const ITEM_POOL = [
    MagnifyingGlass, Polarizer, Helmet, Saw, Beer,
    Adrenaline, Duplicator, BurnerPhone, Cigarettes, Handcuffs,
];

export function randomItem() {
    const ItemClass = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)];
    return new ItemClass();
}