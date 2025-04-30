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
       // EventBusShop.subscribe('currencyUpdated', () => {
        //     const shopCurrencies = GameState.getState().currencies;
         //    this.updateState({
          //       coinCount: shopCurrencies.coins,
          //       gemCount: shopCurrencies.gems,
          //       oreCount: shopCurrencies.ore,
                 // energy управляется здесь (main.js)
       //      });
     //   });
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
        let needsUpdate = false;
        const updates = {}; // <--- ВОТ ЭТА СТРОКА ДОЛЖНА БЫТЬ ЗДЕСЬ
       

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
            // Вызвать вибрацию ошибки (если хотите)
        if (window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('error');
           }
        return;
               }
              // ===> ДОБАВИТЬ ВИБРАЦИЮ ПРИ УСПЕШНОМ ТАПЕ <===
        if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
             // 'light', 'medium', 'heavy', 'rigid', 'soft'
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
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