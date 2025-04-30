// js/main.js

// Импортируем основные модули (их конструкторы выполнятся при импорте)
import { eventBus } from "./eventBus.js";
import { config } from "./config.js";
import { stateManager } from "./stateManager.js"; // Инициализирует StateManager
import { uiManager } from "./uiManager.js"; // Инициализирует UIManager и кэширует элементы
import { effectManager } from "./effectManager.js"; // Инициализирует эффекты
import { achievementManager } from "./achievementManager.js"; // Инициализирует ачивки
import { gameCore } from "./gameCore.js"; // Инициализирует ядро игры и циклы
import { saveManager } from "./saveManager.js"; // Инициализирует систему сохранений

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded and parsed. Initializing application.");

  // К этому моменту все модули уже должны быть инициализированы через импорты.
  // Важно: StateManager, UIManager, EffectManager должны быть инициализированы до GameCore и SaveManager.

  // Запускаем загрузку игры
  saveManager.loadGame(); // SaveManager запросит состояние у StateManager или начнет новую игру

  console.log("Application initialization complete. Game should be running.");

  // Отладка: доступ к модулям через консоль (НЕ ДЛЯ ПРОДА!)
  window.dev = {
    eventBus,
    config,
    stateManager,
    uiManager,
    effectManager,
    achievementManager,
    gameCore,
    saveManager,
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
      localStorage.removeItem(`gameState_${saveManager.userId}`);
      window.location.reload();
    },
  };
});

// НЕ ИСПОЛЬЗУЙТЕ ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ИЛИ AppShop/gameCoreInstance КАК РАНЬШЕ!
// Взаимодействие с HTML теперь идет через обработчики событий в UIManager.
