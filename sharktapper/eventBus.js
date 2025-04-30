// ====================== ШИНА СОБЫТИЙ (из main.js) ======================
class EventBus {
    constructor() {
        this.listeners = {};
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event, callback) {
        if (!this.listeners[event]) return;

        const index = this.listeners[event].indexOf(callback);
        if (index !== -1) {
            this.listeners[event].splice(index, 1);
        }
    }

    emit(event, data = {}) {
        if (!this.listeners[event]) return;

        this.listeners[event].forEach(callback => {
            callback(data);
        });
    }

    // Note: emitSync might need adjustment depending on how shop.js events integrate
    emitSync(event, data = {}) {
        if (!this.listeners[event]) return null;

        let result = null;
        // Assuming only one listener returns a meaningful sync result
        for (const callback of this.listeners[event]) {
            const cbResult = callback(data);
            if (cbResult !== undefined) { // Check if callback returned something
                 result = cbResult;
                 break; // Stop after first result if needed, or collect all? Adjust as needed.
            }
        }
        return result;
    }
}