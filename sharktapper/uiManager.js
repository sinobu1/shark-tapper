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
        console.log(`updateUI called: state.gemCount=${state.gemCount}, formatted=${this.formatNumber(state.gemCount)}`);
         if (this.elements.gemCount) { // Дополнительная проверка на всякий случай
             this.elements.gemCount.textContent = this.formatNumber(state.gemCount);
         } else {
             console.error("UI element for gemCount not found!");
               }

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
           if (!this.elements.notificationArea || !message) return;
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