let nextUid = 1;

export class Item {
    constructor(id, name, description, { targets = null } = {}) {
        this.uid = nextUid++;   // unique per INSTANCE (id is per TYPE); the visual layer uses it to track which slot an item sits in
        this.id = id;
        this.name = name;
        this.description = description;
        this.targets = targets;
    }

    blockedReason(game, user, args = {}) { return null; }

    useItem(game, user, args = {}) { }

    describe() { return { 
        uid: this.uid,
        id: this.id, 
        name: this.name, 
        description: this.description, 
        targets: this.targets }; 
    }
}

