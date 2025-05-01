// js/uiManager.js
import { eventBus } from "./eventBus.js";
import { config } from "./config.js";
import { formatNumber, getCurrentCost, createElement } from "./utils.js";

class UIManager {
  constructor() {
    this.elements = this.cacheElements();
    this.setupEventListeners();
    this.renderStaticElements(); // Рендер того, что не меняется динамически
    console.log("UIManager initialized");
  }

  cacheElements() {
    return {
      // Валюты и энергия
      coinCount: document.getElementById("coin-count"),
      gemCount: document.getElementById("gem-count"),
      oreCount: document.getElementById("ore-count"),
      energyCount: document.getElementById("energy-count"),
      energyBar: document.getElementById("energy-bar"),
      // Игрок
      playerInfo: document.querySelector(".player-info"), // Контейнер для аватара и имени
      userName: document.getElementById("user-name"),
      userAvatar: document.getElementById("user-avatar"),
      playerLevel: document.querySelector(".player-level"),
      progressFill: document.querySelector(".progress-fill"),
      // Доход и тап
      income: document.querySelector(".income"),
      tapValueDisplay: document.getElementById("tap-value-display"), // Элемент для показа силы тапа (если нужно)
      // Кнопки действий
      shark: document.querySelector(".shark"),
      boostButton: document.getElementById("boost-button"),
      // Магазин
      shopTabsContainer: document.querySelector(".shop-tabs"),
      shopTabs: document.querySelectorAll(".shop-tab"), // Для переключения active
      shopContent: {
        // Контейнеры для рендера
        helpers: document.getElementById("helpers-tab"),
        upgrades: document.getElementById("upgrades-tab"),
        skins: document.getElementById("skins-tab"),
        lootboxes: document.getElementById("lootboxes-tab"),
      },
      // Модалки и уведомления
      lootboxModal: document.getElementById("lootbox-modal"),
      lootboxTitle: document.getElementById("lootbox-title"),
      lootboxReward: document.getElementById("lootbox-reward"),
      closeLootboxBtn: document.getElementById("close-lootbox"),
      levelUpNotification: document.getElementById("level-up-notification"),
      achievementNotification: document.getElementById(
        "achievement-notification"
      ), // Уведомление о достижении
      notificationArea: document.getElementById("notification-area"), // Область для общих уведомлений
    };
  }

  // Рендер элементов, которые не требуют постоянного обновления state
  renderStaticElements() {
    this.setupShopTabs();
    this.setupLootboxModal();
    // Можно отрендерить базовую структуру магазина один раз,
    // а потом только обновлять цены/уровни/кнопки
  }

  updateUI(state) {
    if (!state || !this.elements) return; // Проверка

    // Валюты
    if (this.elements.coinCount)
      this.elements.coinCount.textContent = formatNumber(state.currencies.coin);
    if (this.elements.gemCount)
      this.elements.gemCount.textContent = formatNumber(state.currencies.gem);
    if (this.elements.oreCount)
      this.elements.oreCount.textContent = formatNumber(state.currencies.ore);

    // Энергия
    if (this.elements.energyCount)
      this.elements.energyCount.textContent = state.energy.current;
    if (this.elements.energyBar)
      this.elements.energyBar.style.width = `${
        (state.energy.current / state.energy.max) * 100
      }%`;

    // Уровень и прогресс
    if (this.elements.playerLevel)
      this.elements.playerLevel.textContent = `Ур. ${state.player.level}`;
    if (this.elements.progressFill && state.player.progressToNextLevel > 0) {
      const progressPercentage =
        (state.player.progress / state.player.progressToNextLevel) * 100;
      this.elements.progressFill.style.width = `${progressPercentage}%`;
    } else if (this.elements.progressFill) {
      this.elements.progressFill.style.width = `0%`;
    }

    // Пассивный доход
    if (this.elements.income)
      this.elements.income.textContent = `+${formatNumber(
        state.derived.passiveIncomePerSec
      )}/сек`;

    // Сила тапа (если нужно отображать)
    if (this.elements.tapValueDisplay)
      this.elements.tapValueDisplay.textContent = `Тап: ${formatNumber(
        state.derived.currentTapValue
      )}`;

    // Кнопка буста
    if (this.elements.boostButton) {
      this.elements.boostButton.disabled = state.boost.active;
      this.elements.boostButton.innerHTML = state.boost.active
        ? '<i class="fas fa-rocket"></i> Буст Активен!'
        : '<i class="fas fa-rocket"></i> Буст';
    }

    // Обновление магазина (перерисовка нужной вкладки)
    this.renderShop(state); // Передаем текущее состояние
  }

