window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    loadingScreen.style.display = 'none';
    gameContainer.style.display = 'block';
  }, 5000);

  if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();

    // GPT: Telegram Web App цветовая тема
    if (Telegram.WebApp.colorScheme === 'dark') {
      document.body.style.background = '#1e1e1e';
      gameContainer.style.background = '#2c2c2e';
      document.querySelectorAll('.balance, .shop-button').forEach(el => {
        el.style.color = '#fff';
      });
    }

    userId = Telegram.WebApp.initDataUnsafe?.user?.id?.toString();
    if (userId) {
      loadProgress();
      startAutoTap();
    } else {
      alert("Не удалось получить userId из Telegram Web App.");
    }
  }
});

function handleTap() {
  balance++;
  if (navigator.vibrate) {
    navigator.vibrate(30);
  } else if (Telegram.WebApp.HapticFeedback) {
    Telegram.WebApp.HapticFeedback.impactOccurred("light");
  }
  tokenCount.textContent = `${balance} токенов`;
  showFloatingText("+1");
  tapImage.classList.add("tap-animation");
  setTimeout(() => tapImage.classList.remove("tap-animation"), 200);
  saveProgress();
}