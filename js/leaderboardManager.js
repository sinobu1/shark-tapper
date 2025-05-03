// js/leaderboardManager.js

// Экспортируем сам класс
export class LeaderboardManager {
  // Конструктор теперь принимает saveManager
  constructor(saveManager) {
    this.database = window.firebase?.database();
    if (!this.database) {
      console.warn("Firebase database not available, leaderboard disabled.");
      // Можно оставить так или добавить обработку, если Firebase критичен
    }

    // Проверяем, передан ли валидный saveManager с userId
    if (!saveManager || typeof saveManager.userId === "undefined") {
      console.error(
        "LeaderboardManager: Требуется валидный экземпляр saveManager с userId."
      );
      // Устанавливаем состояние, что менеджер не может работать
      this.userId = null;
      // Если userId нет, то и с базой работать не получится
      this.database = null;
      return; // Прекращаем инициализацию
    }

    // Используем userId из переданного saveManager
    this.userId = saveManager.userId;

    // Добавим проверку, что userId не null/undefined, если это важно для Firebase
    if (!this.userId) {
      console.error(
        "LeaderboardManager: userId не найден в saveManager, работа с базой невозможна."
      );
      this.database = null; // Отключаем базу, если нет ID
    }
  }

  async submitScore(state) {
    // Добавим проверку, инициализирован ли менеджер корректно
    if (!this.database || !this.userId) {
      // console.log("LeaderboardManager не инициализирован или userId отсутствует, отправка очков отменена.");
      return;
    }
    const playerData = {
      name: state.player.name || "Игрок",
      level: state.player.level,
      coins: state.totals.coins,
      gems: state.totals.gems,
      taps: state.totals.taps,
      timestamp: Date.now(),
    };
    try {
      await this.database.ref("leaderboard/" + this.userId).set(playerData);
      console.log("Leaderboard score submitted.");
    } catch (error) {
      console.error("Error submitting leaderboard score:", error);
    }
  }

  async fetchTopPlayers(limit = 10) {
    // Добавим проверку
    if (!this.database || !this.userId) {
      // console.log("LeaderboardManager не инициализирован или userId отсутствует, загрузка лидерборда отменена.");
      return [];
    }
    try {
      const snapshot = await this.database
        .ref("leaderboard")
        .orderByChild("coins")
        .limitToLast(limit)
        .once("value");
      const players = [];
      snapshot.forEach((child) => {
        players.push({ id: child.key, ...child.val() });
      });
      players.sort((a, b) => b.coins - a.coins);
      return players;
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  }
}

// --- Переопределение или импорт formatNumber ---
// Вариант A: Переопределить локально (проще, если utils.js сложно импортировать здесь)
function formatNumber(num) {
  if (num === undefined || num === null) return "0";
  if (num < 10000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (num < 1000000000)
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}m`;
  return `${(num / 1000000000).toFixed(1).replace(/\.0$/, "")}b`;
}
// Вариант Б: Если utils.js доступен как модуль:
// import { formatNumber } from './utils.js'; // При необходимости исправьте путь

// --- Ожидание DOM и, возможно, leaderboardManager ---
document.addEventListener("DOMContentLoaded", () => {
  const leaderboardList = document.getElementById("leaderboard-list");
  const refreshButton = document.getElementById("refresh-leaderboard");

  // Проверяем готовность менеджера сразу
  if (!window.leaderboardManager) {
    console.warn("LeaderboardManager недоступен сразу. Повторная попытка...");
    // Опционально отключаем кнопку обновления до готовности менеджера
    if (refreshButton) refreshButton.disabled = true;
  }

  async function updateLeaderboard() {
    // Явно проверяем менеджер *перед* запросом данных
    if (!window.leaderboardManager) {
      leaderboardList.innerHTML =
        "<li>Менеджер лидерборда не готов. Попробуйте обновить позже.</li>";
      console.warn(
        "Попытка обновить лидерборд, но window.leaderboardManager все еще не готов."
      );
      // Убедимся, что кнопка останется отключенной, если менеджер не загрузится
      if (refreshButton) refreshButton.disabled = true;
      return;
    }

    // Снова включаем кнопку, если менеджер теперь готов
    if (refreshButton) refreshButton.disabled = false;

    leaderboardList.innerHTML =
      "<li><i class='fas fa-spinner fa-spin'></i> Загрузка...</li>"; // Индикатор загрузки

    try {
      // Запрашиваем топ игроков (manager сортирует по 'coins' по умолчанию)
      const topPlayers = await window.leaderboardManager.fetchTopPlayers(15); // Загружаем топ 15
      leaderboardList.innerHTML = ""; // Очищаем сообщение о загрузке

      if (!Array.isArray(topPlayers) || topPlayers.length === 0) {
        leaderboardList.innerHTML = "<li>Пока нет данных для отображения.</li>";
        return;
      }

      topPlayers.forEach((player, index) => {
        const li = document.createElement("li");
        // Безопасно получаем userId из экземпляра менеджера
        const isYou =
          window.leaderboardManager.userId &&
          player.id === window.leaderboardManager.userId;
        li.className = isYou ? "you" : ""; // Подсвечиваем текущего игрока

        // --- НАЧАЛО ИЗМЕНЕНИЙ ---
        const defaultAvatar =
          "https://img.icons8.com/fluency-systems-filled/48/ffffff/user.png"; // Запасной аватар

        li.innerHTML = `
        <span class="rank">#${index + 1}</span>
        <div class="player-details" class="leaderboard-list li .name">
            <img src="${
              player.avatarUrl || defaultAvatar
            }" alt="Avatar" class="leaderboard-avatar">
            <span class="name">${player.name || "Игрок"}</span>
        </div>
        <span class="score">
            ${formatNumber(player.coins)}
            <i class="fas fa-coins coin-icon"></i>
        </span>
        ${isYou ? '<span class="you-indicator">(Вы)</span>' : ""}
    `;
        // --- КОНЕЦ ИЗМЕНЕНИЙ ---
        leaderboardList.appendChild(li);
      });
    } catch (error) {
      leaderboardList.innerHTML =
        "<li><i class='fas fa-exclamation-triangle'></i> Ошибка загрузки данных.</li>";
      console.error("Ошибка при загрузке лидерборда:", error);
    }
  }

  // Пытаемся загрузить с небольшой задержкой, чтобы дать main.js время
  // Более надежное решение - использовать событие от main.js о готовности
  const initialLoadTimeout = setTimeout(() => {
    if (window.leaderboardManager) {
      updateLeaderboard();
    } else {
      // Если все еще не готов после задержки - сообщаем пользователю
      leaderboardList.innerHTML = "<li>Менеджер лидерборда не загрузился.</li>";
      console.warn("LeaderboardManager все еще не найден после задержки.");
      if (refreshButton) refreshButton.disabled = true;
    }
  }, 750); // Немного увеличили задержку

  // Функциональность кнопки обновления
  if (refreshButton) {
    refreshButton.addEventListener("click", () => {
      // Очищаем таймер начальной загрузки, если нажали кнопку
      clearTimeout(initialLoadTimeout);
      updateLeaderboard();
    });
  } else {
    console.warn("Кнопка обновления лидерборда не найдена.");
  }
});
// УДАЛИТЕ старую строку экспорта экземпляра:
// export const leaderboardManager = new LeaderboardManager();
