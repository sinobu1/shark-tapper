// js/saveManager.js
import { eventBus } from "./eventBus.js";
import { config } from "./config.js";

class SaveManager {
  constructor() {
    this.userId = this.getUserId();
    this.database = null;
    this.saveTimer = null;
    this.isSaving = false;
    this.debounceTimer = null; // Для отложенного сохранения
    this.saveInterval = config.game.saveInterval || 30000;
    this.initializeFirebase();
    this.setupEventListeners();
    console.log(`SaveManager initialized for user: ${this.userId}`);
  }

  getUserId() {
    // Пытаемся получить ID из Telegram
    try {
      const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      if (tgUser?.id) {
        return `tg_${tgUser.id}`;
      }
    } catch (e) {
      console.warn("Could not get Telegram User ID", e);
    }
    // Возвращаем гостевой ID или ID из localStorage
    let guestId = localStorage.getItem("guestUserId");
    if (!guestId) {
      guestId = `guest_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;
      localStorage.setItem("guestUserId", guestId);
    }
    return guestId;
  }

  initializeFirebase() {
    if (!config.firebase || !window.firebase) {
      console.warn(
        "Firebase config or library not found. Saving to localStorage only."
      );
      return;
    }
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(config.firebase);
        this.database = firebase.database();
        console.log("Firebase initialized by SaveManager.");
      } else {
        this.database = firebase.database(); // Используем уже инициализированное
        console.log("Firebase already initialized.");
      }
    } catch (error) {
      console.error("Firebase initialization failed:", error);
      this.database = null;
    }
  }

  // Запускает процесс загрузки
  loadGame() {
    console.log("Attempting to load game...");
    if (this.database) {
      this.loadFromFirebase();
    } else {
      this.loadFromLocalStorage();
    }
  }

  loadFromFirebase() {
    this.database
      .ref("users/" + this.userId)
      .once("value")
      .then((snapshot) => {
        const savedState = snapshot.val();
        if (savedState) {
          console.log("Game loaded from Firebase.");
          eventBus.emit("state:load", savedState); // Отправляем данные в StateManager
        } else {
          console.log("No saved game in Firebase. Trying LocalStorage.");
          this.loadFromLocalStorage();
        }
      })
      .catch((error) => {
        console.error("Error loading from Firebase:", error);
        this.loadFromLocalStorage(); // Fallback
      });
  }

  loadFromLocalStorage() {
    try {
      const savedStateString = localStorage.getItem(`gameState_${this.userId}`);
      if (savedStateString) {
        const savedState = JSON.parse(savedStateString);
        console.log("Game loaded from LocalStorage.");
        eventBus.emit("state:load", savedState);
      } else {
        console.log("No saved game in LocalStorage. Starting new game.");
        eventBus.emit("game:new"); // Сигнал для StateManager использовать initial state
      }
    } catch (error) {
      console.error("Error loading from LocalStorage:", error);
      eventBus.emit("ui:notification_show", {
        type: "error",
        message: "Ошибка загрузки сохранения!",
      });
      eventBus.emit("game:new"); // Начинаем новую игру при ошибке
    }
  }

  // Запускает процесс сохранения (с debounce)
  triggerSave() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.saveGame();
    }, 500); // Небольшая задержка перед сохранением
  }

  saveGame(forceSave = false) {
    if (this.isSaving && !forceSave) {
      // console.log("Save already in progress. Skipping.");
      return;
    }
    this.isSaving = true;
    // Получаем актуальное состояние от StateManager
    const stateToSave = eventBus.emitSync("state:get");
    if (!stateToSave) {
      console.error("Failed to get state for saving.");
      this.isSaving = false;
      return;
    }
    // Удаляем ненужные для сохранения поля (если они вдруг там есть)
    // const cleanState = { ...stateToSave };
    // delete cleanState.derived; // Производные значения не сохраняем
    // Оставляем derived, т.к. StateManager все равно их пересчитает при загрузке
    console.log("Attempting to save game...");
    // Сохраняем локально всегда (как бэкап)
    this.saveToLocalStorage(stateToSave);
    // Сохраняем в Firebase, если доступен
    if (this.database) {
      this.saveToFirebase(stateToSave);
    } else {
      this.isSaving = false; // Если Firebase нет, завершаем процесс сохранения
    }
  }

  saveToFirebase(state) {
    this.database
      .ref("users/" + this.userId)
      .set(state)
      .then(() => {
        console.log("Game saved successfully to Firebase.");
        eventBus.emit("game:saved");
      })
      .catch((error) => {
        console.error("Error saving game to Firebase:", error);
        eventBus.emit("ui:notification_show", {
          type: "error",
          message: "Ошибка онлайн сохранения!",
        });
      })
      .finally(() => {
        this.isSaving = false;
      });
  }

  saveToLocalStorage(state) {
    try {
      localStorage.setItem(`gameState_${this.userId}`, JSON.stringify(state));
      // console.log('Game saved to LocalStorage backup.');
    } catch (error) {
      console.error("Error saving game to LocalStorage:", error);
      // Не спамим пользователя ошибками локального сохранения, если есть Firebase
      if (!this.database) {
        eventBus.emit("ui:notification_show", {
          type: "error",
          message: "Ошибка сохранения игры!",
        });
      }
    }
  }

  setupEventListeners() {
    // Автосохранение по таймеру
    this.saveTimer = setInterval(() => this.triggerSave(), this.saveInterval);
    // Сохранение при закрытии/сворачивании
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        console.log("Page hidden, forcing immediate save.");
        this.saveGame(true); // Принудительное немедленное сохранение
      }
    });
    // Слушаем событие обновления состояния, чтобы инициировать сохранение
    eventBus.on("state:updated", () => this.triggerSave());
    // Очистка таймера (на всякий случай)
    window.addEventListener("unload", () => {
      if (this.saveTimer) clearInterval(this.saveTimer);
      // Можно попытаться сохранить синхронно, но это ненадежно
      // this.saveGame(true);
    });
  }
}

// Экспортируем единственный экземпляр
export const saveManager = new SaveManager();