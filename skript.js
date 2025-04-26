// --- Инициализация Telegram Web App ---
let tg = null;
let telegramUserId = null;
try {
    tg = window.Telegram.WebApp;
    tg.ready(); // Сообщаем Telegram, что приложение готово
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        telegramUserId = tg.initDataUnsafe.user.id;
        console.log("Telegram User ID:", telegramUserId);
        // Можно отобразить имя пользователя где-нибудь
        const playerNameEl = document.querySelector('.player-name');
        if (playerNameEl && tg.initDataUnsafe.user.first_name) {
             playerNameEl.textContent = tg.initDataUnsafe.user.first_name;
        }
    } else {
        console.error("Не удалось получить данные пользователя Telegram.");
        // Здесь можно показать ошибку или заглушку
    }
    // Пример: использовать цвета темы Telegram
    // document.body.style.backgroundColor = tg.themeParams.bg_color || '#0a0a2a';
    // document.body.style.color = tg.themeParams.text_color || 'white';
} catch (e) {
    console.error("Telegram WebApp SDK не найден.", e);
    // Возможно, игра запущена не в Telegram
}


// --- Инициализация Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyDgi8vq_3Wpky7o_bzWbVuKRtOShGjd5o4", // <-- Вставьте ваши данные
    authDomain: "tralalero-fec07.firebaseapp.com",
    databaseURL: "https://tralalero-fec07-default-rtdb.firebaseio.com", // <-- Обязательно для Realtime Database
    projectId: "tralalero-fec07",
    storageBucket: "tralalero-fec07.firebasestorage.app",
    messagingSenderId: "322571108862",
    appId: "1:322571108862:web:14f4fe3a8168abab19c0af"
};

let database = null;
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database(); // Получаем доступ к Realtime Database
    console.log("Firebase Initialized");
} catch (e) {
    console.error("Firebase initialization failed:", e);
    // Показать ошибку пользователю?
}

// Combined Script from HTML files
// --- Core Game State & Config (from index.html, potentially modified) ---
let coinCount = 0;
let gemCount = 0;
let oreCount = 0;
let energy = 100;
let maxEnergy = 100;
let passiveIncome = 0;
let playerLevel = 0;
let playerProgress = 0;
let progressToNextLevel = 100;
let baseTapValue = 1;
// let currentTapValue = 1; // Only used within tapShark, can be local
let boostActive = false;
let totalCoins = 0;
let totalGems = 0;
let totalOre = 0;
let totalTaps = 0;
let incomeMultiplier = 1;
let criticalChance = 0.05;
let criticalMultiplier = 2;
let oreChance = 0.03;
let energyRegenRate = 1;
let energyCostPerTap = 1;

// *** ИСПРАВЛЕНО: Добавлено объявление переменных ***
let savedHelpers = {};
let savedSkins = {};
let savedUpgrades = {};

// Achievements (Ensure this is defined once)
const achievements = {
    firstTap: { name: "Первые шаги", description: "Сделайте 100 тапов", threshold: 100, unlocked: false },
    richTapper: { name: "Богатый тапер", description: "Заработайте 10,000 монет", threshold: 10000, unlocked: false },
    sharkMaster: { name: "Мастер акул", description: "Достигните 10 уровня", threshold: 10, unlocked: false },
    criticalHit: { name: "Критический удар", description: "Сделайте 10 критических ударов", threshold: 10, unlocked: false, progress: 0 },
    energyMaster: { name: "Энергичный", description: "Используйте 1000 энергии", threshold: 1000, unlocked: false, progress: 0 }
};

// Shop Data (Define once, globally, using data from shop.html)
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

// Map Game Data (Define once)
const games = {
    main: { title: "Основная игра", description: "Тапайте по акуле...", rewards: [{ type: "coin", amount: "1-10", icon: "https://raw.githubusercontent.com/sinobu1/shark-tapper/main/coin.png" }], requirements: "Доступно с 1 уровня", minLevel: 1, unlocked: true, energyCost: 1 },
    fishing: { title: "Рыбалка", description: "Ловите рыбу...", rewards: [{ type: "coin", amount: "10-100", icon: "https://raw.githubusercontent.com/sinobu1/shark-tapper/main/coin.png" }], requirements: "Требуется 5 уровень", minLevel: 5, unlocked: false, energyCost: 5 },
    mining: { title: "Добыча руды", description: "Добывайте редкие руды...", rewards: [{ type: "ore", amount: "5-20", icon: "https://raw.githubusercontent.com/sinobu1/shark-tapper/main/ruda.png" }], requirements: "Требуется 10 уровень", minLevel: 10, unlocked: false, energyCost: 10 },
    treasure: { title: "Охота за сокровищами", description: "Ищите сокровища...", rewards: [{ type: "gem", amount: "5-15", icon: "https://raw.githubusercontent.com/sinobu1/shark-tapper/main/dimond.png" }], requirements: "Требуется 15 уровень", minLevel: 15, unlocked: false, energyCost: 15 },
    racing: { title: "Гонки акул", description: "Участвуйте в гонках...", rewards: [{ type: "coin", amount: "100-500", icon: "https://raw.githubusercontent.com/sinobu1/shark-tapper/main/coin.png" }], requirements: "Требуется 20 уровень", minLevel: 20, unlocked: false, energyCost: 20 }
};


// --- UTILITY FUNCTIONS (Define Once) ---
// Format numbers with k, m, b suffixes
function formatNumber(num) {
            if (num === undefined || num === null) return '0';
            if (num < 10000) {
                return num.toString();
            } else if (num < 1000000) {
                return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
            } else if (num < 1000000000) {
                return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
            } else {
                return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'b';
            }
        }

// Create floating particles
function createParticles() {
     const particlesContainer = document.getElementById('particles');
     if (!particlesContainer) return; // Only run if container exists
     const particleCount = Math.floor(window.innerWidth / 10);

     // Clear existing particles if any
     particlesContainer.innerHTML = '';

     for (let i = 0; i < particleCount; i++) {
         const particle = document.createElement('div');
         particle.classList.add('particle');
         const size = Math.random() * 2 + 1;
         particle.style.width = `${size}px`;
         particle.style.height = `${size}px`;
         particle.style.left = `${Math.random() * 100}%`;
         particle.style.top = `${Math.random() * 100}%`;
         particle.style.opacity = Math.random() * 0.5 + 0.1;
         const duration = Math.random() * 20 + 10;
         const delay = Math.random() * 5;
         particle.style.animation = `float ${duration}s linear ${delay}s infinite`;
         particlesContainer.appendChild(particle);
     }

    // Add floating animation (Ensure this style doesn't conflict if already added)
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


// --- NOTIFICATION FUNCTIONS (Define Once) ---
function showNotification(elementId, className = 'show', duration = 2000) {
     const notificationElement = document.getElementById(elementId);
     if (!notificationElement) return;
     notificationElement.classList.add(className);
     setTimeout(() => {
         notificationElement.classList.remove(className);
     }, duration);
}

// Show level up notification
function showLevelUp() {
    showNotification('level-up-notification');
    const sharkWrapper = document.querySelector('.shark-wrapper');
    if (!sharkWrapper) return;
    const glow = document.createElement('div');
    glow.className = 'evolution-glow'; // Ensure CSS for this exists
    sharkWrapper.appendChild(glow);
    setTimeout(() => glow.remove(), 2000);
}

// Show achievement notification
function showAchievement(achievement) {
    const notification = document.getElementById('achievement-notification');
    if (!notification) return;
    const titleElement = notification.querySelector('h4');
    const descElement = notification.querySelector('p');
    if (titleElement) titleElement.textContent = achievement.name;
    if (descElement) descElement.textContent = achievement.description;
    showNotification('achievement-notification', 'show', 3000);
}


// --- CORE GAME LOGIC FUNCTIONS (Define Once) ---
 // Update UI elements common across pages
function updateCommonUI() {
    const coinEl = document.getElementById('coin-count');
    const gemEl = document.getElementById('gem-count');
    const oreEl = document.getElementById('ore-count');
    const energyEl = document.getElementById('energy-count');
    const energyBarEl = document.getElementById('energy-bar');
    const levelEl = document.querySelector('.player-level');
    const progressFillEl = document.querySelector('.progress-fill');
    const incomeEl = document.querySelector('.income');

    if (coinEl) coinEl.textContent = formatNumber(coinCount);
    if (gemEl) gemEl.textContent = gemCount;
    if (oreEl) oreEl.textContent = oreCount;
    if (energyEl) energyEl.textContent = energy;
    if (energyBarEl) energyBarEl.style.width = `${Math.max(0, Math.min(100, (energy / maxEnergy) * 100))}%`;
    if (levelEl) levelEl.textContent = `Ур. ${playerLevel}`;
    if (progressFillEl) {
        const progressPercentage = (playerProgress / progressToNextLevel) * 100;
        progressFillEl.style.width = `${Math.min(progressPercentage, 100)}%`;
    }
    if (incomeEl) incomeEl.textContent = `+${formatNumber(passiveIncome)}/сек`;
}

// Check achievements
function checkAchievements() {
    let achievementUnlocked = false;
    // First tap achievement
    if (!achievements.firstTap.unlocked && totalTaps >= achievements.firstTap.threshold) {
        achievements.firstTap.unlocked = true;
        showAchievement(achievements.firstTap);
        gemCount += 5;
        achievementUnlocked = true;
    }
    // Rich tapper achievement
    if (!achievements.richTapper.unlocked && totalCoins >= achievements.richTapper.threshold) {
        achievements.richTapper.unlocked = true;
        showAchievement(achievements.richTapper);
        gemCount += 10;
        achievementUnlocked = true;
    }
    // Shark master achievement
    if (!achievements.sharkMaster.unlocked && playerLevel >= achievements.sharkMaster.threshold) {
        achievements.sharkMaster.unlocked = true;
        showAchievement(achievements.sharkMaster);
        gemCount += 20;
        achievementUnlocked = true;
    }
     // Critical hit achievement
    if (!achievements.criticalHit.unlocked && achievements.criticalHit.progress >= achievements.criticalHit.threshold) {
        achievements.criticalHit.unlocked = true;
        showAchievement(achievements.criticalHit);
        gemCount += 15;
        achievementUnlocked = true;
    }
     // Energy master achievement
    if (!achievements.energyMaster.unlocked && achievements.energyMaster.progress >= achievements.energyMaster.threshold) {
        achievements.energyMaster.unlocked = true;
        showAchievement(achievements.energyMaster);
        gemCount += 25;
        achievementUnlocked = true;
    }
    if (achievementUnlocked) {
         updateCommonUI(); // Update gem count display
         // Optionally save game state immediately after unlocking
         // saveGameToFirebase(); // Consider if immediate save is needed here
    }
}

// Tap shark function (Main Page Specific)
function tapShark(e) {
    if (energy < energyCostPerTap) {
        // Maybe show a less intrusive notification instead of alert
        console.log("Недостаточно энергии!");
        return;
    }

    energy -= energyCostPerTap;
    achievements.energyMaster.progress += energyCostPerTap;

    let tapValue = baseTapValue;
    let isCritical = false;
    if (Math.random() < criticalChance) {
        tapValue = Math.floor(baseTapValue * criticalMultiplier);
        isCritical = true;
        achievements.criticalHit.progress++;
         showCriticalEffect(e); // Show critical effect immediately
    }

    coinCount += tapValue;
    totalCoins += tapValue;
    totalTaps++;

    // Random drops
    const dropRandom = Math.random();
    if (dropRandom < 0.01) { // Gem drop chance (1%)
        gemCount++;
        totalGems++;
        showTapEffect(e, 'gem');
    } else if (dropRandom < oreChance) { // Ore drop chance
        oreCount++;
        totalOre++;
        showTapEffect(e, 'ore');
    } else { // Normal tap
         showTapEffect(e, 'coin', tapValue);
    }

    // Update progress
    playerProgress += tapValue; // Gain progress based on tap value? Or just 1 per tap? Let's use tapValue.
    if (playerProgress >= progressToNextLevel) {
        playerLevel++;
        playerProgress = playerProgress - progressToNextLevel; // Carry over excess progress
        progressToNextLevel = Math.floor(progressToNextLevel * 1.5);
        showLevelUp();
        // Increase tap value every 5 levels? Already defined in loadGame based on saved state
        // if (playerLevel % 5 === 0) { baseTapValue++; }
    }

    updateCommonUI();
    checkAchievements();
}

// Show tap effects (Main Page Specific)
function showTapEffect(e, type, value = 1) {
     const wrapper = document.querySelector('.shark-wrapper'); // Assuming this exists on the main page
     if (!wrapper) return;
     const wrapperRect = wrapper.getBoundingClientRect();
     const clickX = e.clientX - wrapperRect.left;
     const clickY = e.clientY - wrapperRect.top;

     // Create visual effect
     const effect = document.createElement('div');
     effect.className = 'tap-effect'; // Ensure CSS exists
     effect.style.left = `${clickX}px`;
     effect.style.top = `${clickY}px`;
     wrapper.appendChild(effect);

     // Create text indicator
     const text = document.createElement('div');
     let textClass = 'tap-plus';
     let textContent = `+${value}`;
     if (type === 'gem') { textClass = 'tap-gem'; textContent = '+1 Гем'; }
     else if (type === 'ore') { textClass = 'tap-ore'; textContent = '+1 Руда'; }
     // else if (type === 'energy') { textClass = 'tap-energy'; textContent = `-${value} Энергия`; } // Energy effect?

     text.className = textClass; // Ensure CSS exists
     text.innerText = textContent;
     text.style.left = `${clickX}px`;
     text.style.top = `${clickY}px`;
     wrapper.appendChild(text);

     // Remove after animation
     const duration = (type === 'gem' || type === 'ore') ? 1000 : 800;
     setTimeout(() => {
         // Check if elements still exist before removing
         if (effect.parentNode === wrapper) wrapper.removeChild(effect);
         if (text.parentNode === wrapper) wrapper.removeChild(text);
     }, duration);
}

 // Show critical hit effect (Main Page Specific)
function showCriticalEffect(e) {
    const wrapper = document.querySelector('.shark-wrapper');
    if (!wrapper) return;
    const wrapperRect = wrapper.getBoundingClientRect();
    const clickX = e.clientX - wrapperRect.left;
    const clickY = e.clientY - wrapperRect.top;

    const critText = document.createElement('div');
    critText.className = 'critical-hit'; // Ensure CSS exists
    critText.innerText = 'КРИТ!';
    critText.style.left = `${clickX}px`;
    critText.style.top = `${clickY}px`;
    wrapper.appendChild(critText);

    setTimeout(() => {
        // Check if element still exists
        if (critText.parentNode === wrapper) wrapper.removeChild(critText);
    }, 1000);
}

// Activate boost (Main Page Specific)
function activateBoost() {
    const boostButton = document.getElementById('boost-button');
    if (!boostButton || boostActive || gemCount < 1) {
         if (gemCount < 1) console.log("Недостаточно гемов для буста!");
         return;
    }

    gemCount--;
    boostActive = true;
    const originalTapValue = baseTapValue; // Store original value
    baseTapValue *= 2; // Double tap value during boost

    boostButton.disabled = true;
    boostButton.innerHTML = '<i class="fas fa-rocket"></i> Буст Активен!';

    // Optional: Add visual effect for boost
    const sharkImg = document.querySelector('.shark');
    if (sharkImg) sharkImg.style.filter = 'drop-shadow(0 0 20px var(--neon-pink))';

    setTimeout(() => {
        boostActive = false;
        baseTapValue = originalTapValue; // Restore original tap value
        if (boostButton) { // Check if button still exists
            boostButton.disabled = false;
            boostButton.innerHTML = '<i class="fas fa-rocket"></i> Буст';
        }
        if (sharkImg) sharkImg.style.filter = ''; // Remove visual effect
        updateCommonUI(); // Update UI if needed
    }, 10000); // Boost duration: 10 seconds

    updateCommonUI(); // Update gem count
}


// --- DATA PERSISTENCE (Firebase Version) ---

// Новая функция сохранения в Firebase
function saveGameToFirebase() {
    if (!database) {
        console.error("Firebase DB не инициализирована. Сохранение невозможно.");
        return;
    }
    if (!telegramUserId) {
        console.error("Нет ID пользователя Telegram. Сохранение в Firebase невозможно.");
        // Возможно, сохранить в localStorage как резервный вариант?
        // saveGameToLocalStorage();
        return;
    }

    // Собираем ВСЕ данные, которые нужно сохранить
    const gameState = {
        coinCount, gemCount, oreCount, energy, maxEnergy,
        passiveIncome, playerLevel, playerProgress, progressToNextLevel,
        baseTapValue, totalCoins, totalGems, totalOre, totalTaps,
        incomeMultiplier, criticalChance, criticalMultiplier, oreChance,
        energyRegenRate, energyCostPerTap,
        helpers: savedHelpers || {},
        skins: savedSkins || {},
        upgrades: savedUpgrades || {},
        achievements: achievements || {} // Убедитесь, что объект achievements полный
        // Добавьте любые другие переменные состояния!
    };

    // Сохраняем данные в ветку пользователя
    database.ref('userData/' + telegramUserId + '/gameState').set(gameState)
        .then(() => {
            // Уменьшаем частоту логов сохранения
            // console.log("Игра сохранена в Firebase для пользователя:", telegramUserId);
        })
        .catch((error) => {
            console.error("Ошибка сохранения в Firebase:", error);
        });
}


// Новая функция загрузки из Firebase
function loadGameFromFirebase(callback) { // Добавляем callback
    if (!database) {
        console.error("Firebase DB не инициализирована. Загрузка невозможна.");
        initializeDefaultState(); // Инициализация по умолчанию
        recalculateStatsFromItems(); // Пересчет статов
        if (callback) callback(); // Вызов callback после инициализации
        return;
    }
    if (!telegramUserId) {
        console.error("Нет ID пользователя Telegram. Загрузка из Firebase невозможна.");
        // Загрузить из localStorage или инициализировать по умолчанию?
        // loadGameFromLocalStorage();
        initializeDefaultState();
        recalculateStatsFromItems(); // Пересчет статов
         if (callback) callback(); // Вызов callback после инициализации
        return;
    }

    database.ref('userData/' + telegramUserId + '/gameState').once('value')
        .then((snapshot) => {
            if (snapshot.exists()) {
                const gameState = snapshot.val();
                console.log("Загрузка данных из Firebase для пользователя:", telegramUserId);

                // Восстанавливаем состояние из gameState
                coinCount = gameState.coinCount || 0;
                gemCount = gameState.gemCount || 0;
                oreCount = gameState.oreCount || 0;
                energy = gameState.energy || 100;
                maxEnergy = gameState.maxEnergy || 100;
                passiveIncome = gameState.passiveIncome || 0;
                playerLevel = gameState.playerLevel || 0;
                playerProgress = gameState.playerProgress || 0;
                progressToNextLevel = gameState.progressToNextLevel || 100;
                baseTapValue = gameState.baseTapValue || 1;
                totalCoins = gameState.totalCoins || 0;
                totalGems = gameState.totalGems || 0;
                totalOre = gameState.totalOre || 0;
                totalTaps = gameState.totalTaps || 0;
                incomeMultiplier = gameState.incomeMultiplier || 1;
                criticalChance = gameState.criticalChance || 0.05;
                criticalMultiplier = gameState.criticalMultiplier || 2;
                oreChance = gameState.oreChance || 0.03;
                energyRegenRate = gameState.energyRegenRate || 1;
                energyCostPerTap = gameState.energyCostPerTap || 1;

                // Restore complex objects (shop items, achievements)
                savedHelpers = gameState.helpers || {};
                savedSkins = gameState.skins || {};
                savedUpgrades = gameState.upgrades || {};

               // Восстановление достижений
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
                    // Сброс достижений, если их нет в сохранении
                    // Вызываем только часть, отвечающую за ачивки, чтобы не сбросить остальное
                     for (const key in achievements) {
                         if (achievements.hasOwnProperty(key)) {
                              achievements[key].unlocked = false;
                              if (achievements[key].hasOwnProperty('progress')) {
                                   achievements[key].progress = 0;
                              }
                         }
                    }
                }
               // ... остальные переменные ...
            } else {
                console.log("Нет сохраненных данных в Firebase. Инициализация по умолчанию.");
                initializeDefaultState();
            }
            recalculateStatsFromItems(); // Пересчитываем статы после загрузки/инициализации
            if (callback) callback(); // Вызываем callback после загрузки и обработки данных
        })
        .catch((error) => {
            console.error("Ошибка загрузки из Firebase:", error);
            initializeDefaultState(); // Инициализация при ошибке
            recalculateStatsFromItems(); // Пересчет статов
             if (callback) callback(); // Вызов callback после инициализации
        });
}




 // Функция инициализации по умолчанию (убедитесь, что она сбрасывает все)
function initializeDefaultState() {
     // Set all state variables to their initial default values
     coinCount = 0; gemCount = 0; oreCount = 0; energy = 100; maxEnergy = 100;
     passiveIncome = 0; playerLevel = 0; playerProgress = 0; progressToNextLevel = 100;
     baseTapValue = 1; totalCoins = 0; totalGems = 0; totalOre = 0; totalTaps = 0;
     incomeMultiplier = 1; criticalChance = 0.05; criticalMultiplier = 2; oreChance = 0.03;
     energyRegenRate = 1; energyCostPerTap = 1;
     savedHelpers = {}; savedSkins = {}; savedUpgrades = {};
      // Сброс достижений тоже
    for (const key in achievements) {
        if (achievements.hasOwnProperty(key)) {
             achievements[key].unlocked = false;
             if (achievements[key].hasOwnProperty('progress')) {
                  achievements[key].progress = 0;
             }
        }
   }
   console.log("Default state initialized."); // Лог для отладки
}

 function recalculateStatsFromItems() {
     // Recalculate passive income from helpers
     passiveIncome = 0;
     if (savedHelpers) { // Проверка, что savedHelpers существует
         for (const id in savedHelpers) {
             const helperData = helpersData.find(h => h.id === id); // Use helpersData from shop
             if (helperData && savedHelpers[id]?.owned > 0) {
                 passiveIncome += (helperData.income * savedHelpers[id].owned);
             }
         }
     }

     // Apply upgrade effects
     // Reset stats before reapplying effects from saved upgrades
     baseTapValue = 1; // Start from base value
     criticalChance = 0.05; // Base critical chance
     oreChance = 0.03; // Base ore chance
     energyRegenRate = 1; // Base energy regen rate
     maxEnergy = 100; // Base max energy

     if (savedUpgrades) { // Проверка, что savedUpgrades существует
         for (const id in savedUpgrades) {
             const upgradeData = upgradesData.find(u => u.id === id); // Use upgradesData from shop
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
     // Ensure energy does not exceed new maxEnergy after load/recalculation
     energy = Math.min(energy, maxEnergy);


     // Apply skin multiplier
     incomeMultiplier = 1; // Reset first
     if (savedSkins) { // Проверка, что savedSkins существует
         // TODO: Need logic to determine the *active* skin if multiple can be owned.
         // For now, just apply the multiplier of the *first found* owned skin for simplicity.
         for (const id in savedSkins) {
              const skinData = skinsData.find(s => s.id === id);
              if (skinData && savedSkins[id]?.owned) {
                  incomeMultiplier = skinData.multiplier;
                  break; // Apply only one skin's multiplier
              }
         }
     }
      // Note: Passive income calculation currently doesn't use incomeMultiplier. Decide if it should.
      // passiveIncome *= incomeMultiplier; // Uncomment if multiplier should affect passive income
      console.log("Stats recalculated."); // Лог для отладки
 }


// --- MAP PAGE SPECIFIC FUNCTIONS ---
// DOM Element variables for map page (declared globally, assigned in initMapPage)
let gameInfoCard, gameTitleElement, gameDescriptionElement, gameRewardsElement, gameRequirementsElement, startGameBtn;
function initMapPage() {
    gameInfoCard = document.getElementById('game-info');
    gameTitleElement = document.getElementById('game-title');
    gameDescriptionElement = document.getElementById('game-description');
    gameRewardsElement = document.getElementById('game-rewards');
    gameRequirementsElement = document.getElementById('game-requirements');
    startGameBtn = document.getElementById('start-game-btn');

     // Update game locations based on player level immediately
     updateGameLocations();

     // Close game info when clicking outside
    document.addEventListener('click', (e) => {
         // Check if the click is outside the card and not on a location button
         if (gameInfoCard && !gameInfoCard.contains(e.target) && !e.target.closest('.game-location')) {
             gameInfoCard.classList.remove('show');
         }
    });
}

// Update game locations based on player level
function updateGameLocations() {
    // Update unlock status in the 'games' object based on the global playerLevel
     for (const type in games) {
         if (games[type]) { // Check if game type exists
            games[type].unlocked = playerLevel >= games[type].minLevel;
         }
     }

     const locations = document.querySelectorAll('.game-location');
     locations.forEach(location => {
         // *** ИСПРАВЛЕНО: Используем dataset.gameType (был location.dataset.gameType) ***
         const gameType = location.getAttribute('data-game-type') || location.dataset.gameType;
         if (!gameType) {
             console.warn("Game location missing data-game-type attribute:", location);
             return;
         }
         const game = games[gameType];
         if (game) {
             const iconElement = location.querySelector('i');
             const badgeElement = location.querySelector('.level-badge');

             if (game.unlocked) {
                 location.classList.remove('locked');
                 // Используем классы вместо прямого изменения стилей для лучшей практики
                 // if (iconElement) iconElement.style.color = 'white';
                 // if (badgeElement) badgeElement.style.background = 'var(--neon)';
             } else {
                 location.classList.add('locked');
                  // if (iconElement) iconElement.style.color = 'rgba(255, 255, 255, 0.3)';
                  // if (badgeElement) badgeElement.style.background = 'rgba(255, 255, 255, 0.5)';
             }
         } else {
             console.warn("No game data found for type:", gameType);
         }
     });
}

// Show game info when location is clicked
function showGameInfo(gameType) {
     const game = games[gameType];
     if (!game || !gameInfoCard) return; // Ensure elements are loaded

    // Update unlock status just in case level changed without UI update
    game.unlocked = playerLevel >= game.minLevel;

    if (!game.unlocked) {
         gameTitleElement.textContent = "Заблокировано";
         gameDescriptionElement.textContent = `Эта игра доступна с ${game.minLevel} уровня! Ваш текущий уровень: ${playerLevel}`;
         gameRewardsElement.innerHTML = `<div class="reward-item"><i class="fas fa-lock mr-1"></i> Требуется ${game.minLevel} уровень</div>`;
         gameRequirementsElement.textContent = ''; // Clear requirements text
         startGameBtn.innerHTML = '<i class="fas fa-times mr-2"></i> Закрыть';
         startGameBtn.onclick = () => gameInfoCard.classList.remove('show');
         startGameBtn.disabled = false; // Кнопка "Закрыть" всегда активна
     } else {
         gameTitleElement.textContent = game.title;
         gameDescriptionElement.textContent = game.description;
         gameRequirementsElement.textContent = `Требования: ${game.requirements} | Энергия: ${game.energyCost}`;

         gameRewardsElement.innerHTML = ''; // Clear previous rewards
         game.rewards.forEach(reward => {
             const rewardItem = document.createElement('div');
             rewardItem.className = 'reward-item';
             // Simplified reward display
             rewardItem.innerHTML = `<img src="${reward.icon || 'placeholder.png'}" alt="${reward.type}" style="width: 16px; height: 16px; margin-right: 4px;"> ${reward.amount || reward.text}`;
             gameRewardsElement.appendChild(rewardItem);
         });

         startGameBtn.innerHTML = '<i class="fas fa-play mr-2"></i> Начать игру';
         startGameBtn.onclick = () => startGame(gameType);
         // Проверяем, достаточно ли энергии для старта игры
         startGameBtn.disabled = energy < game.energyCost;
         if (startGameBtn.disabled) {
             startGameBtn.innerHTML += ' (Нет энергии)';
         }
    }

     gameInfoCard.classList.add('show');
}

// Start the selected game
function startGame(gameType) {
    const game = games[gameType];
    if (!game || !game.unlocked) return;

    if (energy < game.energyCost) {
         alert(`Недостаточно энергии! Требуется: ${game.energyCost}, у вас: ${energy}`);
         return;
    }

     // Deduct energy and save immediately
     energy -= game.energyCost;
     // *** ИСПРАВЛЕНО: Вызываем правильную функцию сохранения ***
     saveGameToFirebase(); // Save the state change
     updateCommonUI(); // Update energy display
     // Обновляем состояние кнопки в инфо-карте, если она открыта
     if (gameInfoCard.classList.contains('show') && startGameBtn) {
         startGameBtn.disabled = true; // Disable after starting
         startGameBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Запуск...'; // Indicate loading/starting
     }

    // In a real implementation, navigate or start the mini-game
    if (gameType === 'main') {
         window.location.href = 'index.html';
     } else {
         alert(`${game.title} скоро будет доступна! Энергия потрачена.`);
         // Placeholder for mini-game logic or navigation
         // window.location.href = `${gameType}.html`; // Example navigation
          // Если игра не запускается, вернем кнопку в исходное состояние
          if (gameInfoCard.classList.contains('show') && startGameBtn) {
             setTimeout(() => { // Небольшая задержка для наглядности
                startGameBtn.disabled = energy < game.energyCost; // Перепроверяем энергию
                startGameBtn.innerHTML = '<i class="fas fa-play mr-2"></i> Начать игру';
                 if (startGameBtn.disabled) {
                      startGameBtn.innerHTML += ' (Нет энергии)';
                 }
             }, 500);
          }
    }
}


// --- PROFILE PAGE SPECIFIC FUNCTIONS ---
function initProfilePage() {
    // Update profile stats display
    const profileLevelEl = document.getElementById('profile-level');
    const totalCoinsEl = document.getElementById('total-coins');
    const totalGemsEl = document.getElementById('total-gems');
    const totalOreEl = document.getElementById('total-ore');
    const totalTapsEl = document.getElementById('total-taps');

    if (profileLevelEl) profileLevelEl.textContent = playerLevel;
    if (totalCoinsEl) totalCoinsEl.textContent = formatNumber(totalCoins);
    if (totalGemsEl) totalGemsEl.textContent = totalGems;
    if (totalOreEl) totalOreEl.textContent = totalOre;
    if (totalTapsEl) totalTapsEl.textContent = totalTaps;

     // Update achievements list display
     updateAchievementsDisplay();
}

// --- НОВАЯ ВЕРСИЯ ФУНКЦИИ ---
// Update achievements display in the profile list
function updateAchievementsDisplay() {
    // Проверяем, существует ли контейнер достижений (на странице профиля)
    const achievementsContainer = document.getElementById('achievements-container');
    if (!achievementsContainer) {
        // console.log("Контейнер достижений не найден на этой странице.");
        return; // Выходим, если мы не на странице профиля
    }

    // Итерируем по объекту достижений из скрипта
    for (const key in achievements) {
        const achievementData = achievements[key]; // Данные из объекта achievements
        // Находим соответствующий HTML-элемент по ID
        const achievementElement = document.getElementById(`achievement-${key}`);

        if (!achievementData || !achievementElement) {
            console.warn(`Не найдено достижение или его HTML элемент для ключа: ${key}`);
            continue; // Пропускаем, если что-то не так
        }

        const iconElement = achievementElement.querySelector('i');
        const textElement = achievementElement.querySelector('.achievement-text p'); // Находим <p> для описания

        if (!iconElement || !textElement) {
             console.warn(`Не найдены иконка или текстовый элемент для достижения: ${key}`);
             continue;
        }

        // Обновляем классы и иконку в зависимости от статуса unlocked
        if (achievementData.unlocked) {
            achievementElement.classList.remove('locked');
            achievementElement.classList.add('unlocked');
            iconElement.className = 'fas fa-trophy'; // Меняем иконку на трофей
        } else {
            achievementElement.classList.remove('unlocked');
            achievementElement.classList.add('locked');
            iconElement.className = 'fas fa-lock'; // Убеждаемся, что иконка - замок
        }

        // Обновляем текст описания, добавляя прогресс, если он есть и достижение не разблокировано
        let progressText = '';
        if (!achievementData.unlocked && achievementData.progress !== undefined && achievementData.threshold) {
            const currentProgress = achievementData.progress || 0;
            // Используем функцию formatNumber для больших чисел
            progressText = ` (${formatNumber(currentProgress)} / ${formatNumber(achievementData.threshold)})`;
        }
        // Устанавливаем текст для <p>, объединяя оригинальное описание и прогресс
        textElement.textContent = achievementData.description + progressText;
    }
}
// --- КОНЕЦ НОВОЙ ВЕРСИИ ФУНКЦИИ ---


// --- SHOP PAGE SPECIFIC FUNCTIONS ---
// DOM Element variables for shop page
let helpersTabContainer, upgradesTabContainer, skinsTabContainer;

function initShopPage() {
     helpersTabContainer = document.getElementById('helpers-tab');
     upgradesTabContainer = document.getElementById('upgrades-tab');
     skinsTabContainer = document.getElementById('skins-tab');

     // Render shop items using the loaded game state
     renderAllShopItems();
}

// Change shop tab visibility
function changeTab(tabName) {
    // Hide all tabs first
    if (helpersTabContainer) helpersTabContainer.style.display = 'none';
    if (upgradesTabContainer) upgradesTabContainer.style.display = 'none';
    if (skinsTabContainer) skinsTabContainer.style.display = 'none';

    // Deactivate all tab buttons
    document.querySelectorAll('.shop-tab').forEach(tab => tab.classList.remove('active'));

    // Show the selected tab and activate its button
    const selectedTabContainer = document.getElementById(`${tabName}-tab`);
    const selectedTabButton = document.querySelector(`.shop-tab[onclick="changeTab('${tabName}')"]`);
    if (selectedTabContainer) selectedTabContainer.style.display = 'flex'; // Use flex for items
    if (selectedTabButton) selectedTabButton.classList.add('active');
}

 function renderAllShopItems() {
     if (helpersTabContainer) renderShopItems(helpersData, savedHelpers, helpersTabContainer, 'helper');
     if (upgradesTabContainer) renderShopItems(upgradesData, savedUpgrades, upgradesTabContainer, 'upgrade');
     if (skinsTabContainer) renderShopItems(skinsData, savedSkins, skinsTabContainer, 'skin');
 }


// Render items for a specific category
function renderShopItems(itemsData, savedItemsState, container, itemType) {
    if (!container) return;
    container.innerHTML = ''; // Clear current items

    itemsData.forEach(item => {
        // Ensure savedItemsState is an object
        savedItemsState = savedItemsState || {};
        const itemState = savedItemsState[item.id] || { owned: 0 }; // Default state if not saved
        const isOwned = itemType === 'helper' ? false : itemState.owned; // Helpers can be bought multiple times
         const isMaxed = itemType === 'helper' ? false : isOwned; // Only upgrades/skins can be 'maxed' (bought once)

         const itemElement = document.createElement('div');
         itemElement.className = 'shop-item';
         itemElement.id = `shop-item-${item.id}`;

         // Determine cost and currency icon
         let currencyIcon = 'fa-coins'; // Default to coins
         let currencyColorClass = 'coins';
         let cost = item.cost;
         if (item.currency === 'gems') {
             currencyIcon = 'fa-gem';
             currencyColorClass = 'gems';
         } else if (item.currency === 'ore') { // Add ore if needed
             currencyIcon = 'fa-cube'; // Example icon for ore
             currencyColorClass = 'ore';
         }

        // Check affordability
        let canAfford = false;
        if (item.currency === 'coins' && coinCount >= cost) canAfford = true;
        else if (item.currency === 'gems' && gemCount >= cost) canAfford = true;
        else if (item.currency === 'ore' && oreCount >= cost) canAfford = true;


         // Button text and state
         let buttonText = 'Купить';
         let buttonClass = 'shop-item-button';
         let buttonDisabled = !canAfford || isMaxed;

        if (itemType === 'helper') {
            // Calculate next cost if needed, e.g., cost * Math.pow(1.15, itemState.owned)
            // For simplicity, let's keep cost static for now.
            buttonText = `Купить (${itemState.owned})`; // Show current count
            buttonDisabled = !canAfford; // Can always buy more if affordable
         } else if (isOwned) {
             buttonText = 'Куплено';
             buttonClass += ' owned';
             buttonDisabled = true;
         }


         itemElement.innerHTML = `
             <div class="shop-item-icon"><i class="${item.icon}"></i></div>
             <div class="shop-item-info">
                 <div class="shop-item-name">${item.name} ${itemType === 'helper' ? `(Ур. ${itemState.owned})` : ''}</div>
                 <div class="shop-item-desc">${item.description}</div>
             </div>
             <div class="shop-item-price ${currencyColorClass}">
                 <i class="fas ${currencyIcon}"></i> ${formatNumber(cost)}
             </div>
             <button class="${buttonClass}" onclick="buyItem('${item.id}', '${itemType}')" ${buttonDisabled ? 'disabled' : ''}>
                 ${buttonText}
             </button>
         `;
         container.appendChild(itemElement);
    });
}

// Buy item function (Handles all types)
function buyItem(itemId, itemType) {
    let itemData, savedItemState;

    // Find the item data and its saved state
    if (itemType === 'helper') {
        itemData = helpersData.find(i => i.id === itemId);
        savedItemState = savedHelpers;
    } else if (itemType === 'upgrade') {
        itemData = upgradesData.find(i => i.id === itemId);
        savedItemState = savedUpgrades;
    } else if (itemType === 'skin') {
        itemData = skinsData.find(i => i.id === itemId);
        savedItemState = savedSkins;
    }

     if (!itemData) {
         console.error("Item data not found:", itemId, itemType);
         return;
    }

     // Ensure saved state structure exists for the specific item
     if (!savedItemState[itemId]) {
        savedItemState[itemId] = { owned: 0 };
     }

     // Check if already owned (for non-helpers)
    if (itemType !== 'helper' && savedItemState[itemId].owned) {
         console.log("Item already owned:", itemId);
         return; // Already purchased
    }

     // Check currency and affordabiliy
     const cost = itemData.cost; // Base cost. Could be dynamic for helpers.
     let canAfford = false;
     if (itemData.currency === 'coins' && coinCount >= cost) canAfford = true;
     else if (itemData.currency === 'gems' && gemCount >= cost) canAfford = true;
     else if (itemData.currency === 'ore' && oreCount >= cost) canAfford = true;

     if (!canAfford) {
         console.log("Cannot afford item:", itemId);
         // Optionally show a message to the user
         // showNotification('cant-afford-notification'); // Example
         return;
    }

     // Deduct currency
     if (itemData.currency === 'coins') coinCount -= cost;
     else if (itemData.currency === 'gems') gemCount -= cost;
     else if (itemData.currency === 'ore') oreCount -= cost;

     // Update item state in the saved structure
     if (itemType === 'helper') {
        savedItemState[itemId].owned++;
     } else {
         savedItemState[itemId].owned = true;
     }

    console.log(`Bought ${itemType}: ${itemId}`);

     // Recalculate stats based on new item ownership
     recalculateStatsFromItems();

     // Update UI (shop items and common UI)
     renderAllShopItems();
     updateCommonUI();

     // Save game state immediately after purchase
     // *** ИСПРАВЛЕНО: Вызываем правильную функцию сохранения ***
     saveGameToFirebase();
}




// --- INITIALIZATION & GLOBAL LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing...");
    createParticles(); // Создаем частицы сразу

    // Загружаем игру из Firebase, и только после этого инициализируем остальное
    loadGameFromFirebase(() => {
        // Этот код выполнится ПОСЛЕ загрузки данных из Firebase (или инициализации по умолчанию)
        console.log("Game data loaded/initialized. Proceeding with UI setup.");

        // Инициализация специфичная для страницы (теперь после загрузки данных)
        initializeCurrentPage();

        // Обновляем общий UI
        updateCommonUI();

        // Устанавливаем активную кнопку навигации
        setActiveNavButton();

        // Запускаем интервалы (если они зависят от загруженных данных)
        startIntervals(); // Создайте эту функцию, если нужно

        console.log("Initialization complete.");
    });
});

// Вспомогательная функция для инициализации текущей страницы
function initializeCurrentPage() {
     if (document.getElementById('main-container')) {
         console.log("Initializing Main Page...");
         // Add main page specific init logic here if needed
         // initMainPage(); // Если есть отдельная функция
     }
     if (document.getElementById('map-container')) {
         console.log("Initializing Map Page...");
         initMapPage();
     }
     if (document.getElementById('profile-container')) {
         console.log("Initializing Profile Page...");
         initProfilePage(); // Эта функция вызовет updateAchievementsDisplay
     }
     if (document.getElementById('shop-container')) {
         console.log("Initializing Shop Page...");
         initShopPage();
     }
}

// Вспомогательная функция для установки активной кнопки
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
              const targetHref = pageMap[containerId];
              document.querySelector(`.bottom-nav a.nav-button[href="${targetHref}"]`)?.classList.add('active');
              break;
         }
    }
}

// --- TIMED INTERVALS ---
let passiveIncomeInterval = null;
let energyRegenInterval = null;
let autoSaveInterval = null;

function startIntervals() {
    // Очищаем старые интервалы на всякий случай
    if (passiveIncomeInterval) clearInterval(passiveIncomeInterval);
    if (energyRegenInterval) clearInterval(energyRegenInterval);
    if (autoSaveInterval) clearInterval(autoSaveInterval);

    // Пассивный доход
    passiveIncomeInterval = setInterval(() => {
        if (passiveIncome > 0) {
            const incomePerTick = passiveIncome / 2; // Доход каждые 500ms
            coinCount = (coinCount || 0) + incomePerTick; // Убедимся, что coinCount - число
            totalCoins = (totalCoins || 0) + incomePerTick;
            updateCommonUI();
        }
    }, 500);

    // Регенерация энергии
    energyRegenInterval = setInterval(() => {
        if (energy < maxEnergy) {
            energy = Math.min(maxEnergy, (energy || 0) + (energyRegenRate / 2)); // Убедимся, что energy - число
            updateCommonUI();
        }
    }, 500);

    // Автосохранение в Firebase
    autoSaveInterval = setInterval(saveGameToFirebase, 30000); // Сохраняем каждые 30 сек
    console.log("Intervals started.");
}

// Сохранение при выходе (может не всегда срабатывать в веб-приложениях)
window.addEventListener('beforeunload', saveGameToFirebase);
// Дополнительно можно сохранять при скрытии вкладки (актуально для мобильных)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveGameToFirebase();
  }
});