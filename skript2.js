// --- Инициализация Telegram Web App ---
 let tg = null;
 let telegramUserId = null;
 try {
     tg = window.Telegram.WebApp;
     tg.ready(); // Сообщаем Telegram, что приложение готово
     if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
         telegramUserId = tg.initDataUnsafe.user.id;
         console.log("Telegram User ID:", telegramUserId);
         const playerNameEl = document.querySelector('.player-name');
         if (playerNameEl && tg.initDataUnsafe.user.first_name) {
             playerNameEl.textContent = tg.initDataUnsafe.user.first_name;
         }
     } else {
         console.error("Не удалось получить данные пользователя Telegram.");
     }
 } catch (e) {
     console.error("Telegram WebApp SDK не найден.", e);
 }

 // --- Инициализация Firebase ---
 const firebaseConfig = {
     apiKey: "AIzaSyDgi8vq_3Wpky7o_bzWbVuKRtOShGjd5o4",
     authDomain: "tralalero-fec07.firebaseapp.com",
     databaseURL: "https://tralalero-fec07-default-rtdb.firebaseio.com",
     projectId: "tralalero-fec07",
     storageBucket: "tralalero-fec07.firebasestorage.app",
     messagingSenderId: "322571108862",
     appId: "1:322571108862:web:14f4fe3a8168abab19c0af"
 };

 let database = null;
 try {
     firebase.initializeApp(firebaseConfig);
     database = firebase.database();
     console.log("Firebase Initialized");
 } catch (e) {
     console.error("Firebase initialization failed:", e);
 }

 // --- Основные переменные игры ---
 let coinCount = 0, gemCount = 0, oreCount = 0, energy = 100, maxEnergy = 100;
 let passiveIncome = 0, playerLevel = 0, playerProgress = 0, progressToNextLevel = 100;
 let baseTapValue = 1, totalCoins = 0, totalGems = 0, totalOre = 0, totalTaps = 0;
 let incomeMultiplier = 1, criticalChance = 0.05, criticalMultiplier = 2, oreChance = 0.03;
 let energyRegenRate = 1, energyCostPerTap = 1, boostActive = false;
 let savedHelpers = {}, savedSkins = {}, savedUpgrades = {}; skinsData= {};

 // --- Достижения ---
 const achievements = {
     firstTap: { name: "Первые шаги", description: "Сделайте 100 тапов", threshold: 100, unlocked: false },
     richTapper: { name: "Богатый тапер", description: "Заработайте 10,000 монет", threshold: 10000, unlocked: false },
     sharkMaster: { name: "Мастер акул", description: "Достигните 10 уровня", threshold: 10, unlocked: false },
     criticalHit: { name: "Критический удар", description: "Сделайте 10 критических ударов", threshold: 10, unlocked: false, progress: 0 },
     energyMaster: { name: "Энергичный", description: "Используйте 1000 энергии", threshold: 1000, unlocked: false, progress: 0 }
 };

 // --- Данные магазина ---
 const helpersData = [
     { id: 'dolphin', name: 'Дельфин', description: '+20 монет/сек', icon: 'fas fa-fish', cost: 500, income: 20, currency: 'coins' },
     { id: 'orca', name: 'Косатка', description: '+50 монет/сек', icon: 'fas fa-whale', cost: 1500, income: 50, currency: 'coins' },
     { id: 'whale', name: 'Кит', description: '+100 монет/сек', icon: 'fas fa-water', cost: 5000, income: 100, currency: 'coins' },
     { id: 'shark', name: 'Акула', description: '+200 монет/сек', icon: 'fas fa-shark', cost: 15000, income: 200, currency: 'coins' }
 ];
 const upgradesData = [
     { id: 'powerTap', name: 'Сильный удар', description: '+1 к базовому урону', icon: 'fas fa-fist-raised', cost: 2000, effect: 1, currency: 'coins' },
     { id: 'criticalChance', name: 'Критический шанс', description: '+10% к шансу крита', icon: 'fas fa-bolt', cost: 5000, effect: 0.1, currency: 'coins' },
     { id: 'oreChance', name: 'Удача рудокопа', description: '+5% к шансу руды', icon: 'fas fa-gem', cost: 3000, effect: 0.05, currency: 'coins' },
     { id: 'energyRegen', name: 'Регенерация', description: '+1 к восст. энергии/сек', icon: 'fas fa-battery-three-quarters', cost: 10, effect: 1, currency: 'gems' },
     { id: 'energyMax', name: 'Энергия+', description: '+50 к макс. энергии', icon: 'fas fa-battery-full', cost: 5, effect: 50, currency: 'gems' }
 ];
 const skinsData = [
     { id: 'golden', name: 'Золотая акула', description: 'x1.1 к доходу', icon: 'fas fa-crown', cost: 10, multiplier: 1.1, currency: 'gems' },
     { id: 'crystal', name: 'Кристальная акула', description: 'x1.25 к доходу', icon: 'fas fa-gem', cost: 50, multiplier: 1.25, currency: 'gems' },
     { id: 'legendary', name: 'Легендарная акула', description: 'x1.5 к доходу', icon: 'fas fa-dragon', cost: 150, multiplier: 1.5, currency: 'gems' },
     { id: 'neon', name: 'Неоновая акула', description: 'x2 к доходу', icon: 'fas fa-lightbulb', cost: 300, multiplier: 2, currency: 'gems' }
 ];

 // --- Игры на карте ---
 const games = {
     main: { title: "Основная игра", description: "Тапайте по акуле...", rewards: [{ type: "coin", amount: "1-10", icon: "https://raw.githubusercontent.com/sinobu1/shark-tapper/main/coin.png" }], requirements: "Доступно с 1 уровня", minLevel: 1, unlocked: true, energyCost: 1 },
     fishing: { title: "Рыбалка", description: "Ловите рыбу...", rewards: [{ type: "coin", amount: "10-100", icon: "https://raw.githubusercontent.com/sinobu1/shark-tapper/main/coin.png" }], requirements: "Требуется 5 уровень", minLevel: 5, unlocked: false, energyCost: 5 },
     mining: { title: "Добыча руды", description: "Добывайте редкие руды...", rewards: [{ type: "ore", amount: "5-20", icon: "https://raw.githubusercontent.com/sinobu1/shark-tapper/main/ruda.png" }], requirements: "Требуется 10 уровень", minLevel: 10, unlocked: false, energyCost: 10 },
     treasure: { title: "Охота за сокровищами", description: "Ищите сокровища...", rewards: [{ type: "gem", amount: "5-15", icon: "https://raw.githubusercontent.com/sinobu1/shark-tapper/main/dimond.png" }], requirements: "Требуется 15 уровень", minLevel: 15, unlocked: false, energyCost: 15 },
     racing: { title: "Гонки акул", description: "Участвуйте в гонках...", rewards: [{ type: "coin", amount: "100-500", icon: "https://raw.githubusercontent.com/sinobu1/shark-tapper/main/coin.png" }], requirements: "Требуется 20 уровень", minLevel: 20, unlocked: false, energyCost: 20 }
 };

 // --- УТИЛЬНЫЕ ФУНКЦИИ ---
 function formatNumber(num) {
     if (num === undefined || num === null) return '0';
     if (num < 10000) return num.toString();
     if (num < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
     if (num < 1000000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
     return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
 }

 function createParticles() {
     const particlesContainer = document.getElementById('particles');
     if (!particlesContainer) return;
     const particleCount = Math.floor(window.innerWidth / 10);
     particlesContainer.innerHTML = '';
     for (let i = 0; i < particleCount; i++) {
         const particle = document.createElement('div');
         particle.classList.add('particle');
         const size = Math.random() * 2 + 1;
         particle.style.cssText = `
             width: ${size}px;
             height: ${size}px;
             left: ${Math.random() * 100}%;
             top: ${Math.random() * 100}%;
             opacity: ${Math.random() * 0.5 + 0.1};
             animation: float ${(Math.random() * 20 + 10)}s linear ${(Math.random() * 5)}s infinite;
         `;
         particlesContainer.appendChild(particle);
     }
     if (!document.getElementById('particle-float-style')) {
         const style = document.createElement('style');
         style.id = 'particle-float-style';
         style.innerHTML = `
             @keyframes float {
                 0% { transform: translateY(0) translateX(0); opacity: inherit; }
                 50% { transform: translateY(-100px) translateX(20px); }
                 100% { transform: translateY(-200px) translateX(0); opacity: 0; }
             }
         `;
         document.head.appendChild(style);
     }
 }

 function showNotification(elementId, className = 'show', duration = 2000) {
     const notificationElement = document.getElementById(elementId);
     if (!notificationElement) return;
     notificationElement.classList.add(className);
     setTimeout(() => notificationElement.classList.remove(className), duration);
 }

 function showLevelUp() {
     showNotification('level-up-notification');
     const sharkWrapper = document.querySelector('.shark-wrapper');
     if (!sharkWrapper) return;
     const glow = document.createElement('div');
     glow.className = 'evolution-glow';
     sharkWrapper.appendChild(glow);
     setTimeout(() => glow.remove(), 2000);
 }

 function showAchievement(achievement) {
     const notification = document.getElementById('achievement-notification');
     if (!notification) return;
     const titleElement = notification.querySelector('h4');
     const descElement = notification.querySelector('p');
     if (titleElement) titleElement.textContent = achievement.name;
     if (descElement) descElement.textContent = achievement.description;
     showNotification('achievement-notification', 'show', 3000);
 }

 // --- ОСНОВНАЯ ЛОГИКА ИГРЫ ---
 function updateCommonUI() {
     document.getElementById('coin-count').textContent = formatNumber(coinCount);
     document.getElementById('gem-count').textContent = gemCount;
     document.getElementById('ore-count').textContent = oreCount;
     document.getElementById('energy-count').textContent = energy;
     document.getElementById('energy-bar').style.width = `${Math.max(0, Math.min(100, (energy / maxEnergy) * 100))}%`;
     document.querySelector('.player-level').textContent = `Ур. ${playerLevel}`;
     document.querySelector('.progress-fill').style.width = `${Math.min((playerProgress / progressToNextLevel) * 100, 100)}%`;
     document.querySelector('.income').textContent = `+${formatNumber(passiveIncome)}/сек`;
 }

 function checkAchievements() {
     let achievementUnlocked = false;
     if (!achievements.firstTap.unlocked && totalTaps >= achievements.firstTap.threshold) {
         achievements.firstTap.unlocked = true;
         showAchievement(achievements.firstTap);
         gemCount += 5;
         achievementUnlocked = true;
     }
     if (!achievements.richTapper.unlocked && totalCoins >= achievements.richTapper.threshold) {
         achievements.richTapper.unlocked = true;
         showAchievement(achievements.richTapper);
         gemCount += 10;
         achievementUnlocked = true;
     }
     if (!achievements.sharkMaster.unlocked && playerLevel >= achievements.sharkMaster.threshold) {
         achievements.sharkMaster.unlocked = true;
         showAchievement(achievements.sharkMaster);
         gemCount += 20;
         achievementUnlocked = true;
     }
     if (!achievements.criticalHit.unlocked && achievements.criticalHit.progress >= achievements.criticalHit.threshold) {
         achievements.criticalHit.unlocked = true;
         showAchievement(achievements.criticalHit);
         gemCount += 15;
         achievementUnlocked = true;
     }
     if (!achievements.energyMaster.unlocked && achievements.energyMaster.progress >= achievements.energyMaster.threshold) {
         achievements.energyMaster.unlocked = true;
         showAchievement(achievements.energyMaster);
         gemCount += 25;
         achievementUnlocked = true;
     }
     if (achievementUnlocked) {
         updateCommonUI();
     }
 }

 function tapShark(e) {
     if (energy < energyCostPerTap) {
         console.log("Недостаточно энергии!");
         return;
     }
     energy -= energyCostPerTap;
     achievements.energyMaster.progress += energyCostPerTap;
     let tapValue = baseTapValue;
     if (Math.random() < criticalChance) {
         tapValue *= criticalMultiplier;
         achievements.criticalHit.progress++;
         showCriticalEffect(e);
     }
     coinCount += tapValue;
     totalCoins += tapValue;
     totalTaps++;
     const dropRandom = Math.random();
     if (dropRandom < 0.01) {
         gemCount++;
         totalGems++;
         showTapEffect(e, 'gem');
     } else if (dropRandom < oreChance) {
         oreCount++;
         totalOre++;
         showTapEffect(e, 'ore');
     } else {
         showTapEffect(e, 'coin', tapValue);
     }
     playerProgress += tapValue;
     if (playerProgress >= progressToNextLevel) {
         playerLevel++;
         playerProgress -= progressToNextLevel;
         progressToNextLevel = Math.floor(progressToNextLevel * 1.5);
         showLevelUp();
     }
     updateCommonUI();
     checkAchievements();
 }

 function showTapEffect(e, type, value = 1) {
     const wrapper = document.querySelector('.shark-wrapper');
     if (!wrapper) return;
     const wrapperRect = wrapper.getBoundingClientRect();
     const clickX = e.clientX - wrapperRect.left;
     const clickY = e.clientY - wrapperRect.top;
     const effect = document.createElement('div');
     effect.classList.add('tap-effect');
     effect.style.cssText = `left: ${clickX}px; top: ${clickY}px;`;
     wrapper.appendChild(effect);
     const text = document.createElement('div');
     let textClass = 'tap-plus';
     let textContent = `+${value}`;
     if (type === 'gem') {
         textClass = 'tap-gem';
         textContent = '+1 Гем';
     } else if (type === 'ore') {
         textClass = 'tap-ore';
         textContent = '+1 Руда';
     }
     text.classList.add(textClass);
     text.innerText = textContent;
     text.style.cssText = `left: ${clickX}px; top: ${clickY}px;`;
     wrapper.appendChild(text);
     const duration = (type === 'gem' || type === 'ore') ? 1000 : 800;
     setTimeout(() => {
         effect.remove();
         text.remove();
     }, duration);
 }

 function showCriticalEffect(e) {
     const wrapper = document.querySelector('.shark-wrapper');
     if (!wrapper) return;
     const wrapperRect = wrapper.getBoundingClientRect();
     const clickX = e.clientX - wrapperRect.left;
     const clickY = e.clientY - wrapperRect.top;
     const critText = document.createElement('div');
     critText.classList.add('critical-hit');
     critText.innerText = 'КРИТ!';
     critText.style.cssText = `left: ${clickX}px; top: ${clickY}px;`;
     wrapper.appendChild(critText);
     setTimeout(() => critText.remove(), 1000);
 }

 function activateBoost() {
     const boostButton = document.getElementById('boost-button');
     if (!boostButton || boostActive || gemCount < 1) {
         if (gemCount < 1) console.log("Недостаточно гемов для буста!");
         return;
     }
     gemCount--;
     boostActive = true;
     const originalTapValue = baseTapValue;
     baseTapValue *= 2;
     boostButton.disabled = true;
     boostButton.innerHTML = '<i class="fas fa-rocket"></i> Буст Активен!';
     const sharkImg = document.querySelector('.shark');
     if (sharkImg) sharkImg.style.filter = 'drop-shadow(0 0 20px var(--neon-pink))';
     setTimeout(() => {
         boostActive = false;
         baseTapValue = originalTapValue;
         boostButton.disabled = false;
         boostButton.innerHTML = '<i class="fas fa-rocket"></i> Буст';
         if (sharkImg) sharkImg.style.filter = '';
         updateCommonUI();
     }, 10000);
     updateCommonUI();
 }

 // --- ПЕРСИСТЕНЦИЯ ДАННЫХ ---
 function saveGameToFirebase() {
     if (!database) {
         console.error("Firebase DB не инициализирована. Сохранение невозможно.");
         return;
     }
     if (!telegramUserId) {
         console.error("Нет ID пользователя Telegram. Сохранение в Firebase невозможно.");
         return;
     }
     const gameState = {
         coinCount, gemCount, oreCount, energy, maxEnergy,
         passiveIncome, playerLevel, playerProgress, progressToNextLevel,
         baseTapValue, totalCoins, totalGems, totalOre, totalTaps,
         incomeMultiplier, criticalChance, criticalMultiplier, oreChance,
         energyRegenRate, energyCostPerTap,
         helpers: savedHelpers || {},
         skins: savedSkins || {},
         upgrades: savedUpgrades || {},
         achievements: achievements || {}
     };
     database.ref('userData/' + telegramUserId + '/gameState').set(gameState)
         .then(() => console.log("Игра сохранена в Firebase для пользователя:", telegramUserId))
         .catch((error) => console.error("Ошибка сохранения в Firebase:", error));
 }

 function loadGameFromFirebase(callback) {
     if (!database) {
         console.error("Firebase DB не инициализирована. Загрузка невозможна.");
         initializeDefaultState();
         recalculateStatsFromItems();
         if (callback) callback();
         return;
     }
     if (!telegramUserId) {
         console.error("Нет ID пользователя Telegram. Загрузка из Firebase невозможна.");
         initializeDefaultState();
         recalculateStatsFromItems();
         if (callback) callback();
         return;
     }
     database.ref('userData/' + telegramUserId + '/gameState').once('value')
         .then((snapshot) => {
             if (snapshot.exists()) {
                 const gameState = snapshot.val();
                 console.log("Загрузка данных из Firebase для пользователя:", telegramUserId);
                 Object.assign({
                     coinCount: 0, gemCount: 0, oreCount: 0, energy: 100, maxEnergy: 100,
                     passiveIncome: 0, playerLevel: 0, playerProgress: 0, progressToNextLevel: 100,
                     baseTapValue: 1, totalCoins: 0, totalGems: 0, totalOre: 0, totalTaps: 0,
                     incomeMultiplier: 1, criticalChance: 0.05, criticalMultiplier: 2, oreChance: 0.03,
                     energyRegenRate: 1, energyCostPerTap: 1,
                     helpers: {}, skins: {}, upgrades: {},
                     achievements: {}
                 }, gameState);
                 if (gameState.achievements) {
                     for (const key in achievements) {
                         if (achievements.hasOwnProperty(key) && gameState.achievements[key]) {
                             achievements[key].unlocked = gameState.achievements[key].unlocked || false;
                             if (achievements[key].hasOwnProperty('progress')) {
                                 achievements[key].progress = gameState.achievements[key].progress || 0;
                             }
                         }
                     }
                 } else {
                     for (const key in achievements) {
                         if (achievements.hasOwnProperty(key)) {
                             achievements[key].unlocked = false;
                             if (achievements[key].hasOwnProperty('progress')) {
                                 achievements[key].progress = 0;
                             }
                         }
                     }
                 }
             } else {
                 console.log("Нет сохраненных данных в Firebase. Инициализация по умолчанию.");
                 initializeDefaultState();
             }
             recalculateStatsFromItems();
             if (callback) callback();
         })
         .catch((error) => {
             console.error("Ошибка загрузки из Firebase:", error);
             initializeDefaultState();
             recalculateStatsFromItems();
             if (callback) callback();
         });
 }

 function initializeDefaultState() {
     coinCount = 0; gemCount = 0; oreCount = 0; energy = 100; maxEnergy = 100;
     passiveIncome = 0; playerLevel = 0; playerProgress = 0; progressToNextLevel = 100;
     baseTapValue = 1; totalCoins = 0; totalGems = 0; totalOre = 0; totalTaps = 0;
     incomeMultiplier = 1; criticalChance = 0.05; criticalMultiplier = 2; oreChance = 0.03;
     energyRegenRate = 1; energyCostPerTap = 1;
     savedHelpers = {}; savedSkins = {}; savedUpgrades = {};
     for (const key in achievements) {
         if (achievements.hasOwnProperty(key)) {
             achievements[key].unlocked = false;
             if (achievements[key].hasOwnProperty('progress')) {
                 achievements[key].progress = 0;
             }
         }
     }
     console.log("Default state initialized.");
 }

 function recalculateStatsFromItems() {
     passiveIncome = 0;
     if (savedHelpers) {
         for (const id in savedHelpers) {
             const helperData = helpersData.find(h => h.id === id);
             if (helperData && savedHelpers[id]?.owned > 0) {
                 passiveIncome += (helperData.income * savedHelpers[id].owned);
             }
         }
     }
     baseTapValue = 1;
     criticalChance = 0.05;
     oreChance = 0.03;
     energyRegenRate = 1;
     maxEnergy = 100;
     if (savedUpgrades) {
         for (const id in savedUpgrades) {
             const upgradeData = upgradesData.find(u => u.id === id);
             if (upgradeData && savedUpgrades[id]?.owned) {
                 switch(id) {
                     case 'powerTap': baseTapValue += upgradeData.effect; break;
                     case 'criticalChance': criticalChance += upgradeData.effect; break;
                     case 'oreChance': oreChance += upgradeData.effect; break;
                     case 'energyRegen': energyRegenRate += upgradeData.effect; break;
                     case 'energyMax': maxEnergy += upgradeData.effect; break;
                 }
             }
         }
     }
     energy = Math.min(energy, maxEnergy);
     incomeMultiplier = 1;
     if (savedSkins) {
         for (const id in savedSkins) {
             const skinData = skinsData.find(s => s.id === id);
             if (skinData && savedSkins[id]?.owned) {
                 incomeMultiplier = skinData.multiplier;
                 break;
             }
         }
     }
     console.log("Stats recalculated.");
 }

 // --- ИНИЦИАЛИЗАЦИЯ ---
 document.addEventListener('DOMContentLoaded', () => {
     console.log("DOM Loaded. Initializing...");
     createParticles();
     loadGameFromFirebase(() => {
         console.log("Game data loaded/initialized. Proceeding with UI setup.");
         initializeCurrentPage();
         updateCommonUI();
         setActiveNavButton();
         startIntervals();
         console.log("Initialization complete.");
     });
 });

 function initializeCurrentPage() {
     if (document.getElementById('main-container')) {
         console.log("Initializing Main Page...");
     }
     if (document.getElementById('map-container')) {
         console.log("Initializing Map Page...");
         initMapPage();
     }
     if (document.getElementById('profile-container')) {
         console.log("Initializing Profile Page...");
         initProfilePage();
     }
     if (document.getElementById('shop-container')) {
         console.log("Initializing Shop Page...");
         initShopPage();
     }
 }

 function setActiveNavButton() {
     const navButtons = document.querySelectorAll('.bottom-nav a.nav-button');
     navButtons.forEach(btn => btn.classList.remove('active'));
     const pageMap = {
         'main-container': 'index.html',
         'shop-container': 'shop.html',
         'profile-container': 'profile.html',
         'map-container': 'map.html'
     };
     for (const containerId in pageMap) {
         if (document.getElementById(containerId)) {
             document.querySelector(`.bottom-nav a.nav-button[href="${pageMap[containerId]}"]`)?.classList.add('active');
             break;
         }
     }
 }

 // --- ТИМЕРЫ ---
 let passiveIncomeInterval = null;
 let energyRegenInterval = null;
 let autoSaveInterval = null;

 function startIntervals() {
     if (passiveIncomeInterval) clearInterval(passiveIncomeInterval);
     if (energyRegenInterval) clearInterval(energyRegenInterval);
     if (autoSaveInterval) clearInterval(autoSaveInterval);
     passiveIncomeInterval = setInterval(() => {
         if (passiveIncome > 0) {
             const incomePerTick = passiveIncome / 2;
             coinCount += incomePerTick;
             totalCoins += incomePerTick;
             updateCommonUI();
         }
     }, 500);
     energyRegenInterval = setInterval(() => {
         if (energy < maxEnergy) {
             energy = Math.min(maxEnergy, energy + (energyRegenRate / 2));
             updateCommonUI();
         }
     }, 500);
     autoSaveInterval = setInterval(saveGameToFirebase, 30000);
     console.log("Intervals started.");
 }

 window.addEventListener('beforeunload', saveGameToFirebase);
 document.addEventListener('visibilitychange', () => {
     if (document.visibilityState === 'hidden') {
         saveGameToFirebase();
     }
 });

 // --- ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ СТРАНИЦ ---
 function initMapPage() {
     // Инициализация страницы карты
 }

 function initProfilePage() {
     // Инициализация страницы профиля
     updateAchievementsDisplay();
 }

 function initShopPage() {
     // Инициализация страницы магазина
 }

 function updateAchievementsDisplay() {
     // Обновление отображения достижений
 }

