export class Item {
    constructor(id, name, description, { targets = null } = {}) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.targets = targets;
    }

    blockedReason(game, user, args = {}) { return null; }

    useItem(game, user, args = {}) { }

    describe() { return { 
        id: this.id, 
        name: this.name, 
        description: this.description, 
        targets: this.targets }; 
    }
}

