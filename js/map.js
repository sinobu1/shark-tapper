// === map.js (рабочий и чистый финальный вариант) ===
import { eventBus } from './eventBus.js';
import { stateManager } from './stateManager.js';

export const games = {
    main: {
        title: 'Основная игра',
        description: 'Тапайте по акуле, чтобы зарабатывать <img src="https://raw.githubusercontent.com/sinobu1/shark-tapper/main/coin.png" alt="монеты" width="16"/> монеты, <img src="https://raw.githubusercontent.com/sinobu1/shark-tapper/main/dimond.png" alt="гемы" width="16"/> гемы и <img src="https://raw.githubusercontent.com/sinobu1/shark-tapper/main/ruda.png" alt="руда" width="16"/> руду.',
        rewards: [ { type: 'coin', min: 1, max: 10 }, { type: 'gem', min: 0, max: 1 }, { type: 'ore', min: 0, max: 1 } ],
        minLevel: 1,
        energyCost: 1,
        redirect: 'index.html'
    },
    fishing: {
        title: 'Рыбалка',
        description: 'Ловите рыбу и получайте <img src="https://raw.githubusercontent.com/sinobu1/shark-tapper/main/coin.png" width="16"/> монеты и <img src="https://raw.githubusercontent.com/sinobu1/shark-tapper/main/dimond.png" width="16"/> гемы.',
        rewards: [ { type: 'coin', min: 10, max: 100 }, { type: 'gem', min: 1, max: 3 }, { type: 'special', text: 'Редкая рыба' } ],
        minLevel: 5,
        energyCost: 5
    },
    mining: {
        title: 'Добыча руды',
        description: 'Добывайте <img src="https://raw.githubusercontent.com/sinobu1/shark-tapper/main/ruda.png" width="16"/> руду и <img src="https://raw.githubusercontent.com/sinobu1/shark-tapper/main/dimond.png" width="16"/> гемы.',
        rewards: [ { type: 'ore', min: 5, max: 20 }, { type: 'gem', min: 2, max: 5 }, { type: 'special', text: 'Редкие минералы' } ],
        minLevel: 10,
        energyCost: 10
    },
    treasure: {
        title: 'Охота за сокровищами',
        description: 'Ищите сокровища для <img src="https://raw.githubusercontent.com/sinobu1/shark-tapper/main/dimond.png" width="16"/> гемов и <img src="https://raw.githubusercontent.com/sinobu1/shark-tapper/main/coin.png" width="16"/> монет.',
        rewards: [ { type: 'gem', min: 5, max: 15 }, { type: 'coin', min: 50, max: 200 }, { type: 'special', text: 'Легендарные артефакты' } ],
        minLevel: 15,
        energyCost: 15
    },
    racing: {
        title: 'Гонки акул',
        description: 'Участвуйте в гонках за <img src="https://raw.githubusercontent.com/sinobu1/shark-tapper/main/coin.png" width="16"/> монеты, <img src="https://raw.githubusercontent.com/sinobu1/shark-tapper/main/dimond.png" width="16"/> гемы и <img src="https://raw.githubusercontent.com/sinobu1/shark-tapper/main/ruda.png" width="16"/> руду.',
        rewards: [ { type: 'coin', min: 100, max: 500 }, { type: 'gem', min: 10, max: 30 }, { type: 'ore', min: 20, max: 50 }, { type: 'special', text: 'Эксклюзивные награды' } ],
        minLevel: 20,
        energyCost: 20
    }
};

export function startGame(gameType) {
    const game = games[gameType];
    if (!game) return console.warn(`Игра ${gameType} не найдена.`);

    if (game.redirect) {
        window.location.href = game.redirect;
        return;
    }

    const state = stateManager.getState();
    if (!state) return console.error('❌ StateManager недоступен.');

    if (state.player.level < game.minLevel) {
        eventBus.emit('ui:notification_show', { type: 'error', message: `Недостаточный уровень! Требуется: ${game.minLevel}` });
        return;
    }

    if (state.energy.current < game.energyCost) {
        eventBus.emit('ui:notification_show', { type: 'error', message: `Недостаточно энергии! Требуется: ${game.energyCost}` });
        return;
    }

    eventBus.emit('energy:remove', { amount: game.energyCost });

    game.rewards.forEach(reward => {
        if (reward.type === 'special') {
            console.log(`Получен спецприз: ${reward.text}`);
        } else {
            const amount = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;
            eventBus.emit('currency:add', { type: reward.type, amount });
            console.log(`Добавлено ${amount} ${reward.type}`);
        }
    });

    eventBus.emit('ui:notification_show', { type: 'success', message: `${game.title} завершена! Награды начислены.` });
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.game-location').forEach(btn => {
        btn.addEventListener('click', () => {
            const gameType = btn.dataset.type;
            showGameInfo(gameType);
        });
    });
});

export function showGameInfo(gameType) {
    const game = games[gameType];
    if (!game) return;

    const gameTitleElement = document.getElementById('game-title');
    const gameDescriptionElement = document.getElementById('game-description');
    const gameRequirementsElement = document.getElementById('game-requirements');
    const gameRewardsElement = document.getElementById('game-rewards');
    const gameInfoCard = document.getElementById('game-info');
    const startGameBtn = document.getElementById('start-game-btn');

    if (!gameTitleElement) return console.error('❌ Не найдены элементы интерфейса карты.');

    gameTitleElement.textContent = game.title;
    gameDescriptionElement.innerHTML = game.description;
    gameRequirementsElement.textContent = `Требуется ${game.minLevel} уровень | Энергия: ${game.energyCost}`;
    gameRewardsElement.innerHTML = '';

    game.rewards.forEach(reward => {
        const rewardItem = document.createElement('div');
        rewardItem.className = 'reward-item';
        if (reward.type === 'special') {
            rewardItem.innerHTML = `<i class="fas fa-star"></i> ${reward.text}`;
        } else {
            const icon = reward.type === 'coin' ? '💰' : reward.type === 'gem' ? '💎' : reward.type === 'ore' ? '⛏️' : '🎁';
            rewardItem.innerHTML = `${icon} ${reward.min}-${reward.max} ${reward.type}`;
        }
        gameRewardsElement.appendChild(rewardItem);
    });

    startGameBtn.innerHTML = '<i class="fas fa-play mr-2"></i> Начать игру';
    startGameBtn.onclick = () => {
        startGame(gameType);
        gameInfoCard.classList.remove('show');
    };

    gameInfoCard.classList.add('show');
}

if (typeof window !== 'undefined') {
    window.showGameInfo = showGameInfo;
}
