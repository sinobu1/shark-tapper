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
         this.achievementManager = new AchievementManager(this.eventBus);
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