// ========================
// 1. GAME STATE MANAGER (Магазин)
// ========================
const GameState = (() => {
    // Private state
    let state = {
        // Валюты, управляемые магазином (синхронизируются с StateManager из main.js)
        currencies: {
            coins: 0,
            gems: 0,
            ore: 0,
             // energy управляется StateManager из main.js
             // stars и keys УДАЛЕНЫ
        },
        helpers: [
          { id: 'dolphin', name: 'Дельфин', cost: 500, income: 20, owned: 0, currency: 'coins', costIncrease: 1.15, rarity: 'common' },
          { id: 'orca', name: 'Косатка', cost: 1500, income: 50, owned: 0, currency: 'coins', costIncrease: 1.2, rarity: 'rare' },
          { id: 'whale', name: 'Кит', cost: 5000, income: 100, owned: 0, currency: 'coins', costIncrease: 1.25, rarity: 'rare' },
          { id: 'shark', name: 'Акула', cost: 15000, income: 200, owned: 0, currency: 'coins', costIncrease: 1.3, rarity: 'epic' },
          { id: 'submarine', name: 'Подлодка', cost: 50000, income: 500, owned: 0, currency: 'coins', costIncrease: 1.35, rarity: 'epic' },
          { id: 'fleet', name: 'Флот', cost: 150000, income: 1000, owned: 0, currency: 'coins', costIncrease: 1.4, rarity: 'legendary' }
        ],
        upgrades: [
          { id: 'powerTap', name: 'NFT Сила удара', cost: 2000, effect: 1, owned: 0, currency: 'coins', maxLevel: 10, rarity: 'common', costIncrease: 1.5 },
          { id: 'criticalChance', name: 'Критический шанс', cost: 5000, effect: 0.01, owned: 0, currency: 'coins', maxLevel: 5, rarity: 'rare', costIncrease: 2 }, // Эффект 0.01 = +1%
          { id: 'oreChance', name: 'Удача рудокопа', cost: 3000, effect: 0.005, owned: 0, currency: 'coins', maxLevel: 10, rarity: 'rare', costIncrease: 1.8 }, // Эффект 0.005 = +0.5%
          { id: 'energyRegen', name: 'Регенерация', cost: 10, effect: 1, owned: 0, currency: 'gems', maxLevel: 5, rarity: 'epic', costIncrease: 2.5 },
          { id: 'energyMax', name: 'Энергия+', cost: 5, effect: 50, owned: 0, currency: 'gems', maxLevel: 10, rarity: 'epic', costIncrease: 1.5 },
          { id: 'incomeMultiplier', name: 'Множитель дохода', cost: 10000, effect: 1.2, owned: 0, currency: 'coins', maxLevel: 5, rarity: 'legendary', costIncrease: 3 } // Множитель, не добавка
        ],
        skins: [
           { id: 'basic', name: 'Базовая акула', cost: 0, costGems: 0, costOre: 0, /*costStars: 0,*/ multiplier: 1, owned: true, rarity: 'common' },
           { id: 'gold', name: 'Золотая акула', cost: 5000, costGems: 5, costOre: 0, /*costStars: 0,*/ multiplier: 1.5, owned: false, rarity: 'rare' },
           { id: 'robot', name: 'Акула-робот', cost: 10000, costGems: 0, costOre: 10, /*costStars: 0,*/ multiplier: 2, owned: false, rarity: 'rare' },
           { id: 'dragon', name: 'Акула-дракон', cost: 20000, costGems: 10, costOre: 0, /*costStars: 0,*/ multiplier: 3, owned: false, rarity: 'epic' },
           { id: 'cyber', name: 'Кибер-акула', cost: 50000, costGems: 0, costOre: 20, /*costStars: 0,*/ multiplier: 5, owned: false, rarity: 'epic' },
           { id: 'legendary', name: 'Легендарная акула', cost: 100000, costGems: 0, costOre: 0, /*costStars: 5,*/ multiplier: 10, owned: false, rarity: 'legendary' } // costStars УДАЛЕНО
        ],
        currentSkin: 'basic',
        unlockedSkins: ['basic'],
        lootboxes: {
          common: {
            name: "Обычный лутбокс",
            cost: 5000,
            // keys: 1, // УДАЛЕНО
            rewards: [
              { type: "coins", min: 1000, max: 5000, chance: 0.6 },
              { type: "gems", min: 1, max: 3, chance: 0.3 },
              { type: "helper", rarity: "common", chance: 0.1 } // Шанс редкого помощника? Уточнить. Сейчас обычный.
            ]
          },
          rare: {
            name: "Редкий лутбокс",
            cost: 15000,
            // keys: 3, // УДАЛЕНО
            rewards: [
              { type: "coins", min: 5000, max: 15000, chance: 0.5 },
              { type: "gems", min: 3, max: 5, chance: 0.3 },
              { type: "helper", rarity: "rare", chance: 0.15 },
              { type: "skin", rarity: "rare", chance: 0.05 }
            ]
          },
          epic: {
            name: "Эпический лутбокс",
            cost: 50000,
             // keys: 5, // УДАЛЕНО
            rewards: [
              { type: "coins", min: 15000, max: 50000, chance: 0.4 },
              { type: "gems", min: 5, max: 10, chance: 0.3 },
              { type: "helper", rarity: "epic", chance: 0.2 },
              { type: "skin", rarity: "epic", chance: 0.1 }
            ]
          },
          legendary: {
            name: "Легендарный лутбокс",
            cost: 150000,
            // keys: 10, // УДАЛЕНО
            rewards: [
              { type: "coins", min: 50000, max: 150000, chance: 0.3 },
              { type: "gems", min: 10, max: 20, chance: 0.2 },
              { type: "helper", rarity: "legendary", chance: 0.3 },
              { type: "skin", rarity: "legendary", chance: 0.2 }
            ]
          }
        }
    };

     // Загрузка состояния (может быть вызвана из SaveManager)
     const loadState = (loadedState) => {
         if (loadedState) {
             // Загружаем только те части, которые относятся к магазину
             //state.currencies.coins = loadedState.coinCount ?? state.currencies.coins;
             //state.currencies.gems = loadedState.gemCount ?? state.currencies.gems;
             //state.currencies.ore = loadedState.oreCount ?? state.currencies.ore;
             state.helpers = loadedState.helpers ?? state.helpers;
             state.upgrades = loadedState.upgrades ?? state.upgrades;
             state.skins = loadedState.skins ?? state.skins; // Важно: может перезаписать измененные цены/параметры
             state.currentSkin = loadedState.currentSkin ?? state.currentSkin;
             state.unlockedSkins = loadedState.unlockedSkins ?? state.unlockedSkins;
             console.log("GameState (shop) loaded specific parts from combined state.");
             // Уведомляем подписчиков магазина об обновлении
              //EventBusShop.publish('stateLoaded');
              //EventBusShop.publish('currencyUpdated'); // Обновить UI валют
         } else {
             // Если нет сохраненных данных, пытаемся загрузить из localStorage (старая логика shop.js)
              // const savedStateLocal = localStorage.getItem('gameState_shop'); // Используем другое имя ключа
              // if (savedStateLocal) {
                 // try {
                    //   state = JSON.parse(savedStateLocal);
                     //  console.log("GameState (shop) loaded from localStorage.");
                     //  EventBusShop.publish('stateLoaded');
                     //  EventBusShop.publish('currencyUpdated');
                 // } catch (e) {
                 //      console.error("Error parsing shop state from localStorage", e);
                //  }
             // }
         }
     };


     // Сохранение состояния магазина (может быть вызвано SaveManager или по таймеру)
      const saveState = () => {
         // Сохранение происходит централизованно через SaveManager
         // Но можно оставить локальное сохранение как бэкап
          try {
             localStorage.setItem('gameState_shop', JSON.stringify(state));
             // console.log('GameState (shop) saved to localStorage backup.');
         } catch (error) {
             console.error('Error saving shop state to localStorage:', error);
         }
     };


     // Public API
    return {
        getState: () => state,
        // setState не нужен, если загрузка идет через loadState
        getCurrency: (type) => state.currencies[type] || 0,
        setCurrency: (type, value) => {
            if (state.currencies.hasOwnProperty(type)) {
                state.currencies[type] = value;
                 // Не вызываем saveState здесь, сохранение централизовано
                 EventBusShop.publish('currencyUpdated'); // Уведомить UI магазина
            }
        },
        // addCurrency и subtractCurrency лучше делать через StateManager (main.js),
        // который потом вызовет setCurrency здесь для синхронизации.
        // Оставим их на всякий случай, но использовать с осторожностью.
        addCurrency: (type, amount) => {
            if (state.currencies.hasOwnProperty(type)) {
                state.currencies[type] += amount;
                 // Не вызываем saveState здесь
                 EventBusShop.publish('currencyUpdated');
            }
        },
        subtractCurrency: (type, amount) => {
             if (state.currencies.hasOwnProperty(type)) {
                 state.currencies[type] = Math.max(0, state.currencies[type] - amount);
                 // Не вызываем saveState здесь
                 EventBusShop.publish('currencyUpdated');
                 return true; // Возвращаем успех
             }
             return false; // Неизвестная валюта
         },

        getHelper: (id) => state.helpers.find(h => h.id === id),
        getUpgrade: (id) => state.upgrades.find(u => u.id === id),
        getSkin: (id) => state.skins.find(s => s.id === id),
        getLootbox: (type) => state.lootboxes[type],
        loadState, // Доступен для SaveManager
        saveState // Доступен для SaveManager (или для локального бэкапа)
    };
})();
