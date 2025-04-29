// shop_logic.js

// --- Состояние игры ---
// Загрузка данных из localStorage или установка значений по умолчанию

// Игровые валюты и ресурсы

let starCount = parseInt(localStorage.getItem('starCount') || 3);   // Количество звезд
let keyCount = parseInt(localStorage.getItem('keyCount') || 5);     // Количество ключей для лутбоксов


// Игровые параметры и статистика
        

// Скины
let currentSkin = localStorage.getItem('currentSkin') || 'basic'; // ID текущего надетого скина
let unlockedSkins = JSON.parse(localStorage.getItem('unlockedSkins') || '["basic"]'); // Массив ID разблокированных скинов

// --- Определения данных ---

// NFT Помощники (генерируют пассивный доход)
// Загружаем из localStorage или используем массив по умолчанию
const helpers = JSON.parse(localStorage.getItem('helpers')) || [
    { id: 'dolphin', name: 'NFT Дельфин', cost: 500, income: 20, owned: 0, currency: 'coins', costIncrease: 1.15, rarity: 'common' },       // ID, Имя, Базовая стоимость, Доход, Куплено штук, Валюта покупки, Множитель удорожания, Редкость
    { id: 'orca', name: 'NFT Косатка', cost: 1500, income: 50, owned: 0, currency: 'coins', costIncrease: 1.2, rarity: 'rare' },
    { id: 'whale', name: 'NFT Кит', cost: 5000, income: 100, owned: 0, currency: 'coins', costIncrease: 1.25, rarity: 'rare' },
    { id: 'shark', name: 'NFT Акула', cost: 15000, income: 200, owned: 0, currency: 'coins', costIncrease: 1.3, rarity: 'epic' },
    { id: 'submarine', name: 'NFT Подлодка', cost: 50000, income: 500, owned: 0, currency: 'coins', costIncrease: 1.35, rarity: 'epic' },
    { id: 'fleet', name: 'NFT Флот', cost: 150000, income: 1000, owned: 0, currency: 'coins', costIncrease: 1.4, rarity: 'legendary' }
];

// NFT Улучшения (влияют на параметры игры)
// Загружаем из localStorage или используем массив по умолчанию
const upgrades = JSON.parse(localStorage.getItem('upgrades')) || [
    // ID, Имя, Базовая стоимость, Эффект (добавка к параметру), Куплено штук, Валюта покупки, Макс. уровень, Редкость, Множитель удорожания
    { id: 'powerTap', name: 'NFT Сила удара', cost: 2000, effect: 1, owned: 0, currency: 'coins', maxLevel: 10, rarity: 'common', costIncrease: 1.5 },        // Увеличивает baseTapValue
    { id: 'criticalChance', name: 'NFT Критический шанс', cost: 5000, effect: 0.1, owned: 0, currency: 'coins', maxLevel: 5, rarity: 'rare', costIncrease: 2 }, // Увеличивает criticalChance
    { id: 'oreChance', name: 'NFT Удача рудокопа', cost: 3000, effect: 0.05, owned: 0, currency: 'coins', maxLevel: 10, rarity: 'rare', costIncrease: 1.8 },   // Увеличивает oreChance
    { id: 'energyRegen', name: 'NFT Регенерация', cost: 10, effect: 1, owned: 0, currency: 'gems', maxLevel: 5, rarity: 'epic', costIncrease: 2.5 },       // Увеличивает скорость восстановления энергии (логика в основном цикле игры)
    { id: 'energyMax', name: 'NFT Энергия+', cost: 5, effect: 50, owned: 0, currency: 'gems', maxLevel: 10, rarity: 'epic', costIncrease: 1.5 },          // Увеличивает максимальный запас энергии (логика в основном цикле игры)
    { id: 'incomeMultiplier', name: 'NFT Множитель дохода', cost: 10000, effect: 1.2, owned: 0, currency: 'coins', maxLevel: 5, rarity: 'legendary', costIncrease: 3 } // Увеличивает incomeMultiplier (эффект множительный)
];

// NFT Скины (изменяют внешний вид и дают множитель дохода)
// Загружаем из localStorage или используем массив по умолчанию
const skinsData = JSON.parse(localStorage.getItem('skinsData')) || [
    // ID, Имя, Стоимость (монеты), Стоимость (гемы), Стоимость (руда), Стоимость (звезды), Множитель дохода, Куплен ли, Редкость
    { id: 'basic', name: 'NFT Базовая акула', cost: 0, costGems: 0, costOre: 0, costStars: 0, multiplier: 1, owned: true, rarity: 'common' },
    { id: 'gold', name: 'NFT Золотая акула', cost: 5000, costGems: 5, costOre: 0, costStars: 0, multiplier: 1.5, owned: false, rarity: 'rare' },
    { id: 'robot', name: 'NFT Акула-робот', cost: 10000, costGems: 0, costOre: 10, costStars: 0, multiplier: 2, owned: false, rarity: 'rare' },
    { id: 'dragon', name: 'NFT Акула-дракон', cost: 20000, costGems: 10, costOre: 0, costStars: 0, multiplier: 3, owned: false, rarity: 'epic' },
    { id: 'cyber', name: 'NFT Кибер-акула', cost: 50000, costGems: 0, costOre: 20, costStars: 0, multiplier: 5, owned: false, rarity: 'epic' },
    { id: 'legendary', name: 'NFT Легендарная акула', cost: 100000, costGems: 0, costOre: 0, costStars: 5, multiplier: 10, owned: false, rarity: 'legendary' }
];

// Обновляем статус 'owned' у скинов на основе массива unlockedSkins
skinsData.forEach(skin => {
    if (unlockedSkins.includes(skin.id)) {
        skin.owned = true; // Помечаем скин как купленный, если его ID есть в списке разблокированных
    }
});


// Данные о Лутбоксах
const lootboxes = {
    // Тип лутбокса: { Имя, Стоимость (монеты), Необходимое кол-во ключей, Массив возможных наград }
    common: {
        name: "Обычный лутбокс", cost: 5000, keys: 0, rewards: [
            // Тип награды, Мин. кол-во, Макс. кол-во, Шанс выпадения (0-1)
            { type: "coins", min: 1000, max: 5000, chance: 0.6 },
            { type: "gems", min: 1, max: 3, chance: 0.3 },
            { type: "helper", rarity: "common", chance: 0.1 } // Награда - помощник указанной редкости
        ]
    },
    rare: {
        name: "Редкий лутбокс", cost: 15000, keys: 0, rewards: [
            { type: "coins", min: 5000, max: 15000, chance: 0.5 },
            { type: "gems", min: 3, max: 5, chance: 0.3 },
            { type: "helper", rarity: "rare", chance: 0.15 },
            { type: "skin", rarity: "rare", chance: 0.05 } // Награда - скин указанной редкости
        ]
    },
    epic: {
        name: "Эпический лутбокс", cost: 50000, keys: 0, rewards: [
            { type: "coins", min: 15000, max: 50000, chance: 0.4 },
            { type: "gems", min: 5, max: 10, chance: 0.3 },
            { type: "helper", rarity: "epic", chance: 0.2 },
            { type: "skin", rarity: "epic", chance: 0.1 }
        ]
    },
    legendary: {
        name: "Легендарный лутбокс", cost: 150000, keys: 0, rewards: [
            { type: "coins", min: 50000, max: 150000, chance: 0.3 },
            { type: "gems", min: 10, max: 20, chance: 0.2 },
            { type: "helper", rarity: "legendary", chance: 0.3 },
            { type: "skin", rarity: "legendary", chance: 0.2 }
        ]
    }
};

// --- Элементы DOM ---
// Получаем ссылки на элементы для отображения информации

const starCountElement = document.getElementById('star-count');       // Отображение кол-ва звезд
const keyCountElement = document.getElementById('key-count');         // Отображение кол-ва ключей
const lootboxModal = document.getElementById('lootbox-modal');        // Модальное окно лутбокса
const lootboxTitle = document.getElementById('lootbox-title');        // Заголовок модального окна
const lootboxImage = document.getElementById('lootbox-image');        // Изображение в модальном окне (можно менять)
const lootboxReward = document.getElementById('lootbox-reward');      // Текст с наградой в модальном окне
const particlesContainer = document.getElementById('particles');      // Контейнер для эффекта частиц

// --- Вспомогательные функции ---



// Вибрация (если поддерживается устройством)
function vibrate(duration = 10) { // duration - длительность вибрации в мс
    if ('vibrate' in navigator) { // Проверяем поддержку вибрации
        try {
            navigator.vibrate(duration); // Вызываем вибрацию
        } catch (e) {
            console.warn("Vibration failed:", e); // Сообщение об ошибке, если не сработало
        }
    }
}

// Расчет текущей стоимости с учетом удорожания за каждый купленный уровень/штуку
function getCurrentCost(baseCost, owned, costIncrease = 1.1) { // Базовая стоимость, Кол-во купленных, Множитель удорожания
    // Формула: базовая_стоимость * (множитель_удорожания ^ кол-во_купленных)
    return Math.floor(baseCost * Math.pow(costIncrease, owned)); // Округляем вниз
}

// --- Функции обновления интерфейса ---

// Обновление отображения всех валют на странице
function updateCurrencyDisplay() {
    if (coinCountElement) coinCountElement.textContent = formatNumber(coinCount);
    if (gemCountElement) gemCountElement.textContent = formatNumber(gemCount);
    if (oreCountElement) oreCountElement.textContent = formatNumber(oreCount);
    if (energyCountElement) energyCountElement.textContent = formatNumber(energy); // Форматируем энергию, если нужно
    if (starCountElement) starCountElement.textContent = formatNumber(starCount);
    if (keyCountElement) keyCountElement.textContent = formatNumber(keyCount);
}

// Обновление состояния кнопки для конкретного товара (помощника, улучшения, скина)
function updateButton(itemId, itemType) {
    let item; // Данные о товаре
    let widget = document.getElementById(`shop-item-${itemId}`); // Находим карточку товара по ID
    if (!widget) return; // Выходим, если карточка не найдена

    const button = widget.querySelector('.ios-widget-button'); // Находим кнопку внутри карточки
    if (!button) return; // Выходим, если кнопка не найдена

    let currentCost; // Текущая стоимость
    let canAfford = false; // Флаг: достаточно ли средств для покупки
    let costText = ''; // Текст стоимости для отображения
    let iconClass = ''; // Класс иконки валюты

    // Логика для Помощников
    if (itemType === 'helper') {
        item = helpers.find(h => h.id === itemId); // Находим помощника в массиве helpers
        if (!item) return; // Выходим, если не найден
        currentCost = getCurrentCost(item.cost, item.owned, item.costIncrease); // Рассчитываем текущую стоимость
        canAfford = coinCount >= currentCost; // Проверяем, хватает ли монет (помощники только за монеты)

        const levelSpan = widget.querySelector(`#${itemId}-level`); // Элемент для отображения уровня/количества
        if (levelSpan) levelSpan.textContent = item.owned; // Обновляем количество купленных

        button.textContent = item.owned > 0 ? `Куплено: ${item.owned}` : 'Купить'; // Текст кнопки
        button.className = item.owned > 0 ? 'ios-widget-button owned' : 'ios-widget-button'; // Стиль кнопки
        button.disabled = !canAfford; // Доступность кнопки

        // Обновляем отображение цены
        const priceElement = widget.querySelector('.ios-widget-price .coins-price');
        if (priceElement) priceElement.innerHTML = `<i class="fas fa-coins"></i> ${formatNumber(currentCost)}`; // Вставляем иконку и стоимость

    // Логика для Улучшений
    } else if (itemType === 'upgrade') {
        item = upgrades.find(u => u.id === itemId); // Находим улучшение в массиве upgrades
        if (!item) return; // Выходим, если не найдено

        currentCost = getCurrentCost(item.cost, item.owned, item.costIncrease); // Рассчитываем текущую стоимость
        const isMaxLevel = item.maxLevel && item.owned >= item.maxLevel; // Проверяем, достигнут ли макс. уровень

        // Проверяем возможность покупки в зависимости от валюты
        if (item.currency === 'coins') {
            canAfford = coinCount >= currentCost;
            costText = formatNumber(currentCost);
            iconClass = 'fas fa-coins';
        } else if (item.currency === 'gems') {
            canAfford = gemCount >= currentCost;
            costText = formatNumber(currentCost); // Гемы обычно не форматируют как k/m/b
            iconClass = 'fas fa-gem';
        } else if (item.currency === 'ore') {
            canAfford = oreCount >= currentCost;
            costText = formatNumber(currentCost);
            iconClass = 'fas fa-cube';
        }
        // Можно добавить другие валюты, если потребуется

        const levelSpan = widget.querySelector(`#${itemId}-level`); // Элемент для отображения уровня
        if (levelSpan) levelSpan.textContent = `${item.owned}/${item.maxLevel || '∞'}`; // Показываем текущий/макс уровень (или ∞, если нет макс.)

        button.textContent = isMaxLevel ? 'Макс' : `Улучшить`; // Текст кнопки
        button.className = isMaxLevel ? 'ios-widget-button maxed' : 'ios-widget-button'; // Стиль кнопки
        button.disabled = isMaxLevel || !canAfford; // Доступность кнопки (недоступна на макс. уровне или если не хватает средств)

        // Обновляем отображение цены
        const priceElement = widget.querySelector(`.ios-widget-price .${item.currency}-price`); // Ищем элемент цены для нужной валюты
        if (priceElement) {
             priceElement.innerHTML = `<i class="${iconClass}"></i> ${costText}`; // Обновляем существующий
        } else {
            // Если элемента цены для этой валюты нет, можно его создать (опционально)
            const priceContainer = widget.querySelector('.ios-widget-price');
            if (priceContainer) {
                const newPriceTag = document.createElement('span');
                newPriceTag.className = `price-tag ${item.currency}-price`;
                newPriceTag.innerHTML = `<i class="${iconClass}"></i> ${costText}`;
                priceContainer.appendChild(newPriceTag);
            }
        }

    // Логика для Скинов
    } else if (itemType === 'skin') {
        item = skinsData.find(s => s.id === itemId); // Находим скин в массиве skinsData
        if (!item) return; // Выходим, если не найден

        if (item.owned) { // Если скин уже куплен
            button.textContent = currentSkin === itemId ? 'Надет' : 'Надеть'; // Текст: Надет (если текущий) или Надеть
            button.className = currentSkin === itemId ? 'ios-widget-button equipped' : 'ios-widget-button owned'; // Стиль кнопки
            button.disabled = false; // Кнопка всегда доступна, если скин куплен
        } else { // Если скин не куплен
            button.textContent = 'Купить'; // Текст кнопки
            button.className = 'ios-widget-button'; // Стиль кнопки
            // Проверяем возможность покупки (может требовать несколько валют)
            canAfford = coinCount >= item.cost &&
                        gemCount >= item.costGems &&
                        oreCount >= item.costOre &&
                        starCount >= item.costStars;
            button.disabled = !canAfford; // Доступность кнопки
        }
        // Отображение цены для скинов обычно статично в HTML, но можно обновлять при необходимости
    }
}

// Обновление состояния всех кнопок на странице
function updateAllButtons() {
    helpers.forEach(helper => updateButton(helper.id, 'helper'));
    upgrades.forEach(upgrade => updateButton(upgrade.id, 'upgrade'));
    skinsData.forEach(skin => updateButton(skin.id, 'skin'));
    updateLootboxButtons(); // Обновляем кнопки лутбоксов
}

// Обновление кнопок лутбоксов (проверка по стоимости монет и ключей)
function updateLootboxButtons() {
    for (const type in lootboxes) { // Проходим по всем типам лутбоксов
        const box = lootboxes[type];
        const widget = document.getElementById(`shop-item-${type}-lootbox`); // Находим карточку лутбокса
        if (widget) {
            const button = widget.querySelector('.ios-widget-button'); // Находим кнопку
            if (button) {
                // Проверяем, хватает ли монет И ключей
                const canAfford = coinCount >= box.cost && keyCount >= box.keys;
                button.disabled = !canAfford; // Устанавливаем доступность кнопки
            }
        }
    }
}


// --- Функции логики магазина ---

// Смена активной вкладки магазина (Помощники, Улучшения, Скины, Лутбоксы)
function changeTab(tabName) {
    vibrate(); // Вибрация при смене вкладки
    // Убираем класс 'active' со всех вкладок
    document.querySelectorAll('.shop-tab').forEach(tab => tab.classList.remove('active'));
    // Добавляем класс 'active' к нажатой вкладке
    document.querySelector(`.shop-tab[onclick="changeTab('${tabName}')"]`)?.classList.add('active'); // Безопасная навигация "?."

    // Скрываем все контейнеры с товарами
    document.querySelectorAll('.shop-items').forEach(tabContent => {
        if (tabContent) tabContent.style.display = 'none';
    });
    // Показываем контейнер с товарами для активной вкладки
    const activeTabContent = document.getElementById(`${tabName}-tab`);
    if (activeTabContent) activeTabContent.style.display = 'grid'; // Используем 'grid', т.к. стили задают сетку

    updateAllButtons(); // Перепроверяем доступность кнопок при смене вкладки
}

// Покупка/Улучшение товара
function buyItem(itemId, itemType) {
    vibrate(20); // Более длительная вибрация для покупки/улучшения
    let item;
    let currentCost;
    let costIncrease = 1.1; // Множитель удорожания по умолчанию

    // Логика для Помощников
    if (itemType === 'helper') {
        item = helpers.find(h => h.id === itemId);
        if (!item) return;
        costIncrease = item.costIncrease || 1.15; // Используем множитель из данных или по умолчанию
        currentCost = getCurrentCost(item.cost, item.owned, costIncrease);

        if (coinCount >= currentCost) { // Проверяем, хватает ли монет
            coinCount -= currentCost; // Списываем монеты
            item.owned++; // Увеличиваем количество купленных
            // Обновление пассивного дохода - может обрабатываться в игровом цикле
            // passiveIncome += item.income; // Пересчет пассивного дохода, если нужно
            console.log(`Куплен помощник ${item.name}. Новое кол-во: ${item.owned}. Пассивный доход требует пересчета.`);
            saveGameState(); // Сохраняем состояние игры
        } else { return; } // Недостаточно монет

    // Логика для Улучшений
    } else if (itemType === 'upgrade') {
        item = upgrades.find(u => u.id === itemId);
        if (!item) return;
        if (item.maxLevel && item.owned >= item.maxLevel) return; // Достигнут макс. уровень

        costIncrease = item.costIncrease || 1.5; // Используем множитель из данных или по умолчанию
        currentCost = getCurrentCost(item.cost, item.owned, costIncrease);

        let canAfford = false; // Флаг: можем ли позволить улучшение
        // Проверяем валюту и списываем средства
        if (item.currency === 'coins' && coinCount >= currentCost) {
            coinCount -= currentCost;
            canAfford = true;
        } else if (item.currency === 'gems' && gemCount >= currentCost) {
            gemCount -= currentCost;
            canAfford = true;
        } else if (item.currency === 'ore' && oreCount >= currentCost) {
            oreCount -= currentCost;
            canAfford = true;
        } // Добавить другие валюты при необходимости

        if (canAfford) { // Если средств хватило
            item.owned++; // Увеличиваем уровень улучшения
            // Применяем эффект улучшения (обновляем переменные состояния игры)
            applyUpgradeEffect(item.id, item.effect); // Вызываем функцию для применения эффекта
            console.log(`Улучшено ${item.name} до уровня ${item.owned}.`);
            saveGameState(); // Сохраняем состояние игры
        } else { return; } // Недостаточно средств

    } else { return; } // Неизвестный тип товара

    // Общие действия после покупки/улучшения
    updateCurrencyDisplay(); // Обновляем отображение валют
    updateButton(itemId, itemType); // Обновляем кнопку купленного/улучшенного товара
    updateAllButtons(); // Обновляем все кнопки (изменение стоимости могло повлиять на доступность других товаров)

    // Добавляем анимацию пульсации к карточке товара
    const widget = document.getElementById(`shop-item-${itemId}`);
    if (widget) {
        widget.classList.add('pulse');
        setTimeout(() => widget.classList.remove('pulse'), 300); // Убираем класс через 300 мс
    }
}

