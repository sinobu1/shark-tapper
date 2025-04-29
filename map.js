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