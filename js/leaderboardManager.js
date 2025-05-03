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

// УДАЛИТЕ старую строку экспорта экземпляра:
// export const leaderboardManager = new LeaderboardManager();
