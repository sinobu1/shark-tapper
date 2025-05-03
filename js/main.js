// js/main.js

// Импортируем основные модули
import { eventBus } from "./eventBus.js";
window.eventBus = eventBus;

import { config } from "./config.js";
window.config = config;

import { stateManager } from "./stateManager.js";
window.stateManager = stateManager;

import { uiManager } from "./uiManager.js";
import { effectManager } from "./effectManager.js";
import { achievementManager } from "./achievementManager.js";
import { gameCore } from "./gameCore.js";

// Импортируем экземпляр saveManager
import { saveManager } from "./saveManager.js";
// window.saveManager = saveManager; // Эта строка не нужна, если saveManager не нужен глобально

// Импортируем КЛАСС LeaderboardManager
import { LeaderboardManager } from "./leaderboardManager.js";

// Создаем экземпляр LeaderboardManager, передавая saveManager
const leaderboardManager = new LeaderboardManager(saveManager);

// Присваиваем экземпляр глобальной переменной (если нужно)
window.leaderboardManager = leaderboardManager;

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed. Initializing application.");

  // Запускаем загрузку игры
  saveManager.loadGame();

  console.log("Application initialization complete. Game should be running.");

  // Обновляем объект отладки, чтобы он использовал новый экземпляр
  window.dev = {
    eventBus,
    config,
    stateManager,
    uiManager,
    effectManager,
    achievementManager,
    gameCore,
    saveManager, // Экземпляр
    leaderboardManager, // Новый экземпляр
    getState: () => stateManager.getState(),
    addCoins: (amount) =>
      eventBus.emit("currency:add", {
        type: "coin",
        amount: parseInt(amount) || 1000,
      }),
    addGems: (amount) =>
      eventBus.emit("currency:add", {
        type: "gem",
        amount: parseInt(amount) || 10,
      }),
    save: () => saveManager.saveGame(true),
    load: () => saveManager.loadGame(),
    reset: () => {
      // Убедимся, что saveManager.userId доступен перед удалением
      if (saveManager && saveManager.userId) {
        localStorage.removeItem(`gameState_${saveManager.userId}`);
      } else {
        console.warn(
          "Не удалось выполнить сброс: saveManager или userId недоступен."
        );
        // Возможно, стоит удалить по какому-то другому ключу или сообщить об ошибке
        localStorage.removeItem("gameState_default"); // Пример запасного ключа
      }
      window.location.reload();
    },
  };
});
