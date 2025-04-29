// --- SHOP PAGE SPECIFIC FUNCTIONS ---
// DOM Element variables for shop page
let helpersTabContainer, upgradesTabContainer, skinsTabContainer;

function initShopPage() {
     helpersTabContainer = document.getElementById('helpers-tab');
     upgradesTabContainer = document.getElementById('upgrades-tab');
     skinsTabContainer = document.getElementById('skins-tab');

     // Render shop items using the loaded game state
     renderAllShopItems();
}

// Change shop tab visibility
function changeTab(tabName) {
    // Hide all tabs first
    if (helpersTabContainer) helpersTabContainer.style.display = 'none';
    if (upgradesTabContainer) upgradesTabContainer.style.display = 'none';
    if (skinsTabContainer) skinsTabContainer.style.display = 'none';

    // Deactivate all tab buttons
    document.querySelectorAll('.shop-tab').forEach(tab => tab.classList.remove('active'));

    // Show the selected tab and activate its button
    const selectedTabContainer = document.getElementById(`${tabName}-tab`);
    const selectedTabButton = document.querySelector(`.shop-tab[onclick="changeTab('${tabName}')"]`);
    if (selectedTabContainer) selectedTabContainer.style.display = 'flex'; // Use flex for items
    if (selectedTabButton) selectedTabButton.classList.add('active');
}

 function renderAllShopItems() {
     if (helpersTabContainer) renderShopItems(helpersData, savedHelpers, helpersTabContainer, 'helper');
     if (upgradesTabContainer) renderShopItems(upgradesData, savedUpgrades, upgradesTabContainer, 'upgrade');
     if (skinsTabContainer) renderShopItems(skinsData, savedSkins, skinsTabContainer, 'skin');
 }


// Render items for a specific category
function renderShopItems(itemsData, savedItemsState, container, itemType) {
    if (!container) return;
    container.innerHTML = ''; // Clear current items

    itemsData.forEach(item => {
        // Ensure savedItemsState is an object
        savedItemsState = savedItemsState || {};
        const itemState = savedItemsState[item.id] || { owned: 0 }; // Default state if not saved
        const isOwned = itemType === 'helper' ? false : itemState.owned; // Helpers can be bought multiple times
         const isMaxed = itemType === 'helper' ? false : isOwned; // Only upgrades/skins can be 'maxed' (bought once)

         const itemElement = document.createElement('div');
         itemElement.className = 'shop-item';
         itemElement.id = `shop-item-${item.id}`;

         // Determine cost and currency icon
         let currencyIcon = 'fa-coins'; // Default to coins
         let currencyColorClass = 'coins';
         let cost = item.cost;
         if (item.currency === 'gems') {
             currencyIcon = 'fa-gem';
             currencyColorClass = 'gems';
         } else if (item.currency === 'ore') { // Add ore if needed
             currencyIcon = 'fa-cube'; // Example icon for ore
             currencyColorClass = 'ore';
         }

        // Check affordability
        let canAfford = false;
        if (item.currency === 'coins' && coinCount >= cost) canAfford = true;
        else if (item.currency === 'gems' && gemCount >= cost) canAfford = true;
        else if (item.currency === 'ore' && oreCount >= cost) canAfford = true;


         // Button text and state
         let buttonText = 'Купить';
         let buttonClass = 'shop-item-button';
         let buttonDisabled = !canAfford || isMaxed;

        if (itemType === 'helper') {
            // Calculate next cost if needed, e.g., cost * Math.pow(1.15, itemState.owned)
            // For simplicity, let's keep cost static for now.
            buttonText = `Купить (${itemState.owned})`; // Show current count
            buttonDisabled = !canAfford; // Can always buy more if affordable
         } else if (isOwned) {
             buttonText = 'Куплено';
             buttonClass += ' owned';
             buttonDisabled = true;
         }


         itemElement.innerHTML = `
             <div class="shop-item-icon"><i class="${item.icon}"></i></div>
             <div class="shop-item-info">
                 <div class="shop-item-name">${item.name} ${itemType === 'helper' ? `(Ур. ${itemState.owned})` : ''}</div>
                 <div class="shop-item-desc">${item.description}</div>
             </div>
             <div class="shop-item-price ${currencyColorClass}">
                 <i class="fas ${currencyIcon}"></i> ${formatNumber(cost)}
             </div>
             <button class="${buttonClass}" onclick="buyItem('${item.id}', '${itemType}')" ${buttonDisabled ? 'disabled' : ''}>
                 ${buttonText}
             </button>
         `;
         container.appendChild(itemElement);
    });
}

// Buy item function (Handles all types)
function buyItem(itemId, itemType) {
    let itemData, savedItemState;

    // Find the item data and its saved state
    if (itemType === 'helper') {
        itemData = helpersData.find(i => i.id === itemId);
        savedItemState = savedHelpers;
    } else if (itemType === 'upgrade') {
        itemData = upgradesData.find(i => i.id === itemId);
        savedItemState = savedUpgrades;
    } else if (itemType === 'skin') {
        itemData = skinsData.find(i => i.id === itemId);
        savedItemState = savedSkins;
    }

     if (!itemData) {
         console.error("Item data not found:", itemId, itemType);
         return;
    }

     // Ensure saved state structure exists for the specific item
     if (!savedItemState[itemId]) {
        savedItemState[itemId] = { owned: 0 };
     }

     // Check if already owned (for non-helpers)
    if (itemType !== 'helper' && savedItemState[itemId].owned) {
         console.log("Item already owned:", itemId);
         return; // Already purchased
    }

     // Check currency and affordabiliy
     const cost = itemData.cost; // Base cost. Could be dynamic for helpers.
     let canAfford = false;
     if (itemData.currency === 'coins' && coinCount >= cost) canAfford = true;
     else if (itemData.currency === 'gems' && gemCount >= cost) canAfford = true;
     else if (itemData.currency === 'ore' && oreCount >= cost) canAfford = true;

     if (!canAfford) {
         console.log("Cannot afford item:", itemId);
         // Optionally show a message to the user
         // showNotification('cant-afford-notification'); // Example
         return;
    }

     // Deduct currency
     if (itemData.currency === 'coins') coinCount -= cost;
     else if (itemData.currency === 'gems') gemCount -= cost;
     else if (itemData.currency === 'ore') oreCount -= cost;

     // Update item state in the saved structure
     if (itemType === 'helper') {
        savedItemState[itemId].owned++;
     } else {
         savedItemState[itemId].owned = true;
     }

    console.log(`Bought ${itemType}: ${itemId}`);

     // Recalculate stats based on new item ownership
     recalculateStatsFromItems();

     // Update UI (shop items and common UI)
     renderAllShopItems();
     updateCommonUI();

     // Save game state immediately after purchase
     // *** ИСПРАВЛЕНО: Вызываем правильную функцию сохранения ***
     saveGameToFirebase();
}
