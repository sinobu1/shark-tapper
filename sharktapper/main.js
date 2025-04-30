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