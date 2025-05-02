// js/achievementManager.js
import { eventBus } from "./eventBus.js";
import { config } from "./config.js";

class AchievementManager {
  constructor() {
    this.setupEventListeners();
  }

  checkAchievements(currentState) {
    const achievementsState = currentState.achievements;
    let achievementUnlocked = false;
    for (const id in config.achievements) {
      const achievementConfig = config.achievements[id];
      const achievementState = achievementsState[id];
      if (!achievementState.unlocked) {
        const currentProgress = achievementConfig.check(currentState);
        if (currentProgress >= achievementConfig.threshold) {
          achievementsState[id].unlocked = true;
          achievementUnlocked = true;
          console.log(`Achievement unlocked: ${achievementConfig.name}`);
          if (achievementConfig.rewardGems > 0) {
            eventBus.emit("currency:add", {
              type: "gem",
              amount: achievementConfig.rewardGems,
            });
          }
          eventBus.emit("ui:show_achievement", achievementConfig);
        }
      }
    }
    if (achievementUnlocked) {
      eventBus.emit("achievements:update_state", achievementsState);
    }
  }

  setupEventListeners() {
    eventBus.on("state:forAchievements", (state) =>
      this.checkAchievements(state)
    );
  }
}

export const achievementManager = new AchievementManager();
