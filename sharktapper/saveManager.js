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
            console.log("Saving game state. gemCount to save:", combinedState.gemCount);
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
                         console.log("Loading game state. loaded gemCount:", savedState?.gemCount);
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