// js/shopManager.js
import { eventBus } from "./eventBus.js";
import { config } from "./config.js";
import { getCurrentCost, formatLootboxReward } from "./utils.js"; // Импортируем утилиты

class ShopManager {
  constructor() {
    console.log("ShopManager initialized");
  }

  // --- Покупка Помощников ---
  buyHelper(helperId) {
    const helperConfig = config.helpers[helperId];
    if (!helperConfig) return;
    const state = eventBus.emitSync("state:get"); // Запрашиваем текущее состояние
    if (!state) return;
    const helperState = state.shop.helpers[helperId];
    if (!helperState || helperState.owned === undefined) {
      console.warn(`Helper ${helperId} has no 'owned' property in state.`);
      return;
    }

    // --- Проверка максимального уровня ---
    if (helperConfig.maxLevel && helperState.owned >= helperConfig.maxLevel) {
      eventBus.emit("ui:notification_show", {
        type: "info",
        message: "Максимальный уровень!",
      });
      return;
    }

    const currentCost = getCurrentCost(
      helperConfig.cost,
      helperState.owned,
      helperConfig.costIncrease
    );
    const currency = helperConfig.currency; // 'coin'
    // Проверяем и списываем валюту через StateManager
    const success = eventBus.emitSync("currency:remove", {
      type: currency,
      amount: currentCost,
    });
    if (success) {
      // Уведомляем StateManager об успешной покупке
      eventBus.emit("shop:item_purchased", {
        itemType: "helper",
        id: helperId,
      });
      eventBus.emit("ui:notification_show", {
        type: "success",
        message: `${helperConfig.name} куплен!`,
      });
    } else {
      eventBus.emit("ui:notification_show", {
        type: "error",
        message: "Недостаточно монет!",
      });
    }
  }

  // --- Покупка Улучшений ---
  buyUpgrade(upgradeId) {
    const upgradeConfig = config.upgrades[upgradeId];
    if (!upgradeConfig) return;
    const state = eventBus.emitSync("state:get");
    if (!state) return;
    const upgradeState = state.shop.upgrades[upgradeId];
    if (!upgradeState || upgradeState.owned === undefined) {
      console.warn(`Upgrade ${upgradeId} has no 'owned' property in state.`);
      return;
    }
    // Проверка максимального уровня
    if (
      upgradeConfig.maxLevel &&
      upgradeState.owned >= upgradeConfig.maxLevel
    ) {
      eventBus.emit("ui:notification_show", {
        type: "info",
        message: "Максимальный уровень!",
      });
      return;
    }
    const currentCost = getCurrentCost(
      upgradeConfig.cost, // базовая цена апгрейда
      upgradeState.owned, // сколько уже куплено
      upgradeConfig.costIncrease // множитель цены
    );
    const currency = upgradeConfig.currency; // 'coin', 'gem', 'ore'
    const success = eventBus.emitSync("currency:remove", {
      type: currency,
      amount: currentCost,
    });
    if (success) {
      eventBus.emit("shop:item_purchased", {
        itemType: "upgrade",
        id: upgradeId,
      });
      // Уведомление можно не показывать или сделать менее навязчивым
      // eventBus.emit('ui:notification_show', { type: 'success', message: `${upgradeConfig.name} улучшен!` });
    } else {
      let currencyName = currency;
      if (currency === "coin") currencyName = "монет";
      if (currency === "gem") currencyName = "гемов";
      if (currency === "ore") currencyName = "руды";
      eventBus.emit("ui:notification_show", {
        type: "error",
        message: `Недостаточно ${currencyName}!`,
      });
    }
  }

  // --- Покупка / Экипировка Скинов ---
  handleSkin(skinId) {
    const skinConfig = config.skins[skinId];
    if (!skinConfig) return;
    const state = eventBus.emitSync("state:get");
    if (!state) return;
    const skinState = state.shop.skins.owned[skinId];
    if (skinState === undefined) {
      console.warn(`Skin ${skinId} has no 'owned' property in state.`);
      return;
    }
    if (skinState) {
      // Если скин уже есть - экипируем
      if (state.shop.skins.current !== skinId) {
        eventBus.emit("shop:skin_equip", { skinId });
        eventBus.emit("ui:notification_show", {
          type: "success",
          message: `Скин "${skinConfig.name}" надет!`,
        });
      }
    } else {
      // Покупаем скин
      let canAfford = true;
      let missingCurrency = "";
      const costs = [
        { type: "coin", amount: skinConfig.cost },
        { type: "gem", amount: skinConfig.costGems },
        { type: "ore", amount: skinConfig.costOre },
      ];
      // Проверяем все валюты
      for (const costInfo of costs) {
        if (
          costInfo.amount > 0 &&
          state.currencies[costInfo.type] < costInfo.amount
        ) {
          canAfford = false;
          if (costInfo.type === "coin") missingCurrency = "монет";
          else if (costInfo.type === "gem") missingCurrency = "гемов";
          else if (costInfo.type === "ore") missingCurrency = "руды";
          break;
        }
      }
      if (!canAfford) {
        eventBus.emit("ui:notification_show", {
          type: "error",
          message: `Недостаточно ${missingCurrency}!`,
        });
        return;
      }
      // Списываем все валюты
      let allRemoved = true;
      for (const costInfo of costs) {
        if (costInfo.amount > 0) {
          const removed = eventBus.emitSync("currency:remove", {
            type: costInfo.type,
            amount: costInfo.amount,
          });
          if (!removed) {
            allRemoved = false;
            console.error(
              `Failed to remove ${costInfo.amount} ${costInfo.type} for skin ${skinId}, though check passed!`
            );
            // TODO: По хорошему, нужна транзакция или откат предыдущих списаний
            break;
          }
        }
      }
      if (allRemoved) {
        // Уведомляем StateManager о покупке
        eventBus.emit("shop:item_purchased", { itemType: "skin", id: skinId });
        // Сразу экипируем купленный скин
        eventBus.emit("shop:skin_equip", { skinId });
        eventBus.emit("ui:notification_show", {
          type: "success",
          message: `Скин "${skinConfig.name}" куплен и надет!`,
        });
      } else {
        eventBus.emit("ui:notification_show", {
          type: "error",
          message: "Ошибка покупки скина!",
        });
        // Здесь нужно вернуть списанные средства, если логика отката реализована
      }
    }
  }

  // --- Открытие Лутбокса ---
  openLootbox(lootboxType) {
    const lootboxConfig = config.lootboxes[lootboxType];
    if (!lootboxConfig) return;
    const state = eventBus.emitSync("state:get");
    if (!state) return;
    const currency = lootboxConfig.currency;
    const cost = lootboxConfig.cost;
    // Проверяем и списываем валюту
    const success = eventBus.emitSync("currency:remove", {
      type: currency,
      amount: cost,
    });
    if (!success) {
      eventBus.emit("ui:notification_show", {
        type: "error",
        message: "Недостаточно монет!",
      });
      return;
    }
    // Определяем награду
    const reward = this.determineLootboxReward(lootboxConfig.rewards, state);
    // Обрабатываем дубликат скина ДО отправки события награды
    if (reward.type === "skin" && state.shop.skins.owned[reward.itemId]) {
      console.log(`Duplicate skin ${reward.itemId} from lootbox.`);
      const skinConfig = config.skins[reward.itemId];
      const coinReward = Math.max(
        Math.floor(skinConfig.cost * config.game.duplicateSkinCoinMultiplier),
        config.game.minCoinsForDuplicateSkin
      );
      // Модифицируем объект reward
      reward.wasDuplicate = true;
      reward.originalItemId = reward.itemId; // Сохраняем ID для UI
      reward.type = "coin";
      reward.amount = coinReward;
      console.log(`Converted to ${coinReward} coins.`);
    }
    // Отправляем событие с финальной наградой (StateManager ее применит)
    eventBus.emit("lootbox:reward", reward);
    // Показываем модальное окно с наградой
    eventBus.emit("ui:show_lootbox_reward", { lootboxType, reward });
  }

  // Логика определения награды из лутбокса
  determineLootboxReward(possibleRewards, currentState) {
    const rand = Math.random();
    let cumulativeChance = 0;
    for (const rewardInfo of possibleRewards) {
      cumulativeChance += rewardInfo.chance;
      if (rand < cumulativeChance) {
        let reward = { type: rewardInfo.type };
        if (
          reward.type === "coin" ||
          reward.type === "gem" ||
          reward.type === "ore"
        ) {
          reward.amount =
            Math.floor(Math.random() * (rewardInfo.max - rewardInfo.min + 1)) +
            rewardInfo.min;
        } else if (reward.type === "helper" || reward.type === "skin") {
          reward.rarity = rewardInfo.rarity;
          // Выбираем КОНКРЕТНЫЙ предмет этой редкости
          reward.itemId = this.selectRandomItem(
            reward.type,
            reward.rarity,
            currentState,
            reward.type === "skin"
          ); // Передаем флаг onlyUnowned для скинов
          if (!reward.itemId) {
            // Если подходящий предмет не найден
            console.warn(
              `No available ${reward.type} of rarity ${reward.rarity} found. Giving fallback coins.`
            );
            return { type: "coin", amount: config.game.fallbackLootboxCoins };
          }
        }
        return reward;
      }
    }
    // Fallback, если шансы не сошлись (сумма < 1)
    console.warn("Lootbox reward calculation failed. Falling back to coins.");
    return { type: "coin", amount: config.game.fallbackLootboxCoins };
  }

  // Выбор случайного предмета нужного типа и редкости
  selectRandomItem(itemType, rarity, currentState, onlyUnowned = false) {
    let possibleItems = [];
    const itemConfigs = config[itemType + "s"]; // config.helpers или config.skins
    for (const id in itemConfigs) {
      const itemConfig = itemConfigs[id];
      if (itemConfig.rarity === rarity) {
        if (itemType === "skin" && onlyUnowned) {
          // Проверяем, есть ли уже такой скин во владении
          if (!currentState.shop.skins.owned[id]) {
            possibleItems.push(id);
          }
        } else if (itemType === "helper") {
          // Для хелперов не важна уникальность, всегда добавляем
          possibleItems.push(id);
        } else if (itemType === "skin" && !onlyUnowned) {
          possibleItems.push(id); // Если можно дубликат
        }
      }
    }
    if (possibleItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * possibleItems.length);
      return possibleItems[randomIndex];
    }
    return null; // Нет подходящих предметов
  }
}

// Экспортируем единственный экземпляр
export const shopManager = new ShopManager();
