// js/eventBus.js
class EventBus {
  constructor() {
    this.listeners = {};
    console.log("EventBus initialized");
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
    // console.debug(`Event emitted: ${event}`, data); // Для отладки
    if (!this.listeners[event]) return;
    this.listeners[event].forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // Синхронный вызов для получения данных (используется осторожно!)
  emitSync(event, data = {}) {
    if (!this.listeners[event]) return null;
    // Предполагаем, что только один слушатель вернет результат
    for (const callback of this.listeners[event]) {
      try {
        const result = callback(data);
        if (result !== undefined) {
          return result;
        }
      } catch (error) {
        console.error(`Error in sync event listener for ${event}:`, error);
        return null;
      }
    }
    return null;
  }
}

// Экспортируем единственный экземпляр
export const eventBus = new EventBus();
