export class GameLog {
    events = [];
    nextId = 1;
    subscribers = new Set();
    handlers = new Map();

    emit(type, data = {}) {
        if (typeof type !== 'string' || type === '') {
            console.error('[GameLog] emit(type, data): type must be a non-empty string, got', type);
            return null;
        }
        const event = { ...data, id: this.nextId++, type };

        this.events = [...this.events, event];

        this.handlers.get(type)?.forEach((fn) => this.#safely(fn, event));
        this.subscribers.forEach((fn) => this.#safely(fn));
        return event;
    }

    getEvents = () => this.events;

    subscribe = (listener) => {
        this.subscribers.add(listener);
        return () => this.subscribers.delete(listener);
    };

    on(type, handler) {
        if (!this.handlers.has(type)) this.handlers.set(type, new Set());
        this.handlers.get(type).add(handler);
        return () => this.off(type, handler);
    }

    off(type, handler) {
        this.handlers.get(type)?.delete(handler);
    }

    #safely(fn, ...args) {
        try { fn(...args); }
        catch (error) { console.error('[GameLog] a listener threw:', error); }
    }
}
