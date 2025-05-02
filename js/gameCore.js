// js/gameCore.js
import { eventBus } from "./eventBus.js";
import { config } from "./config.js";
import { formatNumber } from "./utils.js"; // Утилита для форматирования
import { shopManager } from "./shopManager.js"; // Импортируем ShopManager

class GameCore {
  constructor() {
    this.passiveIncomeInterval = null;
    this.energyRegenInterval = null;
    this.boostCheckInterval = null; // Для проверки окончания буста
    this.setupEventHandlers();
    this.startGameLoops();
    this.initTelegramUser();
    console.log("GameCore initialized");
  }

  initTelegramUser() {
    try {
      if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        if (user) {
          console.log("Telegram user data:", user);
          eventBus.emit("user:info_updated", {
            name: user.first_name || user.username || "Игрок",
            photoUrl: user.photo_url || null,
          });
        } else {
          console.warn("Telegram user data not available.");
          eventBus.emit("user:info_updated", { name: "Гость", photoUrl: null });
        }
      } else {
        console.warn("Telegram WebApp API not found.");
        eventBus.emit("user:info_updated", { name: "Гость", photoUrl: null });
      }
    } catch (e) {
      console.error("Error initializing Telegram User:", e);
      eventBus.emit("user:info_updated", { name: "Гость", photoUrl: null });
    }
  }

  handleTap(event) {
    const state = eventBus.emitSync("state:get");
    if (!state) return;
    // Проверка энергии
    if (state.energy.current < config.game.energyCostPerTap) {
      eventBus.emit("ui:notification_show", {
        type: "error",
        message: "Недостаточно энергии!",
      });
      this.triggerHapticFeedback("error");
      return;
    }
    // Снимаем энергию
    eventBus.emit("energy:remove", { amount: config.game.energyCostPerTap });
    // Определяем силу тапа
    let tapValue = state.derived.currentTapValue; // Уже включает апгрейды и скин
    let isCritical = Math.random() < state.derived.criticalChance;
    if (isCritical) {
      tapValue = Math.floor(tapValue * config.game.criticalMultiplier);
    }
    if (state.boost.active) {
      tapValue = Math.floor(tapValue * config.game.boostMultiplier);
    }
    // Добавляем монеты
    eventBus.emit("currency:add", { type: "coin", amount: tapValue });
    // Показываем основной эффект (+монеты или крит)
    if (isCritical) {
      eventBus.emit("effect:show_tap", {
        type: "critical",
        event,
        text: "КРИТ!",
      });
      // Можно добавить и показ монет под критом, если нужно
      eventBus.emit("effect:show_tap", {
        type: "coin",
        event,
        text: `+${formatNumber(tapValue)}`,
      });
    } else {
      eventBus.emit("effect:show_tap", {
        type: "coin",
        event,
        text: `+${formatNumber(tapValue)}`,
      });
    }
    // Шанс на гем и руду
    const dropRandom = Math.random();
    let droppedItem = false; // Флаг, чтобы не показывать монеты, если выпало другое
    if (dropRandom < config.game.gemChanceOnTap) {
      // Шанс гема
      eventBus.emit("currency:add", { type: "gem", amount: 1 });
      eventBus.emit("effect:show_tap", { type: "gem", event, text: "+1 Гем" });
      droppedItem = true;
    } else if (dropRandom < state.derived.oreChance) {
      // Шанс руды (уже включает апгрейзы)
      eventBus.emit("currency:add", { type: "ore", amount: 1 });
      eventBus.emit("effect:show_tap", { type: "ore", event, text: "+1 Руда" });
      droppedItem = true;
    }
    // Обновляем статистику тапов и прочее (StateManager сделает это)
    eventBus.emit("game:tap_processed", { tapValue, isCritical });
    // Вибрация
    this.triggerHapticFeedback("light");
  }

  handleTapProcessed({ tapValue, isCritical }) {
    const state = eventBus.emitSync("state:get");
    if (!state) return;
    const currentLevel = state.player.level;
    const currentProgress = state.player.progress;
    const neededProgress = state.player.progressToNextLevel;
    const newProgressRaw = currentProgress + 1; // +1 за тап
    if (newProgressRaw >= neededProgress) {
      // --- Level Up ---
      const newLevel = currentLevel + 1;
      const newProgress = newProgressRaw - neededProgress; // Остаток опыта
      const newProgressToNextLevel = Math.max(
        config.game.baseProgressToNextLevel,
        Math.floor(neededProgress * config.game.progressToNextLevelMultiplier)
      );
      // Отправляем событие о левелапе
      eventBus.emit("game:level_up", {
        newLevel,
        newProgress,
        newProgressToNextLevel,
      });
      // UI покажет уведомление
      eventBus.emit("ui:show_level_up", { newLevel });
      // Вибрация при левелапе
      this.triggerHapticFeedback("medium");
    } else {
      // --- Просто прогресс ---
      // Отправляем событие для StateManager, чтобы он обновил только progress
      eventBus.emit("game:progress_update", { newProgress: newProgressRaw });
    }
    // Обновляем статистику (кол-во тапов, криты) - это событие уже есть
    eventBus.emit("game:tap_stats_update", { isCritical });
  }

  setupEventHandlers() {
    // Запросы от UI
    eventBus.on("game:tap_request", ({ event }) => this.handleTap(event));
    eventBus.on("game:boost_request", () => this.activateBoost());

    // НОВЫЙ ОБРАБОТЧИК для обновления статистики и прогресса после всех расчетов тапа
    eventBus.on("game:tap_processed", (data) => this.handleTapProcessed(data));

    // Запросы от Магазина (перенаправляем в ShopManager)
    eventBus.on("shop:buy_helper_request", ({ helperId }) => {
      shopManager.buyHelper(helperId);
    });
    eventBus.on("shop:buy_upgrade_request", ({ upgradeId }) => {
      shopManager.buyUpgrade(upgradeId);
    });
    eventBus.on("shop:handle_skin_request", ({ skinId }) => {
      shopManager.handleSkin(skinId);
    });
    eventBus.on("shop:open_lootbox_request", ({ lootboxType }) => {
      shopManager.openLootbox(lootboxType);
    });
  }

  activateBoost() {
    const state = eventBus.emitSync("state:get");
    if (!state || state.boost.active) return; // Нельзя активировать, если уже активен
    const cost = config.game.boostCostGems;
    // Проверяем и списываем гемы
    const success = eventBus.emitSync("currency:remove", {
      type: "gem",
      amount: cost,
    });
    if (success) {
      // Уведомляем StateManager
      eventBus.emit("game:boost_activated");
      // Показываем эффект
      eventBus.emit("effect:show_boost", {
        duration: config.game.boostDuration,
      });
      // Уведомление
      eventBus.emit("ui:notification_show", {
        type: "success",
        message: "Буст активирован!",
      });
      this.triggerHapticFeedback("medium");
    } else {
      eventBus.emit("ui:notification_show", {
        type: "error",
        message: "Недостаточно гемов!",
      });
    }
  }

  // Проверка и деактивация буста
  checkBoostEnd() {
    const state = eventBus.emitSync("state:get");
    if (state && state.boost.active && Date.now() >= state.boost.endTime) {
      eventBus.emit("game:boost_deactivated");
      console.log("Boost deactivated");
    }
  }

  startGameLoops() {
    // Пассивный доход
    this.passiveIncomeInterval = setInterval(() => {
      const state = eventBus.emitSync("state:get");
      if (state && state.derived.passiveIncomePerSec > 0) {
        eventBus.emit("currency:add", {
          type: "coin",
          amount: state.derived.passiveIncomePerSec,
        });
      }
    }, 1000);
    // Регенерация энергии
    this.energyRegenInterval = setInterval(() => {
      const state = eventBus.emitSync("state:get");
      if (state && state.energy.current < state.energy.max) {
        eventBus.emit("energy:add", { amount: state.energy.regenRate });
      }
    }, 1000);
    // Проверка окончания буста
    this.boostCheckInterval = setInterval(() => this.checkBoostEnd(), 1000);
  }

  stopGameLoops() {
    clearInterval(this.passiveIncomeInterval);
    clearInterval(this.energyRegenInterval);
    clearInterval(this.boostCheckInterval);
  }

  triggerHapticFeedback(style = "light") {
    try {
      if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(style); // 'light', 'medium', 'heavy', 'rigid', 'soft'
      } else if (
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred &&
        (style === "success" || style === "warning" || style === "error")
      ) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred(style);
      }
    } catch (e) {
      // console.warn("Haptic feedback failed:", e);
    }
  }
}

// Экспортируем единственный экземпляр
export const gameCore = new GameCore();
