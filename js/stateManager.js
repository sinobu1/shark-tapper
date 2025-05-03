// js/stateManager.js
import { eventBus } from "./eventBus.js";
import { config } from "./config.js";
import { getCurrentCost } from "./utils.js"; // Нужен для расчета стоимости перед списанием

class StateManager {
  constructor() {
    this.state = this.getInitialState();
    this.isInitialized = false; // Флаг для отложенного первого state:updated
    this.setupEventHandlers();
    console.log("StateManager initialized");
  }

  deepMerge(target, source) {
    const output = { ...target };
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
  }

  updateState(partialState) {
    let stateChanged = false;
    const newState = this.deepMerge(this.state, partialState); // Используем deepMerge
    // Проверяем, изменилось ли состояние (можно сделать более детальную проверку)
    if (JSON.stringify(this.state) !== JSON.stringify(newState)) {
      stateChanged = true;
      this.state = newState; // Присваиваем новое, смерженное состояние
    }
    if (stateChanged) {
      this.recalculateDerivedStats();
      if (this.isInitialized) {
        eventBus.emit("state:updated", this.state);
        eventBus.emit("state:forAchievements", this.state);
      }
    }
  }

  getInitialState() {
    const initialState = {
      currencies: { coin: 0, gem: 0, ore: 0 },
      totals: { coins: 0, gems: 0, ore: 0, taps: 0 }, // Общие накопленные значения
      stats: {
        // Статистика для достижений и прочего
        criticalHits: 0,
        energySpent: 0,
      },
      player: {
        level: 0,
        progress: 0,
        progressToNextLevel: config.game.baseProgressToNextLevel,
        baseTapValueFromLevel: 0, // Добавка к базовому тапу от уровня
      },
      energy: {
        current: config.game.maxEnergy, // Начнем с полной
        max: config.game.maxEnergy,
        regenRate: config.game.energyRegenRate,
      },
      shop: {
        // Состояние предметов магазина
        helpers: {}, // { dolphin: { owned: 1 }, orca: { owned: 0 }, ... }
        upgrades: {}, // { powerTap: { owned: 2 }, criticalChance: { owned: 0 }, ... }
        skins: {
          // Состояние скинов
          current: "basic",
          unlocked: ["basic"],
          owned: { basic: true }, // { basic: true, gold: false, ... }
        },
      },
      boost: {
        active: false,
        endTime: 0,
      },
      // Производные значения (рассчитываются)
      derived: {
        passiveIncomePerSec: 0,
        currentTapValue: config.game.baseTapValue,
        criticalChance: config.game.criticalChance,
        oreChance: config.game.oreChance,
      },
      achievements: {}, // { firstTap: { unlocked: false, progress: 50 }, ... }
    };
    // Инициализация состояний магазина из конфига
    Object.keys(config.helpers).forEach((id) => {
      initialState.shop.helpers[id] = { owned: 0 }; // Убедимся, что owned есть
    });
    Object.keys(config.upgrades).forEach((id) => {
      initialState.shop.upgrades[id] = { owned: 0 }; // Убедимся, что owned есть
    });
    Object.keys(config.skins).forEach((id) => {
      initialState.shop.skins.owned[id] = id === "basic"; // Только базовый скин владеем
    });
    Object.keys(config.achievements).forEach((id) => {
      initialState.achievements[id] = { unlocked: false, progress: 0 }; // Убедимся, что progress есть
    });
    return initialState;
  }

  getState() {
    return this.state;
  }

  // Основной метод обновления состояния

  // Загрузка сохраненного состояния
  loadState(loadedState) {
    if (!loadedState) {
      console.log("No saved state found, using initial state.");
      this.state = this.getInitialState(); // Убедимся, что используем свежее начальное состояние
    } else {
      console.log("Loading saved state...");
      // Аккуратно объединяем сохраненное состояние с начальным,
      // чтобы новые поля из config не потерялись
      const initialState = this.getInitialState();
      this.state = this.mergeStates(initialState, loadedState);
      console.log("State loaded:", this.state);
    }
    this.recalculateDerivedStats(); // Пересчитать все после загрузки
    this.isInitialized = true; // Теперь можно отправлять state:updated
    eventBus.emit("state:loaded", this.state); // Событие о завершении загрузки
    eventBus.emit("state:updated", this.state); // Первое обновление UI
  }

  // Рекурсивное объединение состояний (для вложенных объектов)
  mergeStates(target, source) {
    const output = { ...target };
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const targetValue = target[key];
        const sourceValue = source[key];
        if (
          typeof sourceValue === "object" &&
          sourceValue !== null &&
          !Array.isArray(sourceValue) &&
          typeof targetValue === "object" &&
          targetValue !== null &&
          !Array.isArray(targetValue)
        ) {
          output[key] = this.mergeStates(targetValue, sourceValue);
        } else {
          // Просто перезаписываем, если не объект или если в target нет такого ключа/типа
          output[key] = sourceValue;
        }
      }
    }
    // Убедимся, что все ключи из target (initialState) присутствуют
    for (const key in target) {
      if (!Object.prototype.hasOwnProperty.call(output, key)) {
        output[key] = target[key];
      }
    }
    return output;
  }

  // Пересчет производных значений
  recalculateDerivedStats() {
    const state = this.state;
    const shopState = state.shop;
    const playerState = state.player;

    // 1. Пассивный доход
    let income = 0;
    for (const id in shopState.helpers) {
      income += shopState.helpers[id].owned * config.helpers[id].income;
    }

    // 2. Множитель дохода
    const incomeMultiplierUpgrade = config.upgrades.incomeMultiplier;
    const incomeMultiplierLevel = shopState.upgrades.incomeMultiplier.owned;
    const incomeMultiplier =
      incomeMultiplierLevel > 0
        ? Math.pow(incomeMultiplierUpgrade.effect, incomeMultiplierLevel)
        : 1;
    const finalIncome = Math.floor(income * incomeMultiplier);

    // 3. Шанс крита
    const critChanceUpgrade = config.upgrades.criticalChance;
    const critChanceLevel = shopState.upgrades.criticalChance.owned;
    const finalCritChance =
      config.game.criticalChance + critChanceLevel * critChanceUpgrade.effect;

    // 4. Шанс руды
    const oreChanceUpgrade = config.upgrades.oreChance;
    const oreChanceLevel = shopState.upgrades.oreChance.owned;
    const finalOreChance =
      config.game.oreChance + oreChanceLevel * oreChanceUpgrade.effect;

    // 5. Базовый тап (уровень + апгрейд)
    const powerTapUpgrade = config.upgrades.powerTap;
    const powerTapLevel = shopState.upgrades.powerTap.owned;
    let baseTap =
      config.game.baseTapValue +
      playerState.baseTapValueFromLevel + // Добавка от уровня
      powerTapLevel * powerTapUpgrade.effect;

    // 6. Множитель скина
    const currentSkinId = shopState.skins.current;
    const skinMultiplier = config.skins[currentSkinId]?.multiplier || 1;

    // 7. Итоговый тап (база * скин) - без крита и буста
    const finalTapValue = Math.floor(baseTap * skinMultiplier);

    // 8. Макс энергия и реген
    const maxEnergyUpgrade = config.upgrades.energyMax;
    const maxEnergyLevel = shopState.upgrades.energyMax.owned;
    const finalMaxEnergy =
      config.game.maxEnergy + maxEnergyLevel * maxEnergyUpgrade.effect;

    const energyRegenUpgrade = config.upgrades.energyRegen;
    const energyRegenLevel = shopState.upgrades.energyRegen.owned;
    const finalEnergyRegen =
      config.game.energyRegenRate +
      energyRegenLevel * energyRegenUpgrade.effect;

    // Обновляем состояние derived и energy
    state.derived = {
      passiveIncomePerSec: finalIncome,
      currentTapValue: finalTapValue, // Это базовый тап с учетом скина/апгрейдов
      criticalChance: finalCritChance,
      oreChance: finalOreChance,
    };

    state.energy.max = finalMaxEnergy;
    state.energy.regenRate = finalEnergyRegen;

    // Корректируем текущую энергию, если макс. изменилась
    if (state.energy.current > state.energy.max) {
      state.energy.current = state.energy.max;
    }
  }

  setupEventHandlers() {
    // --- Валюты ---
    eventBus.on("currency:add", ({ type, amount }) => {
      if (!this.state.currencies.hasOwnProperty(type)) return;
      amount = Math.max(0, amount); // Не добавлять отрицательные
      const current = this.state.currencies[type];
      const currentTotal = this.state.totals[type + "s"] || 0; // coins, gems, ores
      this.updateState({
        currencies: { [type]: current + amount },
        totals: { [type + "s"]: currentTotal + amount },
      });
    });

    // Синхронный обработчик для проверки и списания
    eventBus.on("currency:remove", ({ type, amount }) => {
      if (!this.state.currencies.hasOwnProperty(type) || amount <= 0)
        return false;
      const current = this.state.currencies[type];
      if (current >= amount) {
        this.updateState({ currencies: { [type]: current - amount } });
        return true; // Успех
      }
      return false; // Недостаточно средств
    });

    // --- Энергия ---
    eventBus.on("energy:add", ({ amount }) => {
      if (amount <= 0) return;
      const current = this.state.energy.current;
      const max = this.state.energy.max;
      const newEnergy = Math.min(max, current + amount);
      if (newEnergy !== current) {
        this.updateState({ energy: { current: newEnergy } });
      }
    });

    eventBus.on("energy:remove", ({ amount }) => {
      if (amount <= 0) return;
      const current = this.state.energy.current;
      const newEnergy = Math.max(0, current - amount);
      const spentAmount = current - newEnergy; // Сколько реально потрачено
      if (newEnergy !== current) {
        this.updateState({
          energy: { current: newEnergy },
          stats: {
            energySpent: (this.state.stats.energySpent || 0) + spentAmount,
          }, // Статистика для ачивки
        });
      }
    });

    // --- Покупка/Улучшение Предметов ---
    eventBus.on("shop:item_purchased", ({ itemType, id }) => {
      let updates = {};
      if (itemType === "helper" && this.state.shop.helpers[id]) {
        updates = {
          shop: {
            helpers: { [id]: { owned: this.state.shop.helpers[id].owned + 1 } },
          },
        };
      } else if (itemType === "upgrade" && this.state.shop.upgrades[id]) {
        updates = {
          shop: {
            upgrades: {
              [id]: { owned: this.state.shop.upgrades[id].owned + 1 },
            },
          },
        };
      } else if (
        itemType === "skin" &&
        this.state.shop.skins.owned.hasOwnProperty(id)
      ) {
        const newUnlocked = [...this.state.shop.skins.unlocked];
        if (!newUnlocked.includes(id)) {
          newUnlocked.push(id);
        }
        updates = {
          shop: {
            skins: {
              owned: { [id]: true },
              unlocked: newUnlocked,
            },
          },
        };
      }
      if (Object.keys(updates).length > 0) {
        this.updateState(updates); // Это вызовет recalculateDerivedStats
      }
    });

    // --- Смена скина ---
    eventBus.on("shop:skin_equip", ({ skinId }) => {
      if (this.state.shop.skins.owned[skinId]) {
        this.updateState({ shop: { skins: { current: skinId } } });
      }
    });

    // --- Открытие лутбокса (применение награды) ---
    eventBus.on("lootbox:reward", (reward) => {
      switch (reward.type) {
        case "coin":
        case "gem":
        case "ore":
          eventBus.emit("currency:add", {
            type: reward.type,
            amount: reward.amount,
          });
          break;
        case "helper":
          // Увеличиваем owned хелпера
          if (this.state.shop.helpers[reward.itemId]) {
            this.updateState({
              shop: {
                helpers: {
                  [reward.itemId]: {
                    owned: this.state.shop.helpers[reward.itemId].owned + 1,
                  },
                },
              },
            });
          }
          break;
        case "skin":
          // Отмечаем скин как owned и добавляем в unlocked
          if (this.state.shop.skins.owned.hasOwnProperty(reward.itemId)) {
            const newUnlocked = [...this.state.shop.skins.unlocked];
            if (!newUnlocked.includes(reward.itemId)) {
              newUnlocked.push(reward.itemId);
            }
            this.updateState({
              shop: {
                skins: {
                  owned: { [reward.itemId]: true },
                  unlocked: newUnlocked,
                },
              },
            });
          }
          break;
      }
      // Сохранение будет вызвано SaveManager'ом позже
    });

    // --- Игровые действия ---
    eventBus.on("game:tap_stats_update", ({ isCritical }) => {
      const updates = {
        totals: { taps: this.state.totals.taps + 1 },
      };
      if (isCritical) {
        updates.stats = {
          criticalHits: (this.state.stats.criticalHits || 0) + 1,
        };
      }
      this.updateState(updates);
    });

    // ИЗМЕНИ обработчик 'game:level_up'
    eventBus.on(
      "game:level_up",
      ({ newLevel, newProgress, newProgressToNextLevel }) => {
        let baseTapIncrease = 0;
        // Увеличение базового тапа от уровня
        if (
          newLevel > this.state.player.level &&
          newLevel % config.game.levelUpBaseTapIncreaseInterval === 0
        ) {
          baseTapIncrease = config.game.levelUpBaseTapIncreaseAmount;
        }
        this.updateState({
          player: {
            level: newLevel,
            progress: newProgress, // Устанавливаем правильный остаток прогресса
            progressToNextLevel: newProgressToNextLevel,
            baseTapValueFromLevel:
              this.state.player.baseTapValueFromLevel + baseTapIncrease,
          },
        });
        // Пересчитываем статы после изменения baseTapValueFromLevel
        this.recalculateDerivedStats();
        // Эмитируем state:updated т.к. recalculateDerivedStats не делает этого сам
        eventBus.emit("state:updated", this.state);
      }
    );

    // НОВЫЙ обработчик для простого обновления прогресса
    eventBus.on("game:progress_update", ({ newProgress }) => {
      // Проверяем, что уровень не должен был измениться (на всякий случай)
      if (newProgress < this.state.player.progressToNextLevel) {
        this.updateState({ player: { progress: newProgress } });
      } else {
        console.warn(
          "Progress update called when level up should have occurred!"
        );
        // Можно вызвать перерасчет левелапа здесь как fallback
      }
    });

    eventBus.on("game:boost_activated", () => {
      this.updateState({
        boost: {
          active: true,
          endTime: Date.now() + config.game.boostDuration,
        },
      });
    });

    eventBus.on("game:boost_deactivated", () => {
      this.updateState({ boost: { active: false, endTime: 0 } });
    });

    // --- Загрузка ---
    // Нужен для получения состояния при сохранении
    eventBus.on("state:get", () => this.getState());

    // Нужен для загрузки
    eventBus.on("state:load", (loadedData) => this.loadState(loadedData));

    // Нужен для инициализации/ресета
    eventBus.on("game:new", () => this.loadState(null));
  }
}

// Экспортируем единственный экземпляр
export const stateManager = new StateManager();
