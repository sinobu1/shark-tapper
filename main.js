
const skinsData = {
    ww: { name: "Обычная акула", image: "ww.png" },
    ww2: { name: "Золотая акула", image: "ww2.png" },
    ww3: { name: "Леопардовая акула", image: "ww3.png" }
};



function triggerVibration() {
    if ("vibrate" in navigator) {
        navigator.vibrate(50);
    }
}


function feedback() {
            // 1. Вибрация (если поддерживается)
            if ('vibrate' in navigator) {
                navigator.vibrate([30]);
            }

            // 2. Звук тапа
            try {
                const tapSound = new Audio("https://assets.mixkit.co/sfx/preview/mixkit-arcade-game-jump-coin-216.wav");
                tapSound.volume = 0.2;
                tapSound.play().catch(() => {}); // Без ошибки на авто-play
            } catch (e) {
                console.log("Не удалось воспроизвести звук:", e);
            }

            // 3. Быстрая анимация "scale"
            const shark = document.getElementById("tapImage");
            if (shark) {
                shark.style.transform = "scale(0.9)";
                setTimeout(() => {
                    shark.style.transform = "scale(1)";
                }, 100);
            }
        }

        document.addEventListener("DOMContentLoaded", function() {
            // --- Константы ---
            const DB_URL = "https://tralalero-fec07-default-rtdb.firebaseio.com";
            const DEFAULT_AVATAR_URL = "https://placehold.co/64x64";
            const COIN_ICON_URL = "https://sinobu1.github.io/shark-tapper/coin_icon_small.png";
            const SHARK_DEFAULT_SKIN_URL = "ww.png";
            const SHARK_SKIN2_URL = "https://sinobu1.github.io/shark-tapper/ww3.png";
            const SHARK_SKIN3_URL = "https://sinobu1.github.io/shark-tapper/ww2.png";
            const LOCAL_STORAGE_KEY = 'sharkTapperData';
            const SAVE_INTERVAL = 5000;
            const TAP_VIBRATION_DURATION = 50; // Увеличим длительность вибрации
            const TAP_ANIMATION_DURATION = 100;
            const TAP_EFFECT_DURATION = 600;
            const COIN_POPUP_DURATION = 1000;
            const LEADERBOARD_SIZE = 10;
            const AUTO_SAVE_INTERVAL = 30000;
            const XP_LEVEL_LIMITS = [
                0, 100, 500, 1000, 2500, 5000, 10000, 50000, 100000, 250000, 500000, 1000000, 2000000, 4000000, 8000000, 16000000, 32000000, 64000000, 100000000
            ];

            let userId = null;
            let userData = {
                username: "Player",
                avatar: DEFAULT_AVATAR_URL,
                tokens: 0,
                skin: 'default',
                level: 0,
                helpers: {} // Объект для хранения количества купленных помощников
            };
            const profileAvatar = document.getElementById('profileAvatar');
            let lastSave = 0;
            let canVibrate = 'vibrate' in navigator;
            let tapMultiplier = 1;
            let tapUpgradeCost = 50;
            const passiveIncomeInterval = 1000; // Интервал для начисления пассивного дохода (1 секунда)
            let lastPassiveIncomeTime = Date.now();

            const helpersData = {
                'tinyFish': { name: '🐟 Маленькая рыбка', description: 'Привлекает мелкие блестящие монетки.', cost: 1000, income: 1, upgradeMultiplier: 1.2 },
                'seaAnemone': { name: '🌸 Морской анемон', description: 'Фильтрует воду, находя редкие монеты.', cost: 5000, income: 5, upgradeMultiplier: 1.3 },
                'hermitCrab': { name: '🦀 Краб-отшельник', description: 'Собирает монеты, оставленные на дне.', cost: 15000, income: 15, upgradeMultiplier: 1.4 },
                'starfish': { name: '⭐ Морская звезда', description: 'Ее свет манит любопытные монетки.', cost: 50000, income: 50, upgradeMultiplier: 1.5 },
                'jellyfish': { name: '💧 Медуза', description: 'Плавно парит, собирая затерянные сокровища.', cost: 150000, income: 150, upgradeMultiplier: 1.6 },
                'babyTurtle': { name: '🐢 Черепашонок', description: 'Не спеша приносит спрятанные богатства.', cost: 500000, income: 500, upgradeMultiplier: 1.7 },
                'dolphinPup': { name: '🐬 Дельфиненок', description: 'Ловко собирает разбросанные монеты.', cost: 1500000, income: 1500, upgradeMultiplier: 1.8 },
                'smallOctopus': { name: '🐙 Маленький осьминог', description: 'Использует щупальца, чтобы найти монеты.', cost: 5000000, income: 5000, upgradeMultiplier: 1.9 },
                'friendlySeal': { name: '🦭 Дружелюбный тюлень', description: 'С радостью приносит найденные монетки.', cost: 15000000, income: 15000, upgradeMultiplier: 2.0 }
            };

            // --- Вспомогательные функции ---

            function calculateLevel(tokens) {
                for (let i = XP_LEVEL_LIMITS.length - 1; i >= 0; i--) {
                    if (tokens >= XP_LEVEL_LIMITS[i]) {
                        return i;
                    }
                }
                return 0;
            }

            function calculateTapMultiplier(tokens) {
                const max = XP_LEVEL_LIMITS.find(l => tokens < l) || 100000000;
                const level = XP_LEVEL_LIMITS.indexOf(max);
                return 1 + Math.floor(level / 5);
            }

            function updateAvatarFrameStyle(level) {
                profileAvatar.style.border = '';
                profileAvatar.style.backgroundImage = '';
                profileAvatar.style.boxShadow = '';
                profileAvatar.className = 'profile-avatar-frame';

                if (level === 0) {
                    profileAvatar.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
                } else if (level === 1) {
                    profileAvatar.style.borderColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
                } else if (level >= 2) {
                    profileAvatar.classList.add('level-animated-gradient-frame');
                }
            }

            function getPassiveIncome() {
                let totalIncome = 0;
                for (const helperId in userData.helpers) {
                    if (userData.helpers.hasOwnProperty(helperId) && helpersData.hasOwnProperty(helperId)) {
                        totalIncome += userData.helpers[helperId] * helpersData[helperId].income;
                    }
                }
                return totalIncome;
            }

            function displayHelpers() {
                const helpersListUI = document.getElementById('helpersListUI');
                if (!helpersListUI) return;
                helpersListUI.innerHTML = '';

                for (const helperId in helpersData) {
                    if (helpersData.hasOwnProperty(helperId)) {
                        const helper = helpersData[helperId];
                        const owned = userData.helpers[helperId] || 0;
                        const listItem = document.createElement('li');
                        listItem.className = 'helper-item';
                        listItem.innerHTML = `
                            <div class="helper-top-info">
                                <div class="helper-emoji-frame">
                                    <span>${getHelperEmoji(helperId)}</span>
                                </div>
                                <div class="helper-name-description">
                                    <div class="helper-name">${helper.name}</div>
                                    <div class="helper-description">${helper.description}</div>
                                </div>
                            </div>
                            <div class="helper-bottom-actions">
                                <button class="buy-button ${userData.tokens < helper.cost ? 'disabled' : ''}" data-helper-id="${helperId}">
                                    Купить (${helper.cost} <img src="${COIN_ICON_URL}" alt="Coin" style="height: 12px; vertical-align: middle;">)
                                </button>
                                <div class="helper-income">
                                    <div class="income-text">
                                        <span>${helper.income} <img src="${COIN_ICON_URL}" alt="Coin" style="height: 9px; vertical-align: middle; margin-right: 0.1rem;"></span>
                                        <span style="font-size: 0.7rem;">в сек.</span>
                                    </div>
                                    <div class="owned-text">Куплено: ${owned}</div>
                                </div>
                            </div>
                        `;
                        helpersListUI.appendChild(listItem);
                    }
                }

                // Добавляем обработчики событий для кнопок "Купить"
                document.querySelectorAll('.buy-button').forEach(button => {
                    button.addEventListener('click', function() {
                        const helperId = this.dataset.helperId;
                        buyHelper(helperId);
                    });
                });
            }

            function getHelperEmoji(helperId) {
                switch (helperId) {
                    case 'tinyFish': return '🐟';
                    case 'seaAnemone': return '🌸';
                    case 'hermitCrab': return '🦀';
                    case 'starfish': return '⭐';
                    case 'jellyfish': return '💧';
                    case 'babyTurtle': return '🐢';
                    case 'dolphinPup': return '🐬';
                    case 'smallOctopus': return '🐙';
                    case 'friendlySeal': return '🦭';
                    default: return '';
                }
            }

            function buyHelper(helperId) {
                if (!helpersData.hasOwnProperty(helperId)) return;
                const helper = helpersData[helperId];
                if (userData.tokens >= helper.cost) {
                    userData.tokens -= helper.cost;
                    userData.helpers[helperId] = (userData.helpers[helperId] || 0) + 1;
                    updateDisplay();
    highlightSelectedSkin();
                    displayHelpers(); // Обновляем отображение помощников после покупки
                    saveProgress();
                } else {
                    console.log("Недостаточно монет для покупки " + helper.name);
                }
            }

            // --- Инициализация ---

            
function highlightSelectedSkin() {
    document.querySelectorAll('.skin-option').forEach(el => el.classList.remove('selected'));
    const selected = document.querySelector(`.skin-option[data-skin="${userData.skin}"]`);
    if (selected) {
        selected.classList.add('selected');
        if (!selected.querySelector('.skin-selected-label')) {
            const label = document.createElement('span');
            label.className = 'skin-selected-label';
            label.textContent = 'Выбран';
            selected.appendChild(label);
        }
    }
}


function init() {
                setupEventListeners();
                loadTelegram();
                initLocalStorage();
                updateDisplay();
    highlightSelectedSkin();
                showTab('home');
                displayHelpers(); // Отображаем список помощников при инициализации
                setInterval(addPassiveIncome, passiveIncomeInterval); // Запускаем интервал для пассивного дохода
            }

            function setupEventListeners() {
                const tapImage = document.getElementById('tapImage');
                tapImage.addEventListener('click', handleTap);

                const buyTapUpgradeButton = document.getElementById('buyTapUpgradeNav');
                buyTapUpgradeButton.addEventListener('click', buyTapUpgrade);

                const openHelpersModalButton = document.getElementById('openHelpersModal');
                const closeHelpersModalButton = document.getElementById('closeHelpersModal');
                const helpersModal = document.getElementById('helpersModal');

                const openSkinsModalButton = document.getElementById('openSkinsModal');
                const closeSkinsModalButton = document.getElementById('closeSkinsModal');
                const skinsModal = document.getElementById('skinsModal');

                if (openHelpersModalButton) {
                    openHelpersModalButton.addEventListener('click', () => {
                        helpersModal.style.display = "block";
                        displayHelpers(); // Загружаем список помощников при открытии модального окна
                    });
                }

                if (closeHelpersModalButton) {
                    closeHelpersModalButton.addEventListener('click', () => {
                        helpersModal.style.display = "none";
                    });
                }

                if (openSkinsModalButton) {
                    openSkinsModalButton.addEventListener('click', () => {
                        skinsModal.style.display = "block";
                    });
                }

                if (closeSkinsModalButton) {
                    closeSkinsModalButton.addEventListener('click', () => {
                        skinsModal.style.display = "none";
                    });
                }

                // Закрытие модального окна при клике вне его
                window.addEventListener('click', (event) => {
                    if (event.target === helpersModal) {
                        helpersModal.style.display = "none";
                    }
                    if (event.target === skinsModal) {
                        skinsModal.style.display = "none";
                    }
                });

                // Обработчики для скинов теперь будут и для главной страницы и для модального окна
                const skinsGallery = document.querySelectorAll('#home .shark-gallery img, #skinsModal .shark-gallery img');
                skinsGallery.forEach(img => {
                    img.addEventListener('click', function() {
                        const selectedSkin = this.dataset.skin;
                        setSkin(selectedSkin);
                        if (this.closest('#skinsModal')) {
                            skinsModal.style.display = "none"; // Закрываем модальное окно после выбора скина, если клик был в нем
                        }
                        // Обновление подсветки галереи на главной странице происходит в setSkin
                        console.log(`Скин ${selectedSkin} выбран`); // Проверка клика
                    });
                });

                const inviteFriendQuestButton = document.getElementById('inviteFriendQuest');
                const referralLinkContainer = document.getElementById('referralLinkContainer');

                if (inviteFriendQuestButton) {
                    inviteFriendQuestButton.addEventListener('click', () => {
                        if (Telegram && Telegram.WebApp) {
                            const initData = Telegram.WebApp.initDataUnsafe;
                            const userId = initData?.user?.id;
                            if (userId) {
                                const referralLink = `https://t.me/ваше_бот_имя?start=${userId}`; // Замените "ваше_бот_имя" на имя вашего Telegram-бота!
                                referralLinkContainer.innerHTML = `<p style="color: var(--primary);">Поделись этой ссылкой:</p><p><a href="${referralLink}" target="_blank">${referralLink}</a></p>`;
                                // В реальной системе вам нужно будет отслеживать переходы по этой ссылке и начисление монет.
                                // Для примера, можно просто начислить монеты сразу после нажатия кнопки (без реальной проверки).
                                userData.tokens += 100;
                                updateDisplay();
    highlightSelectedSkin();
                                saveProgress();
                            } else {
                                referralLinkContainer.innerHTML = '<p style="color: var(--subtext);">Не удалось получить ID пользователя.</p>';
                            }
                        } else {
                            referralLinkContainer.innerHTML = '<p style="color: var(--subtext);">Telegram Web Apps недоступны.</p>';
                        }
                    });
                }

                document.querySelectorAll('nav button').forEach(btn => {
                    btn.addEventListener('click', function() {
                        showTab(this.dataset.tab);
                    });
                });
            }

            // --- Обработчики событий ---

            function handleTap(event) {
    triggerVibration();
                feedback(); // 👈 вот она
                createTapEffect(event);
                createCoinPopup(event, tapMultiplier);
                userData.tokens += tapMultiplier;
                updateDisplay();
    highlightSelectedSkin();
                const now = Date.now();
                if (now - lastSave > SAVE_INTERVAL) {
                    saveProgress();
                    lastSave = now;
                } else {
                    saveToLocalStorage();
                }
            }

            function createTapEffect(event) {
                const effect = document.createElement('div');
                effect.className = 'tap-effect';
                effect.style.left = `${event.clientX}px`;
                effect.style.top = `${event.clientY}px`;
                document.body.appendChild(effect);

                setTimeout(() => {
                    effect.remove();
                }, TAP_EFFECT_DURATION);
            }

            function createCoinPopup(event, amount) {
                const popup = document.createElement('div');
                popup.className = 'coin-popup';
                popup.innerHTML = `<img src="${COIN_ICON_URL}" alt="Coin"> +${amount}`;
                popup.style.left = `${event.clientX}px`;
                popup.style.top = `${event.clientY - 20}px`;
                document.body.appendChild(popup);

                setTimeout(() => {
                    popup.remove();
                }, COIN_POPUP_DURATION);
            }

            // --- Обновление интерфейса ---

            function updateDisplay() {
                const counter = document.getElementById("profileTokens");
                if (counter) counter.textContent = Math.floor(userData.tokens);

                const previousLevel = userData.level;
                const currentLevel = calculateLevel(userData.tokens);
                if (currentLevel > previousLevel) {
                    userData.level = currentLevel;
                    console.log(`Уровень повышен! Новый уровень: ${userData.level}`);

                // Показываем popup "Level Up!"
                const popup = document.createElement('div');
                popup.textContent = `LEVEL ${userData.level} UP! 🎉`;
                popup.style.position = 'fixed';
                popup.style.top = '50%';
                popup.style.left = '50%';
                popup.style.transform = 'translate(-50%, -50%)';
                popup.style.padding = '1rem 2rem';
                popup.style.background = 'linear-gradient(45deg, var(--primary), var(--accent))';
                popup.style.color = '#fff';
                popup.style.fontFamily = 'Rubik', sans-serif;
                popup.style.fontSize = '1.3rem';
                popup.style.borderRadius = '16px';
                popup.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
                popup.style.zIndex = 9999;
                popup.style.animation = 'fadeOut 2s ease-out forwards';
                document.body.appendChild(popup);
                setTimeout(() => popup.remove(), 2000);

                    updateAvatarFrameStyle(userData.level);
                    // Здесь можно добавить логику для отображения уведомления о повышении уровня
                }

                const levelEl = document.getElementById("profileLevel");
                if (levelEl) levelEl.textContent = `Level: ${userData.level} | Coins: ${Math.floor(userData.tokens)}`;

                const bar = document.getElementById("xpBar");
                if (bar) {
                    const max = XP_LEVEL_LIMITS.find(l => userData.tokens < l) || 100000000;
                    const min = XP_LEVEL_LIMITS[XP_LEVEL_LIMITS.indexOf(max) - 1] || 0;
                    const percent = ((userData.tokens - min) / (max - min)) * 100;
                    bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
                }

                const tapMultiplierDisplay = document.getElementById('tapMultiplierDisplay');
                if (tapMultiplierDisplay) tapMultiplierDisplay.textContent = tapMultiplier;

                const buyTapUpgradeButtonNav = document.getElementById('buyTapUpgradeNav');
                if (buyTapUpgradeButtonNav) {
                    if (userData.tokens < tapUpgradeCost) {
                        buyTapUpgradeButtonNav.classList.add('disabled');
                    } else {
                        buyTapUpgradeButtonNav.classList.remove('disabled');
                    }
                }

                // Обновляем состояние кнопок покупки помощников
                const helpersListUI = document.getElementById('helpersListUI');
                if (helpersListUI) {
                    helpersListUI.querySelectorAll('.buy-button').forEach(button => {
                        const helperId = button.dataset.helperId;
                        if (userData.tokens < helpersData[helperId].cost) {
                            button.classList.add('disabled');
                        } else {
                            button.classList.remove('disabled');
                        }
                    });
                }
            }

            function showTab(tabId) {
                document.querySelectorAll('nav button').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.tab === tabId);
                });

                document.querySelectorAll('.tab-page').forEach(page => {
                    page.classList.toggle('active', page.id === tabId);
                });

                if (tabId === 'leaderboard') {
                    loadLeaderboard();
                }
            }

            // --- Пассивный доход ---
            function addPassiveIncome() {
                const now = Date.now();
                if (now - lastPassiveIncomeTime >= passiveIncomeInterval) {
                    const income = getPassiveIncome();
                    userData.tokens += income;
                    updateDisplay();
    highlightSelectedSkin();
                    lastPassiveIncomeTime = now;
                    saveToLocalStorage(); // Сохраняем прогресс после получения пассивного дохода
                }
            }

            // --- Сохранение и загрузка данных ---

            function saveProgress() {
                if (!userId) {
                    saveToLocalStorage();
                    return;
                }

                fetch(`${DB_URL}/users/${userId}.json`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        balance: userData.tokens,
                        first_name: userData.username,
                        photo_url: userData.avatar,
                        skin: userData.skin,
                        last_update: Date.now(),
                        tapMultiplier: tapMultiplier,
                        tapUpgradeCost: tapUpgradeCost,
                        level: userData.level,
                        helpers: userData.helpers
                    })
                })
                .then(() => saveToLocalStorage())
                .catch(err => {
                    console.error('Ошибка сохранения:', err);
                    saveToLocalStorage();
                });
            }

            function initLocalStorage() {
                const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (savedData) {
                    try {
                        const parsed = JSON.parse(savedData);
                        userData.tokens = parsed.tokens || 0;
                        userData.skin = parsed.skin || 'default';
                        tapMultiplier = parsed.tapMultiplier || 1;
                        tapUpgradeCost = parsed.tapUpgradeCost || 50;
                        userData.level = parsed.level || 0;
                        userData.helpers = parsed.helpers || {};
                        updateDisplay();
    highlightSelectedSkin();
                        setSkin(userData.skin, true); // Обновляем подсветку галереи
                        updateUpgradeUI();
                        updateAvatarFrameStyle(userData.level);
                        displayHelpers();
                    } catch (e) {
                        console.error('Ошибка при парсинге сохраненных данных', e);
                        userData.level = calculateLevel(userData.tokens);
                        updateDisplay();
    highlightSelectedSkin();
                        updateAvatarFrameStyle(userData.level);
                        displayHelpers();
                    }
                } else {
                    userData.level = calculateLevel(userData.tokens);
                    updateDisplay();
    highlightSelectedSkin();
                    updateUpgradeUI();
                    updateAvatarFrameStyle(userData.level);
                    displayHelpers();
                }
            }

            function saveToLocalStorage() {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
                    tokens: userData.tokens,
                    skin: userData.skin,
                    tapMultiplier: tapMultiplier,
                    tapUpgradeCost: tapUpgradeCost,
                    level: userData.level,
                    helpers: userData.helpers
                }));
            }

            function loadProgress() {
                if (!userId) return;

                fetch(`${DB_URL}/users/${userId}.json`)
                    .then(res => {
                        if (!res.ok) throw new Error('Network response was not ok');
                        return res.json();
                    })
                    .then(data => {
                        if (data) {
                            const serverTokens = data.balance || 0;
                            userData.tokens = Math.max(serverTokens, userData.tokens);
                            userData.username = data.first_name || "Player";
                            userData.avatar = data.photo_url || DEFAULT_AVATAR_URL;
                            userData.skin = data.skin || 'default';
                            tapMultiplier = data.tapMultiplier || 1;
                            tapUpgradeCost = data.tapUpgradeCost || 50;
                            userData.level = data.level || calculateLevel(userData.tokens);
                            userData.helpers = data.helpers || {};
                            updateUpgradeUI();
                            updateDisplay();
    highlightSelectedSkin();
                            document.getElementById("profileName").textContent = userData.username;
                            document.getElementById("profileAvatar").src = userData.avatar;
                            setSkin(userData.skin, true); // Обновляем подсветку галереи
                            saveToLocalStorage();
                            updateAvatarFrameStyle(userData.level);
                            displayHelpers();
                        } else {
                            userData.level = calculateLevel(userData.tokens);
                            updateUpgradeUI();
                            updateDisplay();
    highlightSelectedSkin();
                            updateAvatarFrameStyle(userData.level);
                            displayHelpers();
                        }
                    })
                    .catch(err => {
                        console.error('Ошибка загрузки:', err);
                        userData.level = calculateLevel(userData.tokens);
                        updateUpgradeUI();
                        updateDisplay();
    highlightSelectedSkin();
                        updateAvatarFrameStyle(userData.level);
                        displayHelpers();
                    });
            }

            // --- Таблица лидеров ---

            function loadLeaderboard() {
                fetch(`${DB_URL}/users.json`)
                    .then(res => {
                        if (!res.ok) throw new Error('Network response was not ok');
                        return res.json();
                    })
                    .then(data => {
                        const list = document.getElementById("leaderboardList");
                        if (!data || Object.keys(data).length === 0) {
                            return list.innerHTML = '<li style="text-align:center; color: var(--subtext);">Пока нет игроков</li>';
                        }

                        const sorted = Object.entries(data)
                            .sort((a, b) => (b[1].balance || 0) - (a[1].balance || 0))
                            .slice(0, LEADERBOARD_SIZE);

                        renderLeaderboard(sorted);
                    })
                    .catch(err => {
                        console.error('Ошибка загрузки таблицы лидеров:', err);
                        const list = document.getElementById("leaderboardList");
                        list.innerHTML = '<li style="text-align:center; color: var(--subtext);">Ошибка загрузки</li>';
                    });
            }

            function renderLeaderboard(data) {
                const list = document.getElementById("leaderboardList");
                list.innerHTML = data.map(([id, user], i) => {
                    const isCurrentUser = id === userId?.toString();
                    return `
                                <li class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                                    <span style="font-weight: bold; color: var(--primary); width: 24px; text-align: center;">#${i + 1}</span>
                                    <img src="${user.photo_url || DEFAULT_AVATAR_URL}"
                                         style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--accent); object-fit: cover;">
                                    <span style="flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ${user.first_name || 'Player'}
                                    </span>
                                    <span style="color: var(--subtext); font-family: 'Press Start 2P', cursive; font-size: 0.7rem;">
                                        ${user.balance || 0} 💰
                                    </span>
                                </li>`;
                }).join("");
            }

            // --- Скины ---

            function setSkin(skin, silent = false) {
                const skins = {
                    'default': SHARK_DEFAULT_SKIN_URL,
                    'skin2': SHARK_SKIN2_URL,
                    'skin3': SHARK_SKIN3_URL
                };

                if (skins[skin]) {
                    userData.skin = skin;
                    document.getElementById('tapImage').src = skins[skin];
                    if (!silent) saveProgress();

                    // Обновляем подсветку в галерее скинов на главной странице
                    const galleryImages = document.querySelectorAll('#home .shark-gallery img');
                    galleryImages.forEach(img => {
                        if (img.dataset.skin === skin) {
                            img.style.border = '2px solid var(--accent)'; // Или другой стиль подсветки
                        } else {
                            img.style.border = '2px solid var(--primary)'; // Возвращаем стандартный стиль
                        }
                    });
                }
            }

            // --- Интеграция с Telegram Web Apps ---

            function loadTelegram() {
                try {
                    const tgUser = Telegram?.WebApp?.initDataUnsafe?.user;
                    if (tgUser) {
                        userId = tgUser.id?.toString();
                        userData.username = tgUser.first_name || "Player";
                        userData.avatar = tgUser.photo_url || DEFAULT_AVATAR_URL;
                        document.getElementById("profileName").textContent = userData.username;
                        document.getElementById("profileAvatar").src = userData.avatar;
                        loadProgress();
                    } else {
                        console.warn('Telegram user not available, using local mode');
                        initLocalStorage();
                        updateDisplay();
                        highlightSelectedSkin();
                        updateAvatarFrameStyle(userData.level);
                        displayHelpers();
                    }
                } catch (e) {
                    console.error('Telegram WebApp error:', e);
                    initLocalStorage();
                    updateDisplay();
                    highlightSelectedSkin();
                    updateAvatarFrameStyle(userData.level);
                    displayHelpers();
                }
            }

            // --- Автоматическое сохранение ---

            setInterval(() => {
                if (userData.tokens > 0) {
                    saveProgress();
                }
            }, AUTO_SAVE_INTERVAL);

            // --- Функция покупки улучшения тапа ---
            function buyTapUpgrade() {
                if (userData.tokens >= tapUpgradeCost) {
                    userData.tokens -= tapUpgradeCost;
                    tapMultiplier++;
                    tapUpgradeCost = Math.round(tapUpgradeCost * 1.5);
                    updateDisplay();
    highlightSelectedSkin();
                    updateUpgradeUI();
                } else {
                    console.log("Недостаточно монет!");
                }
            }

            // --- Функция обновления UI улучшения ---
            function updateUpgradeUI() {
                const tapUpgradeCostElementNav = document.getElementById('tapUpgradeCostNav');
                if (tapUpgradeCostElementNav) tapUpgradeCostElementNav.textContent = tapUpgradeCost;
            }

            // --- Запуск приложения ---
            init();
        });