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
             case 'gem':
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
         const success = mainEventBus.emit('currency:remove', { type: 'coin', amount: lootbox.cost });
          if (!success) {
               mainEventBus.emit('notification:show', { type: 'error', message: 'Ошибка списания монет!' });
              return null;
                         }


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

                if (reward.type === 'coins' || reward.type === 'gem' || reward.type === 'ore') {
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
             case 'gem':
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
                    const originalSkin = GameState.getSkin(reward.itemId);
                    const skinName = originalSkin ? originalSkin.name : reward.itemId;
                    return `${formatNumber(reward.amount)} монет (Дубликат скина: ${skinName})`;
                 }
                 return `${formatNumber(reward.amount)} монет`;
            case 'gem': return `${formatNumber(reward.amount)} гемов`;
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