// ====================== КОНФИГУРАЦИЯ (из main.js) ======================
const Config = {
    firebase: {
        apiKey: "AIzaSyDgi8vq_3Wpky7o_bzWbVuKRtOShGjd5o4",
        authDomain: "tralalero-fec07.firebaseapp.com",
        databaseURL: "https://tralalero-fec07-default-rtdb.firebaseio.com",
        projectId: "tralalero-fec07",
        storageBucket: "tralalero-fec07.firebasestorage.app",
        messagingSenderId: "322571108862",
        appId: "1:322571108862:web:14f4fe3a8168abab19c0af"
    },
    game: {
        baseTapValue: 1,
        criticalChance: 0.05,
        criticalMultiplier: 2,
        oreChance: 0.03,
        energyRegenRate: 1,
        energyCostPerTap: 1,
        maxEnergy: 100
    }
};

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


// ====================== МЕНЕДЖЕР СОСТОЯНИЯ (из main.js) ======================
class StateManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        // Начальное состояние из main.js, может быть перезаписано при загрузке
        this.state = {
            coinCount: 0,
            gemCount: 0,
            oreCount: 0,
            energy: Config.game.maxEnergy,
            passiveIncome: 0, // Рассчитывается из помощников shop.js
            playerLevel: 0,
            playerProgress: 0,
            progressToNextLevel: 100,
            baseTapValue: Config.game.baseTapValue, // Обновляется апгрейдами shop.js
            currentTapValue: Config.game.baseTapValue,
            boostActive: false,
            totalCoins: 0,
            totalGems: 0,
            totalOre: 0,
            totalTaps: 0,
            incomeMultiplier: 1, // Обновляется апгрейдами shop.js
            criticalChance: Config.game.criticalChance, // Обновляется апгрейдами shop.js
            oreChance: Config.game.oreChance, // Обновляется апгрейдами shop.js
            // Данные магазина будут управляться GameState из shop.js
            // helpers: { ... }, // Управляется GameState
            // skins: { ... }, // Управляется GameState
            // upgrades: { ... }, // Управляется GameState
            currentSkin: 'basic' // Добавлено для скинов из shop.js
        };

        // Подписка на события для StateManager из main.js
        this.setupMainEventListeners();

        // Подписка на события для синхронизации с GameState из shop.js
        this.setupShopSyncListeners();

        // Регистрируем обработчик для state:get в EventBus
        this.eventBus.on('state:get', () => this.getState());
        // Регистрируем обработчик для state:load в EventBus
        this.eventBus.on('state:load', (loadedState) => this.loadState(loadedState));

    }

    getState() {
        // Возвращаем текущее состояние, управляемое StateManager
        // Убедимся, что данные магазина синхронизированы, если GameState используется отдельно
        // Или лучше объединить управление состоянием полностью
        return this.state;
    }

    updateState(newState) {
        // Обновляем состояние StateManager
        this.state = { ...this.state, ...newState };
        // Сообщаем об обновлении состояния через EventBus
        this.eventBus.emit('state:updated', this.state);
    }

    // Загрузка сохраненного состояния
     loadState(savedState) {
        console.log("Loading state into StateManager:", savedState);
        // Объединяем сохраненное состояние с текущим, отдавая приоритет сохраненному
        // Убедимся, что все нужные поля присутствуют, иначе используем дефолтные
        const defaultState = { // Дефолтные значения, если их нет в savedState
            coinCount: 0, gemCount: 0, oreCount: 0, energy: Config.game.maxEnergy,
            passiveIncome: 0, playerLevel: 0, playerProgress: 0, progressToNextLevel: 100,
            baseTapValue: Config.game.baseTapValue, currentTapValue: Config.game.baseTapValue,
            boostActive: false, totalCoins: 0, totalGems: 0, totalOre: 0, totalTaps: 0,
            incomeMultiplier: 1, criticalChance: Config.game.criticalChance, oreChance: Config.game.oreChance,
            currentSkin: 'basic'
        };
        this.state = { ...defaultState, ...savedState };

        // Важно: После загрузки нужно обновить UI и, возможно, другие компоненты
        this.eventBus.emit('state:loaded', this.state); // Отдельное событие для пост-загрузочных действий
        this.eventBus.emit('state:updated', this.state); // Обновляем UI и прочее
    }


    setupMainEventListeners() {
        this.eventBus.on('game:tap', ({ event }) => this.handleTap(event));
        this.eventBus.on('game:boost', () => this.handleBoost());
        // Переименовано, чтобы избежать конфликта с shop.js GameState
        this.eventBus.on('currency:add', ({ type, amount }) => this.addCurrency(type, amount));
        this.eventBus.on('currency:remove', ({ type, amount }) => this.removeCurrency(type, amount)); // Добавим удаление
        this.eventBus.on('energy:add', ({ amount }) => this.addEnergy(amount));
        this.eventBus.on('energy:remove', ({ amount }) => this.removeEnergy(amount));
        // Слушаем обновление пассивного дохода от магазина
        this.eventBus.on('passiveIncome:update', ({ amount }) => this.updateState({ passiveIncome: amount }));
         // Слушаем обновление характеристик от апгрейдов магазина
        this.eventBus.on('stats:update', (updates) => this.updateState(updates));
        // Слушаем событие покупки/экипировки скина
        this.eventBus.on('skin:update', ({ skinId }) => this.updateState({ currentSkin: skinId }));


    }
    // Слушатели для синхронизации с GameState из shop.js
    setupShopSyncListeners() {
         // Когда валюта обновляется в GameState, обновляем ее и здесь
        EventBusShop.subscribe('currencyUpdated', () => {
             const shopCurrencies = GameState.getState().currencies;
             this.updateState({
                 coinCount: shopCurrencies.coins,
                 gemCount: shopCurrencies.gems,
                 oreCount: shopCurrencies.ore,
                 // energy управляется здесь (main.js)
             });
        });
        // Когда предмет куплен/улучшен в магазине, обновляем связанные параметры
         EventBusShop.subscribe('itemPurchased', ({ itemType, itemId }) => {
            this.syncStateFromShop(); // Пересчитываем все зависимые параметры
         });
         // Когда скин выбран в магазине
         EventBusShop.subscribe('skinSelected', ({ skinId }) => {
             this.updateState({ currentSkin: skinId });
             this.syncStateFromShop(); // Пересчитать тап на основе скина
         });

         // Начальная синхронизация при загрузке
         this.syncStateFromShop();
    }

     // Метод для полной синхронизации состояния с GameState из shop.js
     syncStateFromShop() {
        const shopState = GameState.getState();

        // 1. Валюты (кроме энергии)
        const shopCurrencies = shopState.currencies;
        let needsUpdate = false;
        const updates = {};

        if (this.state.coinCount !== shopCurrencies.coins) {
            updates.coinCount = shopCurrencies.coins;
            needsUpdate = true;
        }
        if (this.state.gemCount !== shopCurrencies.gems) {
            updates.gemCount = shopCurrencies.gems;
            needsUpdate = true;
        }
         if (this.state.oreCount !== shopCurrencies.ore) {
            updates.oreCount = shopCurrencies.ore;
            needsUpdate = true;
        }

        // 2. Пассивный доход
        const calculatedPassiveIncome = shopState.helpers.reduce((total, helper) => {
            return total + (helper.owned * helper.income);
        }, 0);
         if (this.state.passiveIncome !== calculatedPassiveIncome) {
            updates.passiveIncome = calculatedPassiveIncome;
            needsUpdate = true;
        }

        // 3. Множитель дохода (если есть апгрейд)
        const incomeMultiplierUpgrade = shopState.upgrades.find(u => u.id === 'incomeMultiplier');
        const calculatedIncomeMultiplier = incomeMultiplierUpgrade && incomeMultiplierUpgrade.owned > 0
            ? Math.pow(incomeMultiplierUpgrade.effect, incomeMultiplierUpgrade.owned) // Пример расчета, уточнить логику
            : 1;
        if (this.state.incomeMultiplier !== calculatedIncomeMultiplier) {
             updates.incomeMultiplier = calculatedIncomeMultiplier;
             needsUpdate = true;
        }
        // Применяем множитель к пассивному доходу
        if ('passiveIncome' in updates) {
            updates.passiveIncome = Math.floor(updates.passiveIncome * calculatedIncomeMultiplier);
        } else if (this.state.passiveIncome > 0 && calculatedIncomeMultiplier !== this.state.incomeMultiplier) {
             // Пересчитать пассивный доход, даже если он сам не изменился, но множитель изменился
             updates.passiveIncome = Math.floor(this.state.passiveIncome / this.state.incomeMultiplier * calculatedIncomeMultiplier);
              needsUpdate = true;
        }


        // 4. Базовый тап и множитель скина
        const powerTapUpgrade = shopState.upgrades.find(u => u.id === 'powerTap');
        const skin = shopState.skins.find(s => s.id === shopState.currentSkin);

        let calculatedBaseTap = Config.game.baseTapValue + (powerTapUpgrade ? powerTapUpgrade.owned * powerTapUpgrade.effect : 0);

        // Добавляем множитель от скина
         const skinMultiplier = skin ? skin.multiplier : 1;
         // Примечание: Решено применять множитель скина прямо к базовому тапу.
         // Если логика другая (например, множитель применяется после крита), это нужно изменить.
         calculatedBaseTap = Math.floor(calculatedBaseTap * skinMultiplier);


         if (this.state.baseTapValue !== calculatedBaseTap) {
            updates.baseTapValue = calculatedBaseTap;
            needsUpdate = true;
        }


        // 5. Шанс крита
        const critChanceUpgrade = shopState.upgrades.find(u => u.id === 'criticalChance');
        const calculatedCritChance = Config.game.criticalChance + (critChanceUpgrade ? critChanceUpgrade.owned * critChanceUpgrade.effect : 0);
        if (this.state.criticalChance !== calculatedCritChance) {
            updates.criticalChance = calculatedCritChance;
            needsUpdate = true;
        }

        // 6. Шанс руды
        const oreChanceUpgrade = shopState.upgrades.find(u => u.id === 'oreChance');
        const calculatedOreChance = Config.game.oreChance + (oreChanceUpgrade ? oreChanceUpgrade.owned * oreChanceUpgrade.effect : 0);
         if (this.state.oreChance !== calculatedOreChance) {
            updates.oreChance = calculatedOreChance;
            needsUpdate = true;
        }

        // 7. Макс энергия и реген (если есть апгрейды)
        const maxEnergyUpgrade = shopState.upgrades.find(u => u.id === 'energyMax');
        const energyRegenUpgrade = shopState.upgrades.find(u => u.id === 'energyRegen');

        const calculatedMaxEnergy = Config.game.maxEnergy + (maxEnergyUpgrade ? maxEnergyUpgrade.owned * maxEnergyUpgrade.effect : 0);
        const calculatedEnergyRegen = Config.game.energyRegenRate + (energyRegenUpgrade ? energyRegenUpgrade.owned * energyRegenUpgrade.effect : 0);

        // Обновляем глобальную конфигурацию или локальные переменные, если они используются
        // Важно: Если Config.game используется напрямую в других местах, его тоже надо обновлять
        // или использовать значения из state.
         if (Config.game.maxEnergy !== calculatedMaxEnergy) {
             Config.game.maxEnergy = calculatedMaxEnergy; // Осторожно с глобальной мутацией
             // Возможно, лучше хранить maxEnergy в state?
             // updates.maxEnergy = calculatedMaxEnergy; // Если хранить в state
             needsUpdate = true; // Нужно обновить UI энергии
         }
         if (Config.game.energyRegenRate !== calculatedEnergyRegen) {
             Config.game.energyRegenRate = calculatedEnergyRegen; // Осторожно
             // updates.energyRegenRate = calculatedEnergyRegen; // Если хранить в state
             needsUpdate = true;
         }


        // Применяем все накопленные обновления
        if (needsUpdate) {
             console.log("Syncing state from Shop:", updates);
             this.updateState(updates);
        }
    }



    handleTap(event) {
        const state = this.state;

        if (state.energy < Config.game.energyCostPerTap) {
            this.eventBus.emit('notification:show', { type: 'error', message: 'Недостаточно энергии!' });
            return;
        }

        this.eventBus.emit('energy:remove', { amount: Config.game.energyCostPerTap });

        let isCritical = Math.random() < state.criticalChance;
        // Используем baseTapValue, который уже включает множитель скина и апгрейды
        let tapValue = state.baseTapValue;

        // Применяем множитель крита
         if (isCritical) {
             tapValue = Math.floor(tapValue * Config.game.criticalMultiplier);
         }
         // Применяем буст, если активен
         if (state.boostActive) {
             // Умножаем на 2 (или другой множитель буста)
             // Важно: Уточнить, как буст взаимодействует с критом и скином
             // Сейчас: (База + АпгрейдТапа) * Скин * Крит * Буст
              tapValue *= 2; // Пример множителя буста
         }


        const newState = {
            currentTapValue: tapValue,
            totalTaps: state.totalTaps + 1,
            // Не обновляем coinCount здесь, используем currency:add
        };

        // Добавляем монеты через событие
        this.eventBus.emit('currency:add', { type: 'coin', amount: tapValue });


        // --- Обработка дропа гемов и руды ---
        const dropRandom = Math.random();
        let droppedItem = false;

        // Гемы (1% шанс - можно вынести в Config или state)
        if (dropRandom < 0.01) {
            this.eventBus.emit('currency:add', { type: 'gem', amount: 1 });
            this.eventBus.emit('effect:show', { type: 'gem', event, text: '+1 Гем' });
            droppedItem = true;
        }
        // Руда (используем шанс из state, обновляемый апгрейдами)
        else if (dropRandom < state.oreChance) {
            this.eventBus.emit('currency:add', { type: 'ore', amount: 1 });
            this.eventBus.emit('effect:show', { type: 'ore', event, text: '+1 Руда' });
            droppedItem = true;
        }

        // Показываем эффект монет только если ничего другого не выпало
        if (!droppedItem) {
             this.eventBus.emit('effect:show', { type: 'coin', event, text: `+${tapValue}` });
        }


        // Эффект крита
        if (isCritical) {
            this.eventBus.emit('effect:show', { type: 'critical', event, text: 'КРИТ!' });
            // Убираем прогресс достижения крита отсюда, если он в другом менеджере
             // this.eventBus.emit('achievement:progress', { name: 'criticalHit', amount: 1 });
        }


         // --- Прогресс уровня ---
         let newProgress = state.playerProgress + 1; // Прогресс за тап (можно изменить)
         let newLevel = state.playerLevel;
         let newProgressToNextLevel = state.progressToNextLevel;
         let levelUp = false;

         if (newProgress >= newProgressToNextLevel) {
             levelUp = true;
             newLevel++;
             newProgress = 0;
             newProgressToNextLevel = Math.max(100, Math.floor(state.progressToNextLevel * 1.5)); // Формула следующего уровня

              // Увеличение базового тапа каждые N уровней (не зависит от апгрейдов/скинов)
              if (newLevel % 5 === 0) {
                  // Увеличиваем Config.game.baseTapValue, StateManager его подхватит при syncStateFromShop
                  Config.game.baseTapValue += 1; // Или добавляем в updates ниже
                  // Важно: Нужно вызвать syncStateFromShop, чтобы пересчитать this.state.baseTapValue
              }

             this.eventBus.emit('level:up', {
                 newLevel, newProgress, newProgressToNextLevel
             });
         }

         newState.playerProgress = newProgress;
         newState.playerLevel = newLevel;
         newState.progressToNextLevel = newProgressToNextLevel;


         // Обновляем состояние один раз в конце
         this.updateState(newState);

         // Если был level up и изменился базовый тап, синхронизируем
         if (levelUp && newLevel % 5 === 0) {
             this.syncStateFromShop();
         }


         // Прогресс достижения тапов (если есть менеджер достижений)
         // this.eventBus.emit('achievement:progress', { name: 'totalTaps', amount: 1 });
    }

    handleBoost() {
        const state = this.state;

        if (state.boostActive) return;

        // Стоимость буста (например, 1 гем)
        const boostCost = 1;
        if (state.gemCount < boostCost) {
            this.eventBus.emit('notification:show', { type: 'error', message: 'Недостаточно гемов!' });
            return;
        }

        // Списываем гемы
        this.eventBus.emit('currency:remove', { type: 'gem', amount: boostCost });

        // Активируем буст в состоянии
        this.updateState({ boostActive: true });

        // Визуальный эффект буста
        this.eventBus.emit('effect:boost', { duration: 10000 }); // 10 секунд

        // Завершение буста
        setTimeout(() => {
            this.updateState({ boostActive: false });
        }, 10000);
    }


     // Добавление валюты (обновляет и total)
     addCurrency(type, amount) {
        const state = this.state;
        const newState = {};

        switch (type) {
            case 'coin':
                newState.coinCount = state.coinCount + amount;
                newState.totalCoins = (state.totalCoins || 0) + amount; // Убедимся, что totalCoins существует
                break;
            case 'gem':
                newState.gemCount = state.gemCount + amount;
                newState.totalGems = (state.totalGems || 0) + amount;
                break;
            case 'ore':
                newState.oreCount = state.oreCount + amount;
                newState.totalOre = (state.totalOre || 0) + amount;
                break;
            default: return; // Неизвестный тип валюты
        }
         // Обновляем состояние StateManager
        this.updateState(newState);

        // Синхронизируем с GameState магазина
        GameState.setCurrency(type === 'coin' ? 'coins' : type, this.state[type + 'Count']); // Используем правильные имена
    }

    // Удаление валюты
     removeCurrency(type, amount) {
        const state = this.state;
         const newState = {};
         let currentAmount = 0;

         switch (type) {
             case 'coin': currentAmount = state.coinCount; break;
             case 'gem': currentAmount = state.gemCount; break;
             case 'ore': currentAmount = state.oreCount; break;
             default: return; // Неизвестный тип валюты
         }

         if (currentAmount >= amount) {
             const remainingAmount = currentAmount - amount;
             switch (type) {
                 case 'coin': newState.coinCount = remainingAmount; break;
                 case 'gem': newState.gemCount = remainingAmount; break;
                 case 'ore': newState.oreCount = remainingAmount; break;
             }
              // Обновляем состояние StateManager
             this.updateState(newState);
             // Синхронизируем с GameState магазина
             GameState.setCurrency(type === 'coin' ? 'coins' : type, remainingAmount);
             return true; // Успешно удалено
         } else {
             console.warn(`Attempted to remove ${amount} ${type}, but only have ${currentAmount}`);
             return false; // Недостаточно валюты
         }
     }


    addEnergy(amount) {
        const newEnergy = Math.min(Config.game.maxEnergy, this.state.energy + amount);
        this.updateState({ energy: newEnergy });
    }

    removeEnergy(amount) {
        const newEnergy = Math.max(0, this.state.energy - amount);
        this.updateState({ energy: newEnergy });
        // Прогресс достижения (если есть)
        // this.eventBus.emit('achievement:progress', { name: 'energyMaster', amount: amount });
    }
}


// ====================== МЕНЕДЖЕР ИНТЕРФЕЙСА (из main.js) ======================
class UIManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.elements = {
            // Элементы из main.js
            coinCount: document.getElementById('coin-count'),
            gemCount: document.getElementById('gem-count'),
            oreCount: document.getElementById('ore-count'),
            energyCount: document.getElementById('energy-count'),
            energyBar: document.getElementById('energy-bar'),
            playerLevel: document.querySelector('.player-level'),
            progressFill: document.querySelector('.progress-fill'),
            income: document.querySelector('.income'), // Пассивный доход
            boostButton: document.getElementById('boost-button'),
            userName: document.getElementById('user-name'),
            userAvatar: document.getElementById('user-avatar'),
            levelUpNotification: document.getElementById('level-up-notification'), // Уведомление о левелапе
            // Добавим элементы для уведомлений
            notificationArea: document.getElementById('notification-area'), // Контейнер для уведомлений
             // Элементы, которыми может управлять и UIController магазина (нужно решить, кто главный)
             shopTabs: document.querySelectorAll('.shop-tab'), // Вкладки магазина
             shopTabContents: { // Контейнеры вкладок
                 helpers: document.getElementById('helpers-tab'),
                 upgrades: document.getElementById('upgrades-tab'),
                 skins: document.getElementById('skins-tab'),
                 lootboxes: document.getElementById('lootboxes-tab')
             },
             lootboxModal: document.getElementById('lootbox-modal'), // Модалка лутбокса
             lootboxTitle: document.getElementById('lootbox-title'),
             lootboxReward: document.getElementById('lootbox-reward'),
             closeLootboxBtn: document.getElementById('close-lootbox')

        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Слушаем обновление состояния от StateManager
        this.eventBus.on('state:updated', (state) => this.updateUI(state));
        // Слушаем событие загрузки состояния для первоначального рендера
        this.eventBus.on('state:loaded', (state) => this.updateUI(state));

        // События из main.js
        this.eventBus.on('user:update', ({ name, photo }) => this.updateUserInfo(name, photo));
        this.eventBus.on('level:up', () => this.showLevelUp());
        // Слушаем событие для показа уведомлений
         this.eventBus.on('notification:show', (data) => this.showNotification(data));

         // Настройка вкладок магазина (можно оставить в UIController магазина или перенести сюда)
         this.setupShopTabs();
         // Настройка модалки лутбокса (аналогично)
         this.setupLootboxModal();

         // Слушаем событие показа награды из лутбокса от App (из shop.js)
         EventBusShop.subscribe('showLootboxReward', ({ lootboxType, reward }) => {
             this.showLootboxReward(lootboxType, reward);
         });


    }
     // Форматирование чисел (можно вынести в утилиты)
     formatNumber(num) {
        if (num === undefined || num === null) return '0';
        if (num < 10000) return num.toString();
        if (num < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        if (num < 1000000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
        return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
    }


    updateUI(state) {
        if (!state) return; // Защита от отсутствия состояния

        // Обновление валют
        if (this.elements.coinCount) this.elements.coinCount.textContent = this.formatNumber(state.coinCount);
        if (this.elements.gemCount) this.elements.gemCount.textContent = this.formatNumber(state.gemCount);
        if (this.elements.oreCount) this.elements.oreCount.textContent = this.formatNumber(state.oreCount);

        // Энергия
        if (this.elements.energyCount) this.elements.energyCount.textContent = state.energy;
        if (this.elements.energyBar) this.elements.energyBar.style.width = `${(state.energy / Config.game.maxEnergy) * 100}%`;

        // Уровень и прогресс
        if (this.elements.playerLevel) this.elements.playerLevel.textContent = `Ур. ${state.playerLevel}`;
        if (this.elements.progressFill && state.progressToNextLevel > 0) {
             const progressPercentage = (state.playerProgress / state.progressToNextLevel) * 100;
             this.elements.progressFill.style.width = `${progressPercentage}%`;
        } else if (this.elements.progressFill) {
             this.elements.progressFill.style.width = `0%`; // Если деление на ноль
        }

        // Пассивный доход
        if (this.elements.income) this.elements.income.textContent = `+${this.formatNumber(state.passiveIncome)}/сек`;

        // Кнопка буста
        if (this.elements.boostButton) {
             this.elements.boostButton.disabled = state.boostActive;
             this.elements.boostButton.innerHTML = state.boostActive ?
                 '<i class="fas fa-rocket"></i> Буст Активен!' :
                 '<i class="fas fa-rocket"></i> Буст';
        }
         // Обновление магазина (вызываем рендер из UIController магазина)
         // Убедимся, что UIControllerShop инициализирован
         if (typeof UIControllerShop !== 'undefined' && UIControllerShop.renderShopItems) {
             UIControllerShop.renderShopItems(); // Перерисовываем магазин при каждом обновлении состояния
         }
    }

    updateUserInfo(name, photo) {
        if (this.elements.userName) this.elements.userName.textContent = name;
        if (this.elements.userAvatar) this.elements.userAvatar.src = photo || 'https://img.icons8.com/ios-filled/50/user-male-circle.png'; // Дефолтная иконка
    }

    showLevelUp() {
        const notification = this.elements.levelUpNotification;
        if (!notification) return;

        notification.classList.add('show');

        const sharkWrapper = document.querySelector('.shark-wrapper');
        if (sharkWrapper) {
            const glow = document.createElement('div');
            glow.className = 'evolution-glow';
            sharkWrapper.appendChild(glow);
            setTimeout(() => glow.remove(), 2000); // Удаляем свечение
        }

        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000); // Скрываем уведомление
    }

     showNotification({ type = 'info', message = '...', duration = 3000 }) {
         if (!this.elements.notificationArea || !message) return;

         const notification = document.createElement('div');
         notification.className = `notification notification-${type}`; // info, success, error, warning
         notification.textContent = message;

         this.elements.notificationArea.appendChild(notification);

         // Автоматическое скрытие
         setTimeout(() => {
             notification.classList.add('hide');
             // Удаляем элемент после анимации скрытия
             setTimeout(() => notification.remove(), 500);
         }, duration);
     }

     // --- Методы для управления UI Магазина (перенесены/дублируют UIControllerShop) ---

      setupShopTabs() {
        if (!this.elements.shopTabs) return;
        this.elements.shopTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.changeShopTab(tabName);
            });
        });
         // Активируем первую вкладку по умолчанию
         if (this.elements.shopTabs.length > 0) {
            this.changeShopTab(this.elements.shopTabs[0].dataset.tab);
         }
    }

     changeShopTab(tabName) {
         if (!this.elements.shopTabs || !this.elements.shopTabContents) return;

         this.elements.shopTabs.forEach(tab => {
             tab.classList.toggle('active', tab.dataset.tab === tabName);
         });

         for (const [name, element] of Object.entries(this.elements.shopTabContents)) {
             if (element) {
                 element.style.display = name === tabName ? 'grid' : 'none'; // Используем grid как в shop.js
             }
         }
         // Возможно, нужно перерисовать активную вкладку
         if (typeof UIControllerShop !== 'undefined' && UIControllerShop.renderShopItems) {
            // UIControllerShop.renderShopItems(); // Перерисовывать все при смене вкладки - неэффективно
             // Лучше рендерить только активную вкладку, если она еще не отрендерена
         }
     }

    setupLootboxModal() {
        if (!this.elements.closeLootboxBtn || !this.elements.lootboxModal) return;
        this.elements.closeLootboxBtn.addEventListener('click', () => {
            this.elements.lootboxModal.style.display = 'none';
        });
        // Закрытие по клику вне модалки
        window.addEventListener('click', (event) => {
            if (event.target === this.elements.lootboxModal) {
                 this.elements.lootboxModal.style.display = 'none';
            }
        });
    }

    showLootboxReward(lootboxType, reward) {
        if (!this.elements.lootboxModal || !this.elements.lootboxTitle || !this.elements.lootboxReward) return;
         // Получаем данные лутбокса из GameState магазина
         const lootbox = GameState.getLootbox(lootboxType);
         if (!lootbox) return;

         this.elements.lootboxTitle.textContent = lootbox.name;
         // Используем форматирование из ShopModule
         this.elements.lootboxReward.textContent = `Вы получили: ${ShopModule.formatReward(reward)}`;
         this.elements.lootboxModal.style.display = 'flex';
     }
}


// ====================== МЕНЕДЖЕР СОХРАНЕНИЙ (из main.js) ======================
class SaveManager {
    constructor(eventBus, firebaseConfig) {
        this.eventBus = eventBus;
        this.userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || `guest_${Date.now()}`; // Уникальный ID для гостей
        this.saveTimer = null; // Таймер для автосохранения
        this.isSaving = false; // Флаг для предотвращения одновременных сохранений


        // Инициализация Firebase (если конфигурация передана)
        if (firebaseConfig && !firebase.apps.length) { // Проверяем, что Firebase еще не инициализирован
            try {
                 firebase.initializeApp(firebaseConfig);
                 this.database = firebase.database();
                 console.log("Firebase initialized by SaveManager.");
            } catch (error) {
                 console.error("Firebase initialization failed:", error);
                 this.database = null;
            }

        } else if (firebase.apps.length) {
             this.database = firebase.database(); // Используем уже инициализированное приложение
             console.log("Firebase already initialized.");
        } else {
             this.database = null;
             console.warn("Firebase config not provided or initialization failed. Saving to localStorage.");
        }


        this.setupEventListeners();
    }

     saveGame(forceSave = false) {
        if (this.isSaving && !forceSave) {
            console.log("Save already in progress. Skipping.");
            return;
        }
        this.isSaving = true;

        // Получаем состояние из StateManager через событие
         const mainState = this.eventBus.emitSync('state:get');
         // Получаем состояние из GameState магазина
         const shopState = GameState.getState(); // Прямой вызов

         if (!mainState || !shopState) {
             console.error("Failed to get state for saving.");
             this.isSaving = false;
             return;
         }

         // Объединяем состояния. Приоритет у mainState для общих полей.
         // Магазинные данные берем из shopState.
         const combinedState = {
             ...mainState, // Состояние из main.js (валюты, уровень, энергия и т.д.)
             // Явно перезаписываем/добавляем структуры данных магазина
             helpers: shopState.helpers,
             upgrades: shopState.upgrades,
             skins: shopState.skins,
             unlockedSkins: shopState.unlockedSkins,
             currentSkin: shopState.currentSkin // Убедимся, что текущий скин сохранен
             // lootboxes сохранять не нужно, это статичные данные
             // currencies из shopState не сохраняем, т.к. они дублируются в mainState
         };
         // Удаляем ненужные для сохранения поля (например, объекты DOM)
         delete combinedState.eventBus; // Если вдруг попал в state

         console.log("Attempting to save game state for user:", this.userId);
         // console.log("Combined state to save:", combinedState);


        if (this.database) {
            // Сохранение в Firebase
            this.database.ref('users/' + this.userId).set(combinedState)
                .then(() => {
                    console.log('Game saved successfully to Firebase');
                    this.eventBus.emit('game:saved');
                     this.isSaving = false;
                })
                .catch(error => {
                    console.error('Error saving game to Firebase:', error);
                    this.saveToLocalStorage(combinedState); // Пытаемся сохранить локально при ошибке Firebase
                     this.isSaving = false;
                });
        } else {
            // Сохранение в LocalStorage
            this.saveToLocalStorage(combinedState);
             this.isSaving = false;
        }
    }

    saveToLocalStorage(state) {
        try {
            localStorage.setItem(`gameState_${this.userId}`, JSON.stringify(state));
            console.log('Game saved successfully to LocalStorage');
            this.eventBus.emit('game:saved');
        } catch (error) {
            console.error('Error saving game to LocalStorage:', error);
             // Можно показать уведомление пользователю
             this.eventBus.emit('notification:show', { type: 'error', message: 'Ошибка сохранения игры!' });
        }
    }


    loadGame() {
        console.log("Attempting to load game state for user:", this.userId);
        if (this.database) {
            // Загрузка из Firebase
            this.database.ref('users/' + this.userId).once('value')
                .then((snapshot) => {
                    const savedState = snapshot.val();
                    if (savedState) {
                        console.log('Game loaded successfully from Firebase');
                        // Загружаем состояние в оба менеджера
                         this.eventBus.emit('state:load', savedState); // Для StateManager (main.js)
                         GameState.loadState(savedState); // Для GameState (shop.js)
                         // После загрузки нужна синхронизация
                         this.eventBus.emit('state:loaded', savedState); // Общее событие после загрузки
                    } else {
                        console.log('No saved game found in Firebase. Trying LocalStorage.');
                        this.loadFromLocalStorage(); // Пытаемся загрузить из локального хранилища
                    }
                })
                .catch(error => {
                    console.error('Error loading game from Firebase:', error);
                    this.loadFromLocalStorage(); // Пытаемся загрузить локально при ошибке Firebase
                });
        } else {
            // Загрузка из LocalStorage
            this.loadFromLocalStorage();
        }
    }

    loadFromLocalStorage() {
        try {
            const savedStateString = localStorage.getItem(`gameState_${this.userId}`);
            if (savedStateString) {
                const savedState = JSON.parse(savedStateString);
                 console.log('Game loaded successfully from LocalStorage');
                 // Загружаем состояние в оба менеджера
                 this.eventBus.emit('state:load', savedState); // Для StateManager (main.js)
                 GameState.loadState(savedState); // Для GameState (shop.js)
                 // После загрузки нужна синхронизация
                 this.eventBus.emit('state:loaded', savedState); // Общее событие после загрузки
            } else {
                console.log('No saved game found in LocalStorage. Starting new game.');
                 // Генерируем событие для инициализации новой игры, если нужно
                 this.eventBus.emit('game:new');
            }
        } catch (error) {
            console.error('Error loading game from LocalStorage:', error);
             // Можно показать уведомление
             this.eventBus.emit('notification:show', { type: 'error', message: 'Ошибка загрузки сохранения!' });
             this.eventBus.emit('game:new'); // Начинаем новую игру при ошибке
        }
    }

    setupEventListeners() {
        // Автосохранение каждые 30 секунд
        this.saveTimer = setInterval(() => {
            this.saveGame();
        }, 30000); // 30 секунд

        // Сохранение при закрытии/сворачивании вкладки
         // 'beforeunload' может быть ненадежным на мобильных, особенно для Telegram Web Apps
         // 'visibilitychange' или события жизненного цикла Telegram Web App могут быть лучше
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                 console.log("Page hidden, forcing save.");
                 this.saveGame(true); // Принудительное сохранение
            }
        });
         // Дополнительно можно использовать API Telegram Web App, если оно предоставляет события закрытия/сворачивания
         // window.Telegram.WebApp.onEvent('viewportChanged', (isStateStable) => {
         //     if (!isStateStable) { // Пример: сохраняем, когда окно сворачивается
         //         this.saveGame(true);
         //     }
         // });

         // Очистка таймера при необходимости (например, при выходе из игры)
         // window.addEventListener('unload', () => {
         //     if (this.saveTimer) clearInterval(this.saveTimer);
         // });

    }
}


// ====================== МЕНЕДЖЕР ДОСТИЖЕНИЙ (из main.js, пример) ======================
// class AchievementManager { ... } // Оставлен без изменений из main.js, если он был


// ====================== МЕНЕДЖЕР ЭФФЕКТОВ (из main.js) ======================
class EffectManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
         this.particlesContainer = document.getElementById('particles'); // Кэшируем контейнер
         this.sharkWrapper = document.querySelector('.shark-wrapper'); // Кэшируем обертку акулы

        // Инициализация частиц при создании
        if (this.particlesContainer) {
            this.createParticles();
        } else {
            console.warn("Particles container not found.");
        }
        this.setupEventListeners();
    }

     createParticles() {
         if (!this.particlesContainer) return;
         this.particlesContainer.innerHTML = ''; // Очищаем старые частицы

         // Оптимизация: не создаем слишком много частиц
         const particleCount = Math.min(100, Math.floor(window.innerWidth / 15));

         const fragment = document.createDocumentFragment(); // Используем фрагмент для производительности

         for (let i = 0; i < particleCount; i++) {
             const particle = document.createElement('div');
             particle.classList.add('particle');

             const size = Math.random() * 2 + 1;
             particle.style.width = `${size}px`;
             particle.style.height = `${size}px`;
             // Распределяем частицы по всей высоте видимой области
             particle.style.left = `${Math.random() * 100}%`;
             particle.style.top = `${Math.random() * window.innerHeight}px`; // Используем высоту окна
             particle.style.opacity = Math.random() * 0.5 + 0.1;

             // Анимация будет задана через CSS для лучшей производительности
              // Добавляем случайную задержку анимации через style
              const duration = Math.random() * 20 + 10; // От 10 до 30 секунд
              const delay = Math.random() * -duration; // Отрицательная задержка для старта в разных фазах
              particle.style.animation = `float ${duration}s linear ${delay}s infinite`;


             fragment.appendChild(particle);
         }
          this.particlesContainer.appendChild(fragment);

         // Стиль для анимации float уже должен быть в CSS. Если нет, добавляем:
         // const styleId = 'particle-float-style';
         // if (!document.getElementById(styleId)) {
         //     const style = document.createElement('style');
         //     style.id = styleId;
         //     style.innerHTML = `
         //         @keyframes float {
         //             0% { transform: translateY(0) translateX(0); opacity: 1; }
         //             50% { transform: translateY(-50px) translateX(${Math.random() * 40 - 20}px); } // Небольшое боковое смещение
         //             100% { transform: translateY(-150px) translateX(${Math.random() * 20 - 10}px); opacity: 0; }
         //         }
         //         .particle { /* Базовые стили частицы */
         //             position: absolute;
         //             background-color: rgba(255, 255, 255, 0.5);
         //             border-radius: 50%;
         //             pointer-events: none; /* Чтобы не мешали кликам */
         //             will-change: transform, opacity; /* Оптимизация */
         //         }
         //     `;
         //     document.head.appendChild(style);
         // }

    }


     showTapEffect({ type, event, text }) {
         if (!event || !this.sharkWrapper) return;

         const wrapperRect = this.sharkWrapper.getBoundingClientRect();
         // Координаты относительно обертки акулы
         const x = event.clientX - wrapperRect.left;
         const y = event.clientY - wrapperRect.top;

         // Общий контейнер для эффекта и текста
          const effectContainer = document.createElement('div');
          effectContainer.className = 'tap-effect-container';
          effectContainer.style.left = `${x}px`;
          effectContainer.style.top = `${y}px`;


         // 1. Эффект круга (если нужен)
         // const circleEffect = document.createElement('div');
         // circleEffect.className = 'tap-effect-circle'; // Добавить стили в CSS
         // effectContainer.appendChild(circleEffect);

         // 2. Текст эффекта
         const textElement = document.createElement('div');
         let textClass = 'tap-plus'; // По умолчанию для монет
         let animationDuration = 800; // мс

         switch (type) {
             case 'gem': textClass = 'tap-gem'; break;
             case 'ore': textClass = 'tap-ore'; break;
             case 'energy': textClass = 'tap-energy'; break; // Если нужно показывать расход энергии
             case 'critical':
                 textClass = 'critical-hit';
                 animationDuration = 1000; // Дольше для крита
                 break;
         }
         textElement.className = `tap-text ${textClass}`;
         textElement.innerText = text;
         effectContainer.appendChild(textElement);

         // Добавляем контейнер в обертку акулы
         this.sharkWrapper.appendChild(effectContainer);

         // Удаление после анимации
         setTimeout(() => {
             effectContainer.remove();
         }, animationDuration);
     }


    activateBoostEffect({ duration }) {
         if (!this.sharkWrapper) return;

         const boostEffect = document.createElement('div');
         boostEffect.className = 'boost-effect-overlay'; // Задаем стили в CSS
         // Пример стилей в CSS:
         /*
         .boost-effect-overlay {
             position: absolute;
             top: 0; left: 0; right: 0; bottom: 0;
             border-radius: 50%; / Или по форме акулы /
             background: radial-gradient(circle, rgba(0, 255, 255, 0.4) 0%, rgba(0, 150, 255, 0) 70%);
             animation: pulse 0.6s infinite alternate;
             pointer-events: none;
             z-index: 5; / Над акулой, но под текстом /
         }
         @keyframes pulse {
             from { transform: scale(1); opacity: 0.7; }
             to { transform: scale(1.1); opacity: 0.4; }
         }
         */
         this.sharkWrapper.appendChild(boostEffect);


         setTimeout(() => {
             boostEffect.remove();
         }, duration);
     }

    setupEventListeners() {
        this.eventBus.on('effect:show', (data) => this.showTapEffect(data));
        this.eventBus.on('effect:boost', (data) => this.activateBoostEffect(data));
    }
}



// =======================================================================
// ====================== КОД ИЗ SHOP.JS (МОДИФИЦИРОВАННЫЙ) ======================
// =======================================================================


// Используем отдельную шину событий для магазина, чтобы избежать конфликтов имен
// или интегрируем с основной шиной EventBus, если требуется тесное взаимодействие.
// Пока оставим отдельную для простоты.
const EventBusShop = (() => {
    const events = {};
    return {
        subscribe: (event, callback) => {
            if (!events[event]) events[event] = [];
            events[event].push(callback);
        },
        publish: (event, data) => {
            if (events[event]) {
                events[event].forEach(callback => callback(data));
            }
        }
    };
})();


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
             state.currencies.coins = loadedState.coinCount ?? state.currencies.coins;
             state.currencies.gems = loadedState.gemCount ?? state.currencies.gems;
             state.currencies.ore = loadedState.oreCount ?? state.currencies.ore;
             state.helpers = loadedState.helpers ?? state.helpers;
             state.upgrades = loadedState.upgrades ?? state.upgrades;
             state.skins = loadedState.skins ?? state.skins; // Важно: может перезаписать измененные цены/параметры
             state.currentSkin = loadedState.currentSkin ?? state.currentSkin;
             state.unlockedSkins = loadedState.unlockedSkins ?? state.unlockedSkins;
             console.log("GameState (shop) loaded specific parts from combined state.");
             // Уведомляем подписчиков магазина об обновлении
             EventBusShop.publish('stateLoaded');
             EventBusShop.publish('currencyUpdated'); // Обновить UI валют
         } else {
             // Если нет сохраненных данных, пытаемся загрузить из localStorage (старая логика shop.js)
             const savedStateLocal = localStorage.getItem('gameState_shop'); // Используем другое имя ключа
             if (savedStateLocal) {
                 try {
                      state = JSON.parse(savedStateLocal);
                      console.log("GameState (shop) loaded from localStorage.");
                      EventBusShop.publish('stateLoaded');
                      EventBusShop.publish('currencyUpdated');
                 } catch (e) {
                      console.error("Error parsing shop state from localStorage", e);
                 }
             }
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

// ========================
// 2. SHOP MODULE
// ========================
const ShopModule = (() => {
    // Calculate current cost with price increase
    const getCurrentCost = (baseCost, owned, costIncrease = 1.1) => {
        return Math.floor(baseCost * Math.pow(costIncrease, owned));
    };

    // Buy helper
    const buyHelper = (helperId) => {
        const helper = GameState.getHelper(helperId);
        if (!helper) return false;

        const currentCost = getCurrentCost(helper.cost, helper.owned, helper.costIncrease);
        // Используем StateManager для проверки и списания валюты
        const mainEventBus = window.gameCore?.eventBus; // Получаем доступ к основной шине
        if (!mainEventBus) {
            console.error("Main EventBus not accessible from ShopModule");
            return false; // Не можем списать валюту
        }
         // Проверяем валюту через основной StateManager
         const mainState = mainEventBus.emitSync('state:get');
         if (!mainState || mainState.coinCount < currentCost) { // Проверяем именно coinCount
            mainEventBus.emit('notification:show', { type: 'error', message: 'Недостаточно монет!' });
            return false;
         }

         // Списываем валюту через StateManager
         mainEventBus.emit('currency:remove', { type: 'coin', amount: currentCost });


        // Обновляем состояние в GameState магазина
        helper.owned++;
        GameState.saveState(); // Сохраняем локальный бэкап GameState
        // Уведомляем основное ядро о покупке для пересчета статов
        mainEventBus.emit('item:purchased', { type: 'helper', id: helperId });
        // Уведомляем UI магазина об изменении
        EventBusShop.publish('itemPurchased', { itemId: helperId, itemType: 'helper' });
        return true;

    };


    // Buy upgrade
    const buyUpgrade = (upgradeId) => {
        const upgrade = GameState.getUpgrade(upgradeId);
         if (!upgrade || (upgrade.maxLevel && upgrade.owned >= upgrade.maxLevel)) {
            // Уведомление об ошибке или максимальном уровне
             const mainEventBus = window.gameCore?.eventBus;
             if (upgrade && upgrade.maxLevel && upgrade.owned >= upgrade.maxLevel) {
                  mainEventBus?.emit('notification:show', { type: 'info', message: 'Максимальный уровень!' });
             }
             return false;
         }


        const currentCost = getCurrentCost(upgrade.cost, upgrade.owned, upgrade.costIncrease);
        const currencyType = upgrade.currency; // 'coins', 'gems', 'ore'

         // Проверка и списание через StateManager (main.js)
         const mainEventBus = window.gameCore?.eventBus;
         if (!mainEventBus) return false;

         const mainState = mainEventBus.emitSync('state:get');
         let hasEnoughCurrency = false;
         let currencyNameForNotification = '';

         switch (currencyType) {
             case 'coins':
                 hasEnoughCurrency = mainState.coinCount >= currentCost;
                 currencyNameForNotification = 'монет';
                 break;
             case 'gems':
                 hasEnoughCurrency = mainState.gemCount >= currentCost;
                 currencyNameForNotification = 'гемов';
                 break;
             case 'ore':
                  hasEnoughCurrency = mainState.oreCount >= currentCost;
                  currencyNameForNotification = 'руды';
                  break;
         }


         if (!hasEnoughCurrency) {
             mainEventBus.emit('notification:show', { type: 'error', message: `Недостаточно ${currencyNameForNotification}!` });
             return false;
         }

         // Списываем валюту (тип 'coin' для coins, 'gem' для gems, 'ore' для ore)
          const currencyTypeForEvent = currencyType === 'coins' ? 'coin' : currencyType;
          mainEventBus.emit('currency:remove', { type: currencyTypeForEvent, amount: currentCost });


        // Обновляем состояние в GameState магазина
        upgrade.owned++;
        GameState.saveState(); // Локальный бэкап
        // Уведомляем основное ядро для пересчета статов
         mainEventBus.emit('item:purchased', { type: 'upgrade', id: upgradeId });
         // Уведомляем UI магазина
        EventBusShop.publish('itemPurchased', { itemId: upgradeId, itemType: 'upgrade' });
        return true;
    };

    // Buy or equip skin
    const handleSkin = (skinId) => {
        const skin = GameState.getSkin(skinId);
        if (!skin) return false;
        const mainEventBus = window.gameCore?.eventBus;
         if (!mainEventBus) return false;


        if (skin.owned) {
            // Equip skin
            GameState.getState().currentSkin = skinId; // Обновляем в GameState магазина
            GameState.saveState(); // Локальный бэкап
            mainEventBus.emit('skin:update', { skinId }); // Уведомляем StateManager (main.js)
            EventBusShop.publish('skinSelected', { skinId }); // Уведомляем UI магазина
             mainEventBus.emit('notification:show', { type: 'success', message: `Скин "${skin.name}" надет!` });
            return true;
        } else {
            // Buy skin
             // Проверяем все валюты через StateManager (main.js)
             const mainState = mainEventBus.emitSync('state:get');
             let canAfford = true;
             let missingCurrency = '';

             if (mainState.coinCount < skin.cost) { canAfford = false; missingCurrency = 'монет'; }
             if (canAfford && mainState.gemCount < skin.costGems) { canAfford = false; missingCurrency = 'гемов'; }
             if (canAfford && mainState.oreCount < skin.costOre) { canAfford = false; missingCurrency = 'руды'; }
             // Проверка на stars удалена

              if (!canAfford) {
                  mainEventBus.emit('notification:show', { type: 'error', message: `Недостаточно ${missingCurrency}!` });
                  return false;
              }

             // Списываем валюты через StateManager
             if (skin.cost > 0) mainEventBus.emit('currency:remove', { type: 'coin', amount: skin.cost });
             if (skin.costGems > 0) mainEventBus.emit('currency:remove', { type: 'gem', amount: skin.costGems });
             if (skin.costOre > 0) mainEventBus.emit('currency:remove', { type: 'ore', amount: skin.costOre });
             // Списание stars удалено


            // Обновляем состояние в GameState магазина
            skin.owned = true;
            if (!GameState.getState().unlockedSkins.includes(skinId)) {
                GameState.getState().unlockedSkins.push(skinId);
            }
             GameState.getState().currentSkin = skinId; // Сразу надеваем купленный скин
            GameState.saveState(); // Локальный бэкап

             // Уведомляем StateManager (main.js) о новом скине
              mainEventBus.emit('skin:update', { skinId });
              // Уведомляем UI магазина
              EventBusShop.publish('itemPurchased', { itemId: skinId, itemType: 'skin' });
              EventBusShop.publish('skinSelected', { skinId }); // Уведомляем UI магазина о выборе
              mainEventBus.emit('notification:show', { type: 'success', message: `Скин "${skin.name}" куплен и надет!` });
            return true;
        }
    };

     // Open lootbox
     const openLootbox = (type) => {
         const lootbox = GameState.getLootbox(type);
         if (!lootbox) return null;
         const mainEventBus = window.gameCore?.eventBus;
         if (!mainEventBus) return null;


         // Проверка валюты (только монеты, так как ключи удалены)
         const mainState = mainEventBus.emitSync('state:get');
         if (mainState.coinCount < lootbox.cost) {
              mainEventBus.emit('notification:show', { type: 'error', message: 'Недостаточно монет!' });
              return null;
         }

         // Списываем монеты
         mainEventBus.emit('currency:remove', { type: 'coin', amount: lootbox.cost });
         // Списание ключей удалено


         // Определяем награду
         const reward = determineLootboxReward(lootbox.rewards);
         // Применяем награду (обновляет GameState и основной StateManager)
         applyReward(reward);

         // Сохраняем GameState (локальный бэкап)
         GameState.saveState();

          // Уведомляем UI через шину магазина для показа модалки
          EventBusShop.publish('showLootboxReward', { lootboxType: type, reward });

         return reward; // Возвращаем награду для возможной доп. обработки
     };


    // Determine lootbox reward
    const determineLootboxReward = (possibleRewards) => {
        const rand = Math.random();
        let cumulativeChance = 0;

        for (const rewardInfo of possibleRewards) {
            cumulativeChance += rewardInfo.chance;
            if (rand < cumulativeChance) {
                let reward = { type: rewardInfo.type };

                if (reward.type === 'coins' || reward.type === 'gems' || reward.type === 'ore') {
                    reward.amount = Math.floor(Math.random() * (rewardInfo.max - rewardInfo.min + 1)) + rewardInfo.min;
                } else if (reward.type === 'helper' || reward.type === 'skin') {
                    reward.rarity = rewardInfo.rarity;
                     reward.itemId = selectRandomItem(reward.type, reward.rarity, reward.type === 'skin'); // Передаем флаг isSkin

                     if (!reward.itemId) { // Если подходящий предмет не найден (например, все скины уже есть)
                        // Fallback: даем монеты
                         console.log(`No available ${reward.type} of rarity ${reward.rarity} found. Giving coins instead.`);
                         reward = { type: 'coins', amount: Math.floor(rewardInfo.min * 0.5) || 1000 }; // Даем часть монет от мин. награды лутбокса
                    }
                }
                return reward;
            }
        }

        // Fallback, если что-то пошло не так с шансами
        console.warn("Lootbox reward calculation failed to determine reward based on chances. Falling back to coins.");
        return { type: 'coins', amount: 500 };
    };

     // Select random item by type and rarity
     const selectRandomItem = (itemType, rarity, onlyUnowned = false) => {
         const state = GameState.getState();
         let possibleItems = [];

         if (itemType === 'helper') {
             // Для помощников просто выбираем по редкости
             possibleItems = state.helpers.filter(h => h.rarity === rarity);
         } else if (itemType === 'skin') {
              // Для скинов выбираем по редкости, опционально только те, которых еще нет
              possibleItems = state.skins.filter(s => s.rarity === rarity && (!onlyUnowned || !s.owned));
              // console.log(`Finding skin: rarity=${rarity}, onlyUnowned=${onlyUnowned}. Found:`, possibleItems.map(s=>s.id));
         }

         if (possibleItems.length > 0) {
             const randomIndex = Math.floor(Math.random() * possibleItems.length);
             return possibleItems[randomIndex].id;
         }
          // console.log(`No items found for type=${itemType}, rarity=${rarity}, onlyUnowned=${onlyUnowned}`);
         return null; // Нет подходящих предметов
     };


    // Apply reward to game state (both StateManager and GameState)
     const applyReward = (reward) => {
         const mainEventBus = window.gameCore?.eventBus;
         if (!mainEventBus) return;


         switch (reward.type) {
             case 'coins':
             case 'gems':
             case 'ore':
                 // Добавляем валюту через основной StateManager
                  const currencyType = reward.type === 'coins' ? 'coin' : reward.type;
                  mainEventBus.emit('currency:add', { type: currencyType, amount: reward.amount });
                 break;
             case 'helper':
                 const helper = GameState.getHelper(reward.itemId);
                 if (helper) {
                     helper.owned++;
                     // Уведомляем основной StateManager для пересчета пассивного дохода
                      mainEventBus.emit('item:purchased', { type: 'helper', id: reward.itemId });
                 }
                 break;
             case 'skin':
                 const skin = GameState.getSkin(reward.itemId);
                  if (skin && !skin.owned) { // Скин выпал и его не было
                     skin.owned = true;
                     if (!GameState.getState().unlockedSkins.includes(skin.id)) {
                         GameState.getState().unlockedSkins.push(skin.id);
                     }
                      // Уведомляем основной StateManager, но не меняем текущий скин
                      mainEventBus.emit('item:purchased', { type: 'skin', id: reward.itemId });
                      // Можно добавить уведомление о новом скине
                      mainEventBus.emit('notification:show', { type: 'success', message: `Получен новый скин: ${skin.name}!` });
                 } else if (skin && skin.owned) { // Дубликат скина
                     // Конвертируем дубликат в монеты
                     const duplicateCoinReward = Math.floor(skin.cost * 0.2) || 1000; // 20% от стоимости или 1000 монет
                     mainEventBus.emit('currency:add', { type: 'coin', amount: duplicateCoinReward });
                     // Модифицируем объект reward для правильного отображения
                     reward.wasDuplicate = true;
                      reward.originalType = 'skin'; // Сохраняем исходный тип
                      reward.type = 'coins'; // Меняем тип на монеты
                      reward.amount = duplicateCoinReward; // Устанавливаем сумму монет
                      console.log(`Duplicate skin ${skin.id} converted to ${duplicateCoinReward} coins.`);
                 } else if (!skin) {
                      console.error(`Skin with id ${reward.itemId} not found in GameState.`);
                 }
                 break;
             default:
                 console.warn("Unknown reward type:", reward.type);
         }
          // Сохранение основного состояния будет вызвано через SaveManager
          // GameState.saveState(); // Сохраняем локальный бэкап магазина
     };


    // Format reward text for display
    const formatReward = (reward) => {
        switch (reward.type) {
            case 'coins':
                 // Если это был дубликат, указываем это
                 if (reward.wasDuplicate) {
                     const originalSkin = GameState.getSkin(reward.itemId); // Получаем инфо об оригинальном скине
                     return `${formatNumber(reward.amount)} монет (Дубликат скина: ${originalSkin?.name ?? reward.itemId})`;
                 }
                 return `${formatNumber(reward.amount)} монет`;
            case 'gems': return `${formatNumber(reward.amount)} гемов`;
            case 'ore': return `${formatNumber(reward.amount)} руды`;
            case 'helper':
                const helper = GameState.getHelper(reward.itemId);
                return `Помощник: ${helper ? helper.name : reward.itemId}`;
            case 'skin': // Этот кейс сработает только если скин не был дубликатом
                 const skin = GameState.getSkin(reward.itemId);
                 return `Новый скин: ${skin ? skin.name : reward.itemId}`;
            default: return `Неизвестная награда (${reward.type})`;
        }
    };

    // Format large numbers (можно использовать из UIManager)
     const formatNumber = (num) => {
         if (num === undefined || num === null) return '0';
         if (num < 10000) return num.toString();
         if (num < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
         if (num < 1000000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
         return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
     };


    // Public API
    return {
        buyHelper,
        buyUpgrade,
        handleSkin,
        openLootbox,
        formatReward,
        formatNumber, // Экспортируем для UIController
        getCurrentCost // Экспортируем для UIController
    };
})();

// ========================
// 3. UI CONTROLLER (Магазин)
// ========================
// Переименовываем, чтобы не конфликтовать с UIManager из main.js
const UIControllerShop = (() => {
    // DOM Elements (получаем их заново или используем кеш из основного UIManager)
    const elements = {
         // Валюты не обновляем здесь, это делает основной UIManager
         tabs: document.querySelectorAll('.shop-tab'),
         tabContents: {
             helpers: document.getElementById('helpers-tab'),
             upgrades: document.getElementById('upgrades-tab'),
             skins: document.getElementById('skins-tab'),
             lootboxes: document.getElementById('lootboxes-tab')
         },
         // Модалка лутбокса управляется основным UIManager
         // lootboxModal: document.getElementById('lootbox-modal'),
         // lootboxTitle: document.getElementById('lootbox-title'),
         // lootboxReward: document.getElementById('lootbox-reward'),
         // closeLootboxBtn: document.getElementById('close-lootbox')
    };

    // Инициализация UI Магазина (вызывается из App.init)
    const init = () => {
        // Вкладки настраиваются основным UIManager
        // setupTabs();
        // Модалка настраивается основным UIManager
        // setupLootboxModal();

        // Первоначальный рендер контента магазина
        renderShopItems();

         // Подписываемся на события магазина для перерисовки
         EventBusShop.subscribe('itemPurchased', ({ itemType }) => {
             // Перерисовываем только нужную вкладку для оптимизации
             switch (itemType) {
                 case 'helper': renderHelpers(); break;
                 case 'upgrade': renderUpgrades(); break;
                 case 'skin': renderSkins(); break;
             }
             // Обновляем лутбоксы, т.к. изменилась валюта
              renderLootboxes();

         });
         // Перерисовываем скины при выборе нового
         EventBusShop.subscribe('skinSelected', renderSkins);
         // Перерисовываем всё при обновлении валют (т.к. кнопки зависят от них)
         EventBusShop.subscribe('currencyUpdated', renderShopItems);
         // Перерисовываем все при загрузке состояния
         EventBusShop.subscribe('stateLoaded', renderShopItems);

    };


    // Render all shop items (вызывается при инициализации и обновлении состояния)
     const renderShopItems = () => {
         if (!elements.tabContents.helpers) {
              // console.warn("Shop tab containers not ready yet for rendering.");
              return; // Если DOM еще не готов
         }
         // console.log("Rendering all shop items..."); // Отладка
         renderHelpers();
         renderUpgrades();
         renderSkins();
         renderLootboxes();
     };


    // Render helper items
    const renderHelpers = () => {
         const helpers = GameState.getState().helpers;
         const container = elements.tabContents.helpers;
         if (!container) return;
         container.innerHTML = ''; // Очищаем перед рендером
         const mainState = window.gameCore?.eventBus?.emitSync('state:get'); // Получаем основное состояние для проверки валюты
         const userCoins = mainState?.coinCount ?? 0;


         helpers.forEach(helper => {
             const currentCost = ShopModule.getCurrentCost(helper.cost, helper.owned, helper.costIncrease);
             // Проверяем монеты из основного состояния
              const canAfford = userCoins >= currentCost;


             const itemHTML = `
             <div class="shop-item-card ${helper.rarity}" id="shop-item-${helper.id}">
                 <div class="card-header">
                 <div class="card-icon"><i class="fas fa-fish"></i></div>
                 <div class="card-title">${helper.name}</div>
                 <div class="rarity-badge ${helper.rarity}">${helper.rarity.charAt(0).toUpperCase() + helper.rarity.slice(1)}</div>
                 <div class="card-price">
                     <span class="price-tag coins-price">
                     <i class="fas fa-coins"></i> ${ShopModule.formatNumber(currentCost)}
                     </span>
                 </div>
                 </div>
                 <div class="card-body">
                 <div class="card-description">
                     +${helper.income} 💲/сек. Уровень: <span id="${helper.id}-level">${helper.owned}</span>
                 </div>
                 <button class="card-button ${helper.owned > 0 ? 'owned' : ''}"
                         onclick="AppShop.buyHelper('${helper.id}')"
                         ${!canAfford ? 'disabled' : ''}>
                     ${helper.owned > 0 ? `Куплено: ${helper.owned}` : 'Купить'}
                 </button>
                 </div>
             </div>
             `;
             container.insertAdjacentHTML('beforeend', itemHTML);
         });
     };


    // Render upgrade items
    const renderUpgrades = () => {
        const upgrades = GameState.getState().upgrades;
        const container = elements.tabContents.upgrades;
        if (!container) return;
        container.innerHTML = '';
         const mainState = window.gameCore?.eventBus?.emitSync('state:get'); // Получаем основное состояние
         const userCurrencies = {
             coins: mainState?.coinCount ?? 0,
             gems: mainState?.gemCount ?? 0,
             ore: mainState?.oreCount ?? 0,
         };


        upgrades.forEach(upgrade => {
            const currentCost = ShopModule.getCurrentCost(upgrade.cost, upgrade.owned, upgrade.costIncrease);
            const isMaxLevel = upgrade.maxLevel && upgrade.owned >= upgrade.maxLevel;
            let canAfford = false;
            let costText = '';
            let iconClass = '';
            const currencyType = upgrade.currency; // 'coins', 'gems', 'ore'

            // Проверяем нужную валюту из основного состояния
             canAfford = !isMaxLevel && (userCurrencies[currencyType] >= currentCost);
             costText = ShopModule.formatNumber(currentCost);


             switch (currencyType) {
                 case 'coins': iconClass = 'fas fa-coins'; break;
                 case 'gems': iconClass = 'fas fa-gem'; break;
                 case 'ore': iconClass = 'fas fa-cube'; break; // Используем fa-cube для руды
             }

             // Иконка для апгрейда
             let upgradeIcon = 'fa-chart-line'; // По умолчанию
             if (upgrade.id === 'powerTap') upgradeIcon = 'fa-fist-raised';
             else if (upgrade.id === 'criticalChance') upgradeIcon = 'fa-bolt';
             else if (upgrade.id === 'oreChance') upgradeIcon = 'fa-gem'; // Можно другую, но fa-gem логична
             else if (upgrade.id.includes('energy')) upgradeIcon = 'fa-battery-three-quarters';


              // Описание эффекта
              let effectDescription = '';
              switch (upgrade.id) {
                   case 'powerTap': effectDescription = `+${upgrade.effect} к базовому урону`; break;
                   case 'criticalChance': effectDescription = `+${(upgrade.effect * 100).toFixed(1)}% к шансу крита`; break;
                   case 'oreChance': effectDescription = `+${(upgrade.effect * 100).toFixed(1)}% к шансу руды`; break;
                   case 'energyRegen': effectDescription = `+${upgrade.effect} к регенерации энергии`; break;
                   case 'energyMax': effectDescription = `+${upgrade.effect} к максимуму энергии`; break;
                   case 'incomeMultiplier': effectDescription = `x${upgrade.effect} к доходу от помощников`; break; // Уточнить, если эффект накопительный
                   default: effectDescription = `Эффект: ${upgrade.effect}`;
              }


            const itemHTML = `
            <div class="shop-item-card ${upgrade.rarity}" id="shop-item-${upgrade.id}">
                <div class="card-header">
                <div class="card-icon"><i class="fas ${upgradeIcon}"></i></div>
                <div class="card-title">${upgrade.name}</div>
                <div class="rarity-badge ${upgrade.rarity}">${upgrade.rarity.charAt(0).toUpperCase() + upgrade.rarity.slice(1)}</div>
                <div class="card-price">
                    <span class="price-tag ${currencyType}-price">
                    <i class="${iconClass}"></i> ${costText}
                    </span>
                </div>
                </div>
                <div class="card-body">
                <div class="card-description">
                     ${effectDescription}
                    Уровень: <span id="${upgrade.id}-level">${upgrade.owned}/${upgrade.maxLevel || '∞'}</span>
                </div>
                <button class="card-button ${isMaxLevel ? 'maxed' : ''}"
                        onclick="AppShop.buyUpgrade('${upgrade.id}')"
                        ${isMaxLevel || !canAfford ? 'disabled' : ''}>
                    ${isMaxLevel ? 'Макс' : 'Улучшить'}
                </button>
                </div>
            </div>
            `;
            container.insertAdjacentHTML('beforeend', itemHTML);
        });
    };

    // Render skin items
    const renderSkins = () => {
        const skins = GameState.getState().skins;
         const currentSkinId = GameState.getState().currentSkin; // ID текущего скина из GameState магазина
        const container = elements.tabContents.skins;
        if (!container) return;
        container.innerHTML = '';
         const mainState = window.gameCore?.eventBus?.emitSync('state:get'); // Основное состояние для валют
         const userCurrencies = {
             coins: mainState?.coinCount ?? 0,
             gems: mainState?.gemCount ?? 0,
             ore: mainState?.oreCount ?? 0,
             // stars и keys удалены
         };


        skins.forEach(skin => {
            const isOwned = skin.owned;
            const isEquipped = currentSkinId === skin.id; // Сравниваем с текущим скином из GameState

             // Проверяем, хватает ли валюты на покупку (если скин не куплен)
              let canAfford = false;
              if (!isOwned) {
                   canAfford = userCurrencies.coins >= skin.cost &&
                               userCurrencies.gems >= skin.costGems &&
                               userCurrencies.ore >= skin.costOre;
                               // Проверка на stars удалена
              }


            // Prepare price display
            let priceHTML = '';
            if (skin.cost > 0) {
                priceHTML += `<span class="price-tag coins-price"><i class="fas fa-coins"></i> ${ShopModule.formatNumber(skin.cost)}</span>`;
            }
            if (skin.costGems > 0) {
                priceHTML += `<span class="price-tag gems-price"><i class="fas fa-gem"></i> ${skin.costGems}</span>`;
            }
            if (skin.costOre > 0) {
                priceHTML += `<span class="price-tag ore-price"><i class="fas fa-cube"></i> ${skin.costOre}</span>`;
            }
             // Отображение цены на stars удалено

             // Если скин бесплатный или уже куплен, не показываем цену (или показываем "Куплено")
             if (isOwned) {
                  priceHTML = '<span class="price-tag owned-tag">Куплено</span>';
             } else if (priceHTML === '') {
                  priceHTML = '<span class="price-tag free-tag">Бесплатно</span>'; // Для базового скина
             }


            // Иконка скина (предполагаем, что изображение одно, но можно менять)
            // TODO: Добавить разные src для иконок скинов, если они есть
             const skinIconSrc = "https://raw.githubusercontent.com/sinobu1/shark-tapper/main/shark.png"; // Заглушка


            const itemHTML = `
            <div class="shop-item-card ${skin.rarity} ${isEquipped ? 'equipped-skin' : ''}" id="shop-item-${skin.id}">
                <div class="card-header">
                <div class="card-icon skin-icon">
                     <img src="${skinIconSrc}" alt="${skin.name}">
                </div>
                <div class="card-title">${skin.name}</div>
                <div class="rarity-badge ${skin.rarity}">${skin.rarity.charAt(0).toUpperCase() + skin.rarity.slice(1)}</div>
                 <div class="card-price">
                      ${isOwned ? '' : priceHTML}  </div> </div>
                 <div class="card-body">
                 <div class="card-description">
                     ${skin.multiplier > 1 ? `x${skin.multiplier} к силе тапа` : 'Стандартный NFT скин'}
                 </div>
                 <button class="card-button ${isEquipped ? 'equipped' : isOwned ? 'owned' : ''}"
                         onclick="AppShop.handleSkin('${skin.id}')"
                         ${isEquipped || (!isOwned && !canAfford) ? 'disabled' : ''}>
                     ${isEquipped ? 'Надет' : isOwned ? 'Надеть' : 'Купить'}
                 </button>
                 </div>
             </div>
            `;
            container.insertAdjacentHTML('beforeend', itemHTML);
        });
    };

    // Render lootbox items
    const renderLootboxes = () => {
        const lootboxes = GameState.getState().lootboxes;
        const container = elements.tabContents.lootboxes;
        if (!container) return;
        container.innerHTML = '';
         const mainState = window.gameCore?.eventBus?.emitSync('state:get'); // Основное состояние
         const userCoins = mainState?.coinCount ?? 0;
         // Ключи не проверяем


        for (const [type, box] of Object.entries(lootboxes)) {
             // Проверяем только монеты
             const canAfford = userCoins >= box.cost;


            const itemHTML = `
            <div class="shop-item-card ${type}" id="shop-item-${type}-lootbox">
                <div class="card-header">
                <div class="card-icon"><i class="fas fa-box-open"></i></div>
                <div class="card-title">${box.name}</div>
                <div class="rarity-badge ${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="card-price">
                     <span class="price-tag coins-price"><i class="fas fa-coins"></i> ${ShopModule.formatNumber(box.cost)}</span>
                     </div>
                </div>
                <div class="card-body">
                 <div class="card-description">
                     ${type === 'common' ? 'Шанс получить обычные и редкие предметы' :
                       type === 'rare' ? 'Шанс получить редкие и эпические предметы' :
                       type === 'epic' ? 'Шанс получить эпические и легендарные предметы' :
                       'Гарантированный легендарный предмет (?)'}
                 </div>
                 <button class="card-button"
                         onclick="AppShop.openLootbox('${type}')"
                         ${!canAfford ? 'disabled' : ''}>
                     Открыть
                 </button>
                 </div>
             </div>
            `;
            container.insertAdjacentHTML('beforeend', itemHTML);
        }
    };

    // Public API
    return {
        init,
        renderShopItems // Доступен для вызова извне (например, из UIManager)
    };
})();


// ========================
// 5. MAIN APP CONTROLLER (Магазин)
// ========================
// Переименовываем, чтобы не конфликтовать с глобальным App (если он есть)
const AppShop = (() => {
    // Инициализация модуля магазина (вызывается после основного GameCore)
    const init = () => {
         console.log('Shop App initializing...');
         GameState.loadState(null); // Пытаемся загрузить состояние магазина (из localStorage или будет перезаписано SaveManager)
         UIControllerShop.init(); // Инициализируем UI магазина
         console.log('Shop App initialized');
     };


    // Public methods that are called from HTML (onclick)
    const buyHelper = (helperId) => {
        ShopModule.buyHelper(helperId);
        // Обновление UI произойдет через события
    };

    const buyUpgrade = (upgradeId) => {
        ShopModule.buyUpgrade(upgradeId);
        // Обновление UI произойдет через события
    };

    const handleSkin = (skinId) => {
        ShopModule.handleSkin(skinId);
        // Обновление UI произойдет через события
    };

    const openLootbox = (type) => {
        ShopModule.openLootbox(type);
        // Показ модалки и обновление UI произойдет через события
    };

    // Public API
    return {
        init,
        buyHelper,
        buyUpgrade,
        handleSkin,
        openLootbox
    };
})();



// ====================== ЯДРО ИГРЫ (из main.js - Инициализация) ======================
class GameCore {
    constructor() {
         console.log("GameCore constructor started.");
         this.eventBus = new EventBus(); // Основная шина событий
         this.stateManager = new StateManager(this.eventBus);
         this.uiManager = new UIManager(this.eventBus);
         // SaveManager инициализируется с основной eventBus
         this.saveManager = new SaveManager(this.eventBus, Config.firebase);
         // AchievementManager (если есть)
         // this.achievementManager = new AchievementManager(this.eventBus);
         this.effectManager = new EffectManager(this.eventBus);

         // Делаем eventBus доступным глобально для модулей магазина (не лучший подход, но простой)
          window.gameCore = this; // Доступ к экземпляру GameCore
          console.log("GameCore instance created, eventBus assigned.");


         this.init();
    }

     init() {
         console.log("GameCore init sequence started.");
         // 1. Инициализация пользователя Telegram
         this.initTelegramUser();

         // 2. Загрузка состояния игры (SaveManager вызовет события state:load или game:new)
         this.saveManager.loadGame(); // Это инициирует загрузку в StateManager и GameState

         // 3. Инициализация частиц (уже в конструкторе EffectManager)
         // this.effectManager.createParticles();

          // 4. Инициализация Магазина (после загрузки основного состояния)
          // Вызываем инициализацию магазина после того, как основное состояние потенциально загружено
          // Можно сделать это по событию 'state:loaded' или 'game:new'
          this.eventBus.on('state:loaded', () => {
              console.log("state:loaded event received in GameCore, initializing AppShop.");
              AppShop.init();
              // Дополнительная синхронизация после инициализации магазина
               this.stateManager.syncStateFromShop();
          });
           this.eventBus.on('game:new', () => {
               console.log("game:new event received in GameCore, initializing AppShop.");
               AppShop.init();
               // Синхронизация для установки начальных значений из магазина (если нужно)
               this.stateManager.syncStateFromShop();
           });


         // 5. Подписка на события UI (клики и т.д.)
         this.setupCoreEventListeners();

         // 6. Запуск игровых циклов (пассивный доход, регенерация)
         this.startGameLoops();

         console.log("GameCore init sequence finished.");
     }

    initTelegramUser() {
        if (window.Telegram && window.Telegram.WebApp) {
             const tg = window.Telegram.WebApp;
             tg.ready(); // Сообщаем Telegram, что приложение готово
             tg.expand(); // Расширяем окно

             if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                 const user = tg.initDataUnsafe.user;
                 console.log("Telegram user data:", user);
                 // Используем eventBus для обновления UI
                 this.eventBus.emit('user:update', {
                     name: user.first_name || user.username || 'Игрок',
                     photo: user.photo_url || null // Используем null, если нет фото, UIManager подставит дефолт
                 });
             } else {
                 console.warn("Telegram user data not available.");
                  this.eventBus.emit('user:update', { name: 'Гость', photo: null });
             }
        } else {
             console.warn("Telegram WebApp API not found.");
             // Устанавливаем дефолтные значения для гостя
              this.eventBus.emit('user:update', { name: 'Гость', photo: null });
        }
    }


    setupCoreEventListeners() {
        // Обработка нажатия на акулу
        const sharkElement = document.querySelector('.shark');
         if (sharkElement) {
             sharkElement.addEventListener('click', (e) => {
                 this.eventBus.emit('game:tap', { event: e });
             });
         } else {
              console.error("Shark element not found!");
         }

        // Обработка кнопки буста
        const boostButton = document.getElementById('boost-button');
        if (boostButton) {
            boostButton.addEventListener('click', () => {
                this.eventBus.emit('game:boost');
            });
        } else {
             console.error("Boost button not found!");
        }
    }

    startGameLoops() {
         // Пассивный доход
         setInterval(() => {
             // Получаем доход из stateManager, который синхронизирован с магазином
             const state = this.stateManager.getState();
             if (state.passiveIncome > 0) {
                 // Добавляем доход каждую секунду
                  this.eventBus.emit('currency:add', { type: 'coin', amount: state.passiveIncome });
             }
         }, 1000);

         // Регенерация энергии
         setInterval(() => {
             const state = this.stateManager.getState();
              // Используем Config.game.maxEnergy и Config.game.energyRegenRate,
              // которые могли быть обновлены апгрейдами магазина через syncStateFromShop
             if (state.energy < Config.game.maxEnergy) {
                 this.eventBus.emit('energy:add', { amount: Config.game.energyRegenRate });
             }
         }, 1000);

         // Автосохранение управляется SaveManager
     }

}


// ====================== ЗАПУСК ИГРЫ ======================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed.");
    // Создаем экземпляр GameCore, который запустит всю инициализацию
    if (!window.gameCoreInstance) { // Предотвращаем двойную инициализацию
         window.gameCoreInstance = new GameCore();
         console.log("GameCore instance started.");
    }

     // Старый запуск магазина App.init() больше не нужен здесь,
     // так как он вызывается из GameCore.init() после загрузки состояния
     // App.init(); // Удалено
});

// Глобальный доступ к AppShop для HTML onclick атрибутов
window.AppShop = AppShop;