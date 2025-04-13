const dbUrl = 'https://tralalero-fec07-default-rtdb.firebaseio.com';
let currentSkin = 'default';
let balance = 0;
let ownedSkins = { default: true };
let autoTap = 0;
let ownedBoosters = { 1: false, 2: false, 3: false };
let userId = null;

const tokenCount = document.getElementById('tokenCount');
const tapImage = document.getElementById('tapImage');
const loadingScreen = document.getElementById('loading');
const gameContainer = document.getElementById('gameContainer');

const skinPaths = {
  default: 'shark.png?v=1',
  skin2: 'shark_skin2.png?v=1',
  skin3: 'shark_skin1.png?v=1'
};

function updateSkin() {
  tapImage.src = skinPaths[currentSkin] || skinPaths.default;
}

function saveProgress() {
  if (!userId) return;
  const user = Telegram.WebApp.initDataUnsafe?.user || {};
  const userData = {
    balance, currentSkin, ownedSkins, autoTap, ownedBoosters,
    first_name: user.first_name || "", last_name: user.last_name || "",
    username: user.username || "", photo_url: user.photo_url || ""
  };
  fetch(`${dbUrl}/users/${userId}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
}

function loadProgress() {
  if (!userId) return;
  fetch(`${dbUrl}/users/${userId}.json`)
    .then(res => res.json())
    .then(data => {
      if (data) {
        balance = data.balance || 0;
        currentSkin = data.currentSkin || 'default';
        ownedSkins = data.ownedSkins || { default: true };
        autoTap = data.autoTap || 0;
        ownedBoosters = data.ownedBoosters || {};
        tokenCount.textContent = `${balance} токенов`;
        updateSkin();
        updateBoosterTexts();
      }
    });
}


function showFloatingText(text) {
  const float = document.createElement("div");
  float.className = "floating-text";
  float.textContent = text;
  float.style.left = "50%";
  float.style.top = "40%";
  document.body.appendChild(float);
  setTimeout(() => float.remove(), 1000);
}

function openShop() {
  document.getElementById('shop-modal').style.display = 'flex';
}
function closeShop() {
  document.getElementById('shop-modal').style.display = 'none';
}
function buySkin(skinId, price) {
  if (ownedSkins[skinId]) {
    currentSkin = skinId;
  } else if (balance >= price) {
    balance -= price;
    ownedSkins[skinId] = true;
    currentSkin = skinId;
  } else {
    alert('Недостаточно токенов!');
    return;
  }
  updateSkin();
  tokenCount.textContent = `${balance} токенов`;
  saveProgress();
}

function openBoosters() {
  document.getElementById('booster-modal').style.display = 'flex';
  updateBoosterTexts();
}
function closeBoosters() {
  document.getElementById('booster-modal').style.display = 'none';
}
function updateBoosterTexts() {
  const boosterItems = document.querySelectorAll('.booster-item');
  boosterItems.forEach((item, index) => {
    const increment = index + 1;
    const infoDiv = item.querySelector('.booster-info');
    const button = item.querySelector('button');
    if (ownedBoosters[increment]) {
      infoDiv.textContent = `Авто-Тап +${increment} (куплено)`;
      button.disabled = true;
    } else {
      const price = increment === 3 ? 1000 : increment * 50;
      infoDiv.textContent = `Авто-Тап +${increment} (${price} токенов)`;
      button.disabled = false;
    }
  });
}
function buyBooster(price, increment) {
  if (balance >= price && !ownedBoosters[increment]) {
    balance -= price;
    autoTap += increment;
    ownedBoosters[increment] = true;
    tokenCount.textContent = `${balance} токенов`;
    updateBoosterTexts();
    saveProgress();
  } else if (ownedBoosters[increment]) {
    alert('Бустер уже куплен!');
  } else {
    alert('Недостаточно токенов!');
  }
}
function startAutoTap() {
  setInterval(() => {
    if (autoTap > 0) {
      balance += autoTap;
      tokenCount.textContent = `${balance} токенов`;
      saveProgress();
    }
  }, 1000);
}

function openLeaderboard() {
  document.getElementById('leaderboard-modal').style.display = 'flex';
  loadLeaderboard();
}
function closeLeaderboard() {
  document.getElementById('leaderboard-modal').style.display = 'none';
}
function loadLeaderboard() {
  fetch(`${dbUrl}/users.json`)
    .then(r => r.json())
    .then(data => {
      const list = Object.entries(data || {}).map(([id, d]) => ({
        id,
        balance: d.balance || 0,
        first_name: d.first_name,
        username: d.username,
        photo_url: d.photo_url
      })).sort((a,b) => b.balance - a.balance).slice(0, 10);
      document.getElementById("leaderboardList").innerHTML =
        list.map(u => {
          const name = u.first_name || `ID ${u.id.slice(-4)}`;
          const avatar = u.photo_url ? `<img src="${u.photo_url}" style="width:24px;height:24px;border-radius:50%;margin-right:6px;">` : "";
          return `<li>${avatar}<strong>${name}</strong>: ${u.balance}</li>`;
        }).join("");
    });
}