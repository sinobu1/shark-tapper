// js/utils.js
import { config } from "./config.js";

export function formatNumber(num) {
  if (num < 10000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  if (num < 1000000000)
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}m`;
  return `${(num / 1000000000).toFixed(1).replace(/\.0$/, "")}b`;
}

export function getCurrentCost(baseCost, owned, costIncrease) {
  return Math.floor(baseCost * Math.pow(costIncrease, owned));
}

export function formatLootboxReward(reward) {
  switch (reward.type) {
    case "coin":
      if (reward.wasDuplicate) {
        const skinConfig = config.skins[reward.originalItemId];
        const skinName = skinConfig ? skinConfig.name : reward.originalItemId;
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
    case "skin":
      const skinConfig = config.skins[reward.itemId];
      return `Новый скин: ${skinConfig ? skinConfig.name : reward.itemId}`;
    default:
      return `Неизвестная награда (${reward.type})`;
  }
}

export function createElement(tag, classNames = [], textContent = "") {
  const element = document.createElement(tag);
  element.classList.add(...classNames);
  element.textContent = textContent;
  return element;
}
