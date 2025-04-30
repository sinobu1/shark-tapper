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
                     +${helper.income} Монет/сек. Уровень: <span id="${helper.id}-level">${helper.owned}</span>
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
            } else if (skin.cost === 0) {
                priceHTML = '<span class="price-tag free-tag">Бесплатно</span>';
            } else {
                // Сборка цены...
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

