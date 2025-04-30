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


