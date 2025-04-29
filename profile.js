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