export class GameLog {
  #events = [];
  #listeners = new Set();
 
  emit(type, payload = {}) {
    const event = { id: this.#events.length, type, ...payload };

    this.#events = [...this.#events, event];
    this.#listeners.forEach((fn) => fn(event));
    return event;
  }
 
  subscribe = (fn) => {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  };
 
  getEvents = () => this.#events;
}
 