// Обработка действия со скином (покупка или надевание)
function handleSkinAction(skinId) {
    vibrate();
    const skin = skinsData.find(s => s.id === skinId); // Находим данные скина
    if (!skin) return;

    if (skin.owned) { // Если скин уже куплен
        // Надеваем скин
        currentSkin = skinId; // Обновляем ID текущего скина
        console.log(`Надет скин: ${skin.name}`);
        // Здесь можно добавить код для обновления внешнего вида главного персонажа игры
        localStorage.setItem('currentSkin', currentSkin); // Сохраняем ID надетого скина
    } else { // Если скин не куплен
        // Пытаемся купить скин
        if (coinCount >= skin.cost && gemCount >= skin.costGems && oreCount >= skin.costOre && starCount >= skin.costStars) {
            // Списываем все необходимые валюты
            coinCount -= skin.cost;
            gemCount -= skin.costGems;
            oreCount -= skin.costOre;
            starCount -= skin.costStars;

            skin.owned = true; // Помечаем скин как купленный
            if (!unlockedSkins.includes(skinId)) { // Добавляем ID в массив разблокированных, если его там нет
                unlockedSkins.push(skinId);
            }
            currentSkin = skinId; // Сразу надеваем скин после покупки
            console.log(`Куплен и надет скин: ${skin.name}`);

            saveGameState(); // Сохраняем состояние игры
            updateCurrencyDisplay(); // Обновляем отображение валют

            // Добавляем анимацию пульсации
             const widget = document.getElementById(`shop-item-${skinId}`);
             if (widget) {
                 widget.classList.add('pulse');
                 setTimeout(() => widget.classList.remove('pulse'), 300);
             }

        } else {
            console.log("Недостаточно средств для покупки скина:", skin.name);
            return; // Выходим, если не хватает валюты
        }
    }

    // Обновляем состояние всех кнопок скинов после действия
    skinsData.forEach(s => updateButton(s.id, 'skin'));
    updateAllButtons(); // Обновляем все кнопки на всякий случай
}

// Функция для применения эффектов улучшений
function applyUpgradeEffect(upgradeId, effectValue) {
    // Эта функция должна изменять соответствующие переменные состояния игры
    switch (upgradeId) {
        case 'powerTap':
            baseTapValue += effectValue; // Увеличиваем базовую силу тапа
            localStorage.setItem('baseTapValue', baseTapValue); // Сохраняем новое значение
            console.log("Сила удара увеличена. Новое базовое значение:", baseTapValue);
            break;
        case 'criticalChance':
            criticalChance += effectValue; // Увеличиваем шанс крит. удара
            localStorage.setItem('criticalChance', criticalChance);
            console.log("Шанс крита увеличен. Новый шанс:", criticalChance);
            break;
        case 'oreChance':
             oreChance += effectValue; // Увеличиваем шанс добычи руды
             localStorage.setItem('oreChance', oreChance);
             console.log("Шанс руды увеличен. Новый шанс:", oreChance);
             break;
        case 'energyRegen':
            // Нужно изменить логику регенерации энергии в основном игровом цикле
            // Можно сохранить уровень улучшения, чтобы использовать его в расчетах регенерации
            // localStorage.setItem('energyRegenLevel', upgrades.find(u=>u.id===upgradeId).owned);
            console.log("Улучшение регенерации энергии применено (эффект требует реализации в игровом цикле).");
            break;
        case 'energyMax':
            // Нужно изменить переменную максимальной энергии
             // Например: maxEnergy += effectValue; localStorage.setItem('maxEnergy', maxEnergy);
            console.log("Улучшение макс. энергии применено (эффект требует реализации).");
            break;
        case 'incomeMultiplier':
             incomeMultiplier *= effectValue; // Применяем множитель к общему множителю дохода
             localStorage.setItem('incomeMultiplier', incomeMultiplier);
             // Потребуется пересчитать общий пассивный доход с учетом нового множителя
             console.log("Множитель дохода увеличен. Новый множитель:", incomeMultiplier);
             break;
        // Добавить обработку для других улучшений
    }
}


// --- Функции Лутбоксов ---

// Открытие лутбокса указанного типа
function openLootbox(type) {
    vibrate(50); // Вибрация при открытии
    const box = lootboxes[type]; // Получаем данные лутбокса по типу
    if (!box) return; // Выходим, если тип не найден

    // Проверяем, хватает ли монет и ключей
    if (coinCount >= box.cost && keyCount >= box.keys) {
        // Списываем стоимость
        coinCount -= box.cost;
        keyCount -= box.keys;
        updateCurrencyDisplay(); // Обновляем отображение валют
        updateLootboxButtons(); // Обновляем кнопки лутбоксов сразу после траты

        // Определяем награду
        const reward = determineLootboxReward(box.rewards);

        // Применяем награду (добавляем ресурсы, помощников, скины)
        applyLootboxReward(reward);

        // Показываем модальное окно с результатом
        if (lootboxModal && lootboxTitle && lootboxReward) {
            lootboxTitle.textContent = box.name; // Устанавливаем заголовок
            lootboxReward.textContent = `Вы получили: ${formatReward(reward)}`; // Показываем, что выпало
            // Можно установить изображение в зависимости от типа лутбокса/награды
            // lootboxImage.style.backgroundImage = `url(...)`;
            lootboxModal.style.display = 'flex'; // Показываем окно
        }
        saveGameState(); // Сохраняем состояние после получения награды
        updateAllButtons(); // Обновляем все кнопки после применения награды

    } else {
        console.log(`Недостаточно средств для ${box.name}`); // Сообщение, если не хватает ресурсов
    }
}

// Закрытие модального окна лутбокса
function closeLootbox() {
    vibrate();
    if (lootboxModal) {
        lootboxModal.style.display = 'none'; // Скрываем окно
    }
}

// Определение конкретной награды из лутбокса на основе шансов
function determineLootboxReward(possibleRewards) {
    const rand = Math.random(); // Случайное число от 0 до 1
    let cumulativeChance = 0; // Накопленный шанс

    // Проходим по всем возможным наградам
    for (const rewardInfo of possibleRewards) {
        cumulativeChance += rewardInfo.chance; // Добавляем шанс текущей награды к накопленному
        if (rand < cumulativeChance) { // Если случайное число меньше накопленного шанса
            // Определили тип награды, теперь уточняем детали
            let reward = { type: rewardInfo.type };
            if (reward.type === 'coins' || reward.type === 'gems' || reward.type === 'ore') {
                // Если награда - валюта, выбираем случайное количество в заданном диапазоне
                reward.amount = Math.floor(Math.random() * (rewardInfo.max - rewardInfo.min + 1)) + rewardInfo.min;
            } else if (reward.type === 'helper' || reward.type === 'skin') {
                // Если награда - помощник или скин
                reward.rarity = rewardInfo.rarity; // Запоминаем редкость
                // Выбираем случайный предмет этого типа и редкости
                reward.itemId = selectRandomItem(reward.type, reward.rarity);
                 if (!reward.itemId) { // Если предмет не найден (например, все скины этой редкости уже есть)
                     console.warn(`Не найден ${reward.rarity} ${reward.type} для награды. Заменяем на монеты.`);
                     reward = { type: 'coins', amount: 1000 }; // Запасная награда - монеты
                 }
            }
            // Можно добавить другие типы наград
            return reward; // Возвращаем определенную награду
        }
    }
    // Запасной вариант, если что-то пошло не так (шансы не суммируются в 1 и т.п.)
    console.warn("Ошибка определения награды из лутбокса. Заменяем на монеты.");
    return { type: 'coins', amount: 500 };
}

// Вспомогательная функция для выбора случайного помощника/скина для лутбокса
function selectRandomItem(itemType, rarity) {
    let possibleItems = []; // Массив подходящих предметов
    if (itemType === 'helper') {
        // Фильтруем помощников по заданной редкости
        possibleItems = helpers.filter(h => h.rarity === rarity);
    } else if (itemType === 'skin') {
        // Фильтруем скины по редкости и проверяем, что он еще не куплен
        possibleItems = skinsData.filter(s => s.rarity === rarity && !s.owned);
    }

    if (possibleItems.length > 0) { // Если есть подходящие предметы
        const randomIndex = Math.floor(Math.random() * possibleItems.length); // Выбираем случайный индекс
        return possibleItems[randomIndex].id; // Возвращаем ID выбранного предмета
    }
    return null; // Возвращаем null, если подходящих предметов не найдено
}

// Применение награды из лутбокса к состоянию игры
function applyLootboxReward(reward) {
    switch (reward.type) {
        case 'coins':
            coinCount += reward.amount; // Добавляем монеты
            break;
        case 'gems':
            gemCount += reward.amount; // Добавляем гемы
            break;
        case 'ore':
            oreCount += reward.amount; // Добавляем руду
            break;
        case 'helper':
            const helper = helpers.find(h => h.id === reward.itemId); // Находим помощника по ID
            if (helper) {
                helper.owned++; // Увеличиваем количество
                console.log(`Получен помощник из лутбокса: ${helper.name}`);
                // Может потребоваться пересчет пассивного дохода
            }
            break;
        case 'skin':
            const skin = skinsData.find(s => s.id === reward.itemId); // Находим скин по ID
            if (skin && !skin.owned) { // Если скин найден и еще не куплен
                 skin.owned = true; // Помечаем как купленный
                 if (!unlockedSkins.includes(skin.id)) { // Добавляем в список разблокированных
                     unlockedSkins.push(skin.id);
                 }
                 console.log(`Получен скин из лутбокса: ${skin.name}`);
            } else if (skin && skin.owned) { // Если выпал дубликат уже купленного скина
                 // Компенсируем дубликат (например, монетами)
                 const duplicateCoinReward = 1000; // Пример компенсации
                 coinCount += duplicateCoinReward;
                 console.log(`Получен дубликат скина ${skin.name}, конвертирован в ${duplicateCoinReward} монет.`);
                 // Меняем тип награды для корректного отображения в сообщении
                 reward.type = 'coins';
                 reward.amount = duplicateCoinReward;
            }
            break;
        // Добавить обработку других типов наград
    }
    updateCurrencyDisplay(); // Обновляем отображение валют после применения награды
}

// Форматирование текста награды для отображения в модальном окне
function formatReward(reward) {
    switch (reward.type) {
        case 'coins': return `${formatNumber(reward.amount)} монет`;
        case 'gems': return `${formatNumber(reward.amount)} гемов`;
        case 'ore': return `${formatNumber(reward.amount)} руды`;
        case 'helper':
            const helper = helpers.find(h => h.id === reward.itemId);
            return `Помощник: ${helper ? helper.name : reward.itemId}`; // Показываем имя или ID, если имя не найдено
        case 'skin':
            const skin = skinsData.find(s => s.id === reward.itemId);
             // Проверяем, был ли это дубликат, конвертированный в монеты
             if (reward.wasDuplicate) { // Нужно добавить флаг wasDuplicate при конвертации в applyLootboxReward
                 return `${formatNumber(reward.amount)} монет (Дубликат скина)`;
             }
            return `Скин: ${skin ? skin.name : reward.itemId}`;
        default: return `Неизвестная награда (${reward.type})`;
    }
}



     // Убедитесь, что анимация @keyframes float определена в вашем CSS-файле.
     // Пример анимации float (можно поместить в CSS):
     /*
     @keyframes float {
         0% { transform: translateY(0) translateX(0); opacity: 0.5; }
         50% { transform: translateY(-80px) translateX(10px); opacity: 0.2; }
         100% { transform: translateY(-160px) translateX(-10px); opacity: 0; }
     }
     */



// --- Инициализация ---
// Выполняется после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM магазина загружен.");
    updateCurrencyDisplay(); // Отображаем начальные значения валют
    updateAllButtons(); // Устанавливаем начальное состояние всех кнопок
    changeTab('helpers'); // Устанавливаем вкладку "Помощники" как активную по умолчанию
    if (particlesContainer) { // Создаем эффект частиц, если контейнер существует
         createParticles();
         // Можно пересоздавать частицы при изменении размера окна (опционально)
         // window.addEventListener('resize', createParticles);
    }

    // Загрузка состояния игры может быть здесь, если не была выполнена ранее при старте игры
    // loadGameState(); // Функция загрузки состояния (если она есть)
});

// --- КОНЕЦ ФАЙЛА shop_logic.js ---