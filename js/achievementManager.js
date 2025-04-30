// js/achievementManager.js
import { eventBus } from "./eventBus.js";
import { config } from "./config.js";

class AchievementManager {
  constructor() {
    // Состояние достижений теперь хранится в stateManager
    this.setupEventListeners();
    console.log("AchievementManager initialized");
  }

  checkAchievements(currentState) {
    const achievementsState = currentState.achievements;
    let achievementUnlocked = false;

    for (const id in config.achievements) {
      const achievementConfig = config.achievements[id];
      const achievementState = achievementsState[id];

      if (!achievementState.unlocked) {
        // Используем функцию проверки из конфига
        const currentProgress = achievementConfig.check(currentState);
        // Обновляем прогресс в состоянии (если нужно показывать)
        // stateManager должен позаботиться об обновлении progress через события?
        // Или мы обновляем здесь и потом шлем событие?
        // Пока просто проверяем порог
        if (currentProgress >= achievementConfig.threshold) {
          achievementsState[id].unlocked = true; // Модифицируем копию для события
          achievementUnlocked = true;
          console.log(`Achievement unlocked: ${achievementConfig.name}`);
          // Выдаем награду
          if (achievementConfig.rewardGems > 0) {
            eventBus.emit("currency:add", {
              type: "gem",
              amount: achievementConfig.rewardGems,
            });
          }
          // Показываем уведомление
          eventBus.emit("ui:show_achievement", achievementConfig); // Используем achievementConfig для данных
        }
        // Можно обновлять поле progress, если оно есть в state.achievements[id]
        // achievementsState[id].progress = currentProgress;
      }
    }
    // Если что-то разблокировалось, нужно обновить состояние в stateManager
    // Лучше, чтобы StateManager сам слушал события (totalTaps, totalCoins и т.д.) и обновлял прогресс ачивок
    // Тогда этот менеджер только показывает уведомление при разблокировке
    /*
         if (achievementUnlocked) {
             // Отправить событие для StateManager, чтобы он обновил achievements в своем состоянии
             eventBus.emit('achievements:update_state', achievementsState);
         }
         */
  }

  setupEventListeners() {
    // Слушаем общее обновление состояния и проверяем все ачивки
    // Это менее оптимально, чем слушать конкретные события (tap, currency:add)
    // но проще для начала
    eventBus.on("state:forAchievements", (state) =>
      this.checkAchievements(state)
    );

    // Альтернатива: Подписка на конкретные события, если stateManager их генерирует
    // eventBus.on('stats:updated', ({ key, value }) => { /* ... */ });
  }
}

// Экспортируем единственный экземпляр
export const achievementManager = new AchievementManager();