  updateUserInfo(name, photoUrl) {
    if (this.elements.userName)
      this.elements.userName.textContent = name || "Игрок";
    if (this.elements.userAvatar)
      this.elements.userAvatar.src =
        photoUrl || "https://img.icons8.com/ios-filled/50/user-male-circle.png";
  }

  showLevelUpNotification(level) {
    const notification = this.elements.levelUpNotification;
    if (!notification) return;
    notification.querySelector("p").textContent = `Достигнут Уровень ${level}!`; // Пример
    notification.classList.add("show");
    // Дополнительные эффекты (свечение)
    if (this.elements.shark) {
      const glow = createElement("div", ["evolution-glow"]);
      this.elements.shark.parentNode.appendChild(glow); // Добавляем в wrapper
      setTimeout(() => glow.remove(), 2000);
    }
    setTimeout(() => notification.classList.remove("show"), 2000);
  }

  showAchievementNotification(achievementConfig) {
    const notification = this.elements.achievementNotification;
    if (!notification) return;
    notification.querySelector("h4").textContent = achievementConfig.name;
    notification.querySelector("p").textContent = achievementConfig.description;
    notification.classList.add("show");
    setTimeout(() => notification.classList.remove("show"), 3000);
  }

  showNotification({ type = "info", message = "...", duration = 3000 }) {
    if (!this.elements.notificationArea || !message) return;
    const notification = createElement(
      "div",
      [`notification`, `notification-${type}`],
      message
    );
    this.elements.notificationArea.appendChild(notification);
    setTimeout(() => {
      notification.classList.add("hide");
      setTimeout(() => notification.remove(), 500); // Удаляем после анимации
    }, duration);
  }

  // --- Управление Магазином ---

  setupShopTabs() {
    if (!this.elements.shopTabsContainer) return;
    this.elements.shopTabsContainer.addEventListener("click", (event) => {
      const tab = event.target.closest(".shop-tab");
      if (tab && tab.dataset.tab) {
        this.changeShopTab(tab.dataset.tab);
      }
    });
    // Активируем первую вкладку
    const firstTab = this.elements.shopTabsContainer.querySelector(".shop-tab");
    if (firstTab) {
      this.changeShopTab(firstTab.dataset.tab);
    }
  }

  changeShopTab(tabName) {
    this.elements.shopTabs.forEach((t) => t.classList.remove("active"));
    const activeTabElement = this.elements.shopTabsContainer.querySelector(
      `.shop-tab[data-tab="${tabName}"]`
    );
    if (activeTabElement) activeTabElement.classList.add("active");

    for (const name in this.elements.shopContent) {
      if (this.elements.shopContent[name]) {
        this.elements.shopContent[name].style.display =
          name === tabName ? "grid" : "none";
      }
    }
    // Перерисовываем содержимое активной вкладки при переключении
    const state = eventBus.emitSync("state:get");
    if (state) {
      this.renderShopTabContent(tabName, state);
    }
  }

  // Рендерит все вкладки магазина (вызывается при state:updated)
  renderShop(state) {
    const activeTab = this.getActiveShopTab();
    if (activeTab) {
      this.renderShopTabContent(activeTab, state);
    }
    // Можно оптимизировать и рендерить только если валюта или уровни предметов изменились
  }

  getActiveShopTab() {
    const activeTabElement =
      this.elements.shopTabsContainer?.querySelector(".shop-tab.active");
    return activeTabElement?.dataset?.tab || null;
  }

  // Рендерит содержимое конкретной вкладки
  renderShopTabContent(tabName, state) {
    const container = this.elements.shopContent[tabName];
    if (!container) return;

    container.innerHTML = ""; // Очищаем перед рендером

    switch (tabName) {
      case "helpers":
        this.renderHelpers(container, state);
        break;
      case "upgrades":
        this.renderUpgrades(container, state);
        break;
      case "skins":
        this.renderSkins(container, state);
        break;
      case "lootboxes":
        this.renderLootboxes(container, state);
        break;
    }
  }

  // Рендер Помощников
renderHelpers(container, state) {
    const userCoins = state.currencies.coin;
    Object.entries(config.helpers).forEach(([id, itemConfig]) => {
        const itemState = state.shop.helpers[id];
        if (!itemState || itemState.owned === undefined) {
            console.warn(`Helper ${id} has no 'owned' property in state.`);
            return;
        }
        const currentCost = getCurrentCost(
            itemConfig.cost,
            itemState.owned,
            itemConfig.costIncrease
        );
        const canAfford = userCoins >= currentCost;

        // Генерация HTML для карточки
        const itemHTML = `
            <div class="shop-item-card ${itemConfig.rarity}" data-item-id="${id}" data-item-type="helper">
                <!-- Skin Preview -->
                <div class="skin-preview" style="background-image: url('${itemConfig.imageUrl}');"></div>
                
                <!-- Card Header -->
                <div class="rarity-badge ${itemConfig.rarity}">${itemConfig.rarity}</div>
                <div class="card-header">
                    <div class="card-title">${itemConfig.name}</div>
                    
                </div>
                
                <!-- Card Body -->
                <div class="card-body">
                    <div class="card-description">+${itemConfig.income} /сек. Уровень: ${itemState.owned}</div>
                    <div class="card-price">
                        <span class="price-tag coins-price"><i class="fas fa-coins"></i> ${formatNumber(currentCost)}</span>
                    </div>
                    <button class="card-button ${!canAfford ? "disabled" : ""}">
                        ${itemState.owned > 0 ? `Куплено: ${itemState.owned}` : "Купить"}
                    </button>
                </div>
            </div>`;

        // Вставка HTML в контейнер
        container.insertAdjacentHTML("beforeend", itemHTML);
    });
}

  // Рендер Улучшений
renderUpgrades(container, state) {
  Object.entries(config.upgrades).forEach(([id, itemConfig]) => {
      const itemState = state.shop.upgrades[id];
      if (!itemState || itemState.owned === undefined) {
          console.warn(`Upgrade ${id} has no 'owned' property in state.`);
          return;
      }
      const currentCost = getCurrentCost(
          itemConfig.cost,
          itemState.owned,
          itemConfig.costIncrease
      );
      const currency = itemConfig.currency;
      const userCurrency = state.currencies[currency];
      const isMaxLevel =
          itemConfig.maxLevel && itemState.owned >= itemConfig.maxLevel;
      const canAfford = !isMaxLevel && userCurrency >= currentCost;
      let currencyIcon = "fa-coins";
      if (currency === "gem") currencyIcon = "fa-gem";
      if (currency === "ore") currencyIcon = "fa-cube";

      // Получаем описание эффекта
      let descriptionText = "";
      if (typeof itemConfig.description === "function") {
          descriptionText = itemConfig.description(
              itemState.owned,
              itemConfig.effect
          );
      } else {
          descriptionText = `Эффект: ${itemConfig.effect}`; // Фоллбэк
      }

      const itemHTML = `
          <div class="shop-item-card ${itemConfig.rarity}" data-item-id="${id}" data-item-type="upgrade">
              <!-- Skin Preview -->
              <div class="skin-preview" style="background-image: url('${itemConfig.imageUrl}');"></div>
              
              <!-- Card Header -->
              <div class="rarity-badge ${itemConfig.rarity}">${itemConfig.rarity}</div>
              <div class="card-header">
                  <div class="card-title">${itemConfig.name}</div>
                  
              </div>
              
              <!-- Card Body -->
              <div class="card-body">
                  <div class="card-description">${descriptionText} Уровень: ${itemState.owned}/${itemConfig.maxLevel || "∞"}</div>
                  <div class="card-price">
                      <span class="price-tag ${currency}-price"><i class="fas ${currencyIcon}"></i> ${formatNumber(currentCost)}</span>
                  </div>
                  <button class="card-button ${isMaxLevel ? "maxed" : ""} ${isMaxLevel || !canAfford ? "disabled" : ""}">
                      ${isMaxLevel ? "Макс" : "Улучшить"}
                  </button>
              </div>
          </div>`;

      // Вставка HTML в контейнер
      container.insertAdjacentHTML("beforeend", itemHTML);
  });
}

  // Рендер Скинов
renderSkins(container, state) {
  const currentSkinId = state.shop.skins.current;
  Object.entries(config.skins).forEach(([id, itemConfig]) => {
      const isOwned = state.shop.skins.owned[id];
      const isEquipped = currentSkinId === id;
      let canAfford = false;
      if (!isOwned) {
          canAfford =
              state.currencies.coin >= itemConfig.cost &&
              state.currencies.gem >= itemConfig.costGems &&
              state.currencies.ore >= itemConfig.costOre;
      }
      let priceHTML = "";
      if (
          !isOwned &&
          (itemConfig.cost > 0 ||
           itemConfig.costGems > 0 ||
           itemConfig.costOre > 0)
      ) {
          if (itemConfig.cost > 0)
              priceHTML += `<span class="price-tag coins-price"><i class="fas fa-coins"></i> ${formatNumber(itemConfig.cost)}</span>`;
          if (itemConfig.costGems > 0)
              priceHTML += `<span class="price-tag gems-price"><i class="fas fa-gem"></i> ${formatNumber(itemConfig.costGems)}</span>`;
          if (itemConfig.costOre > 0)
              priceHTML += `<span class="price-tag ore-price"><i class="fas fa-cube"></i> ${formatNumber(itemConfig.costOre)}</span>`;
      } else if (isOwned) {
          // Можно ничего не показывать или "Куплено"
      } else {
          priceHTML = '<span class="price-tag free-tag">Бесплатно</span>';
      }
      let descriptionText = "";
      if (typeof itemConfig.description === "function") {
          descriptionText = itemConfig.description(itemConfig.multiplier);
      } else {
          descriptionText = itemConfig.description || "";
      }
      const itemHTML = `
          <div class="shop-item-card ${itemConfig.rarity} ${
              isEquipped ? "equipped-skin" : ""
          }" data-item-id="${id}" data-item-type="skin">
              <!-- Skin Preview -->
              <div class="skin-preview" style="background-image: url('${itemConfig.imageUrl}');"></div>
              
              <!-- Card Header -->
              <div class="rarity-badge ${itemConfig.rarity}">${itemConfig.rarity}</div>
              <div class="card-header">
                  <div class="card-title">${itemConfig.name}</div>
                  
              </div>
              
              <!-- Card Body -->
              <div class="card-body">
                  <div class="card-description">${descriptionText}</div>
                  <div class="card-price">${priceHTML}</div>
                  <button class="card-button ${
                      isEquipped ? "equipped" : isOwned ? "owned" : ""
                  }" ${isEquipped || (!isOwned && !canAfford) ? "disabled" : ""}>
                      ${isEquipped ? "Надет" : isOwned ? "Надеть" : "Купить"}
                  </button>
              </div>
          </div>`;
      container.insertAdjacentHTML("beforeend", itemHTML);
  });
}

  // Рендер Лутбоксов
renderLootboxes(container, state) {
  Object.entries(config.lootboxes).forEach(([id, itemConfig]) => {
      const currency = itemConfig.currency;
      const cost = itemConfig.cost;
      const canAfford = state.currencies[currency] >= cost;

      let currencyIcon = "fa-coins";
      if (currency === "gem") currencyIcon = "fa-gem";
      if (currency === "ore") currencyIcon = "fa-cube";

      const itemHTML = `
          <div class="shop-item-card ${itemConfig.rarity}" data-item-id="${id}" data-item-type="lootbox">
              <!-- Skin Preview -->
              <div class="skin-preview" style="background-image: url('${itemConfig.imageUrl}');"></div>
              
              <!-- Card Header -->
              <div class="rarity-badge ${itemConfig.rarity}">${itemConfig.rarity}</div>
              <div class="card-header">
                  <div class="card-title">${itemConfig.name}</div>
              
              </div>
              
              <!-- Card Body -->
              <div class="card-body">
                  <div class="card-description">${itemConfig.description || ""}</div>
                  <div class="card-price">
                      <span class="price-tag ${currency}-price"><i class="fas ${currencyIcon}"></i> ${formatNumber(cost)}</span>
                  </div>
                  <button class="card-button" ${!canAfford ? "disabled" : ""}>Открыть</button>
              </div>
          </div>`;
      container.insertAdjacentHTML("beforeend", itemHTML);
  });
}

  setupLootboxModal() {
    const modal = this.elements.lootboxModal;
    if (!modal) return;
    this.elements.closeLootboxBtn?.addEventListener(
      "click",
      () => (modal.style.display = "none")
    );
    window.addEventListener("click", (event) => {
      // Закрытие по клику вне окна
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });
  }

  showLootboxRewardModal({ lootboxType, reward }) {
    const modal = this.elements.lootboxModal;
    if (!modal || !this.elements.lootboxTitle || !this.elements.lootboxReward)
      return;
    const lootboxConfig = config.lootboxes[lootboxType];
    if (!lootboxConfig) return;

    this.elements.lootboxTitle.textContent = lootboxConfig.name;
    // Используем форматированную награду
    this.elements.lootboxReward.textContent = `Вы получили: ${formatLootboxReward(
      reward
    )}`;
    modal.style.display = "flex";
  }

  // --- Обработчики Событий ---
  setupEventListeners() {
    // Обновление UI при изменении состояния
    eventBus.on("state:updated", (state) => this.updateUI(state));
    // Обновление UI после загрузки (первый рендер)
    eventBus.on("state:loaded", (state) => this.updateUI(state));

    // Обновление информации о пользователе
    eventBus.on("user:info_updated", ({ name, photoUrl }) =>
      this.updateUserInfo(name, photoUrl)
    );

    // Показ уведомлений
    eventBus.on("ui:notification_show", (data) => this.showNotification(data));
    eventBus.on("ui:show_level_up", ({ newLevel }) =>
      this.showLevelUpNotification(newLevel)
    );
    eventBus.on("ui:show_achievement", (achievementConfig) =>
      this.showAchievementNotification(achievementConfig)
    );
    eventBus.on("ui:show_lootbox_reward", (data) =>
      this.showLootboxRewardModal(data)
    );

    // --- Делегирование событий клика ---
    // Клик по акуле
    this.elements.shark?.addEventListener("click", (event) => {
      eventBus.emit("game:tap_request", { event }); // Отправляем запрос на тап
    });

    // Клик по кнопке буста
    this.elements.boostButton?.addEventListener("click", () => {
      eventBus.emit("game:boost_request");
    });

    // Клики внутри магазина (делегирование)
    Object.values(this.elements.shopContent).forEach((container) => {
      if (container) {
        container.addEventListener("click", (event) => {
          const button = event.target.closest("button.card-button");
          const card = event.target.closest(".shop-item-card");
          if (button && card && card.dataset.itemId && card.dataset.itemType) {
            const { itemId, itemType } = card.dataset;
            //console.log(`Shop click: type=${itemType}, id=${itemId}`);
            switch (itemType) {
              case "helper":
                eventBus.emit("shop:buy_helper_request", { helperId: itemId });
                break;
              case "upgrade":
                eventBus.emit("shop:buy_upgrade_request", {
                  upgradeId: itemId,
                });
                break;
              case "skin":
                eventBus.emit("shop:handle_skin_request", { skinId: itemId });
                break;
              case "lootbox":
                eventBus.emit("shop:open_lootbox_request", {
                  lootboxType: itemId,
                });
                break;
            }
          }
        });
      }
    });
  }
}

// Экспортируем единственный экземпляр
export const uiManager = new UIManager();
