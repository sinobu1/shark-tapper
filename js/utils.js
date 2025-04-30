// js/utils.js
import { config } from "./config.js";

/**
 * Форматирует числа в k, m, b
 */
export function formatNumber(num) {
  if (num === undefined || num === null) return "0";
  if (num < 10000) return num.toString();
  if (num < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  if (num < 1000000000)
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "m";
  return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "b";
}

/**
 * Рассчитывает текущую стоимость предмета с учетом количества и удорожания
 */
export function getCurrentCost(baseCost, owned, costIncrease) {
  return Math.floor(baseCost * Math.pow(costIncrease, owned));
}

/**
 * Форматирует текст награды из лутбокса для отображения
 */
export function formatLootboxReward(reward) {
  switch (reward.type) {
    case "coin":
      if (reward.wasDuplicate) {
        const originalSkinConfig = config.skins[reward.originalItemId];
        const skinName = originalSkinConfig
          ? originalSkinConfig.name
          : reward.originalItemId;
        return `${formatNumber(
          reward.amount
        )} монет (Дубликат скина: ${skinName})`;
      }
      return `${formatNumber(reward.amount)} монет`;
    case "gem":
      return `${formatNumber(reward.amount)} гемов`;
    case "ore":
      return `${formatNumber(reward.amount)} руды`;
    case "helper":
      const helperConfig = config.helpers[reward.itemId];
      return `Помощник: ${helperConfig ? helperConfig.name : reward.itemId}`;
    case "skin": // Сработает только если не дубликат
      const skinConfig = config.skins[reward.itemId];
      return `Новый скин: ${skinConfig ? skinConfig.name : reward.itemId}`;
    default:
      return `Неизвестная награда (${reward.type})`;
  }
}

/**
 * Создает HTML-элемент с классами и текстом
 */
export function createElement(tag, classNames = [], textContent = "") {
  const element = document.createElement(tag);
  if (classNames.length > 0) {
    element.classList.add(...classNames);
  }
  if (textContent) {
    element.textContent = textContent;
  }
  return element;
}
