class GameLog {
  constructor() {
    if (GameLog.instance) { return GameLog.instance; }
    GameLog.instance = this;
    this.listeners = {};
  }

  //registeres a listener for a speciific event type
  //eventType: name of event e.g. SHOOT
  //callback: function to execute when event triggers
  on(eventType, callback) {
    if (!this.listeners[eventType]) { this.listeners[eventType] = []; }

    this.listeners[eventType].push(callback);
    console.log(`[GameLog] Listener registered for: ${eventType}`);
  }

  //unregisters a listener
  off(eventType, callback) {
    if (!this.listeners[eventType]) { return; }

    this.listeners[eventType] = this.listeners[eventType].filter(
      (listener) => listener !== callback
    );
    console.log(`[GameLog] Listener unregistered for: ${eventType}`);
  }

  //broadcasts an event to all subscribers
  emit(payload) {
    if (!payload || typeof payload.type !== 'string') {
      console.error("[GameLog Error] Emit failed: Payload must contain a 'type' string.");
      return;
    }

    const eventType = payload.type;
    const listeners = this.listeners[eventType];

    if (!listeners || listeners.length === 0) {
      console.warn(`[GameLog] No listeners registered for: ${eventType}`);
      return;
    }

    console.log(`\n--- [GAME LOG EVENT] ${eventType} ---`);
    listeners.forEach((callback, index) => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`[GameLog Error] Listener ${index} failed to process ${eventType}`, error);
      }
    });
  }

  static getInstance(){
    if(!GameLog.instance) { GameLog.instance = new GameLog(); }
    return GameLog.instance;
    
  }
}

const gameLog = new GameLog();
export default gameLog;