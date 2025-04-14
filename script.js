      // Set skin
      function setSkin(skin, silent = false) {
        const skins = {
          'default': 'https://sinobu1.github.io/shark-tapper/shark.png',
          'skin2': 'https://sinobu1.github.io/shark-tapper/shark_skin2.png',
          'skin3': 'https://sinobu1.github.io/shark-tapper/shark_skin1.png'
        };
        
        if (skins[skin]) {
          userData.skin = skin;
          document.getElementById('tapImage').src = skins[skin];
          
          // Update selected skin in gallery
          document.querySelectorAll('.shark-gallery img').forEach(img => {
            img.classList.toggle('selected', img.dataset.skin === skin);
          });
          
          if (!silent) saveProgress();
        }
      }

      // Load Telegram
      function loadTelegram() {
        try {
          Telegram.WebApp.ready();
          Telegram.WebApp.expand();
          
          const tgUser = Telegram.WebApp.initDataUnsafe?.user;
          if (tgUser) {
            userId = tgUser.id.toString();
            userData.username = tgUser.first_name || "Player";
            userData.avatar = tgUser.photo_url || "https://placehold.co/64x64";
            document.getElementById("profileName").textContent = userData.username;
            document.getElementById("profileAvatar").src = userData.avatar;
            loadProgress();
          }
        } catch (e) {
          console.log('Telegram context not available');
          initLocalStorage();
        }
      }
      
      // Load progress from server
      async function loadProgress() {
        showLoader();
        try {
          if (!userId) return;
          
          const response = await fetch(`${dbUrl}/users/${userId}.json`);
          const data = await response.json();
          
          if (data) {
            // Merge server data with local
            userData.tokens = Math.max(data.balance || 0, userData.tokens);
            userData.taps = Math.max(data.taps || 0, userData.taps);
            userData.skin = data.skin || userData.skin || 'default';
            userData.achievements = [...new Set([...(data.achievements || []), ...userData.achievements])];
            userData.autoclickers = Math.max(data.autoclickers || 0, userData.autoclickers);
            
            // Update UI
            updateDisplay();
            setSkin(userData.skin, true);
            updateAutoclicker();
            updateAchievementBadge();
            
            // Save merged data
            saveToLocalStorage();
          }
        } catch(err) {
          console.error('Load error:', err);
        } finally {
          hideLoader();
        }
      }

      // Show loader
      function showLoader() {
        clearTimeout(loaderTimeout);
        loaderTimeout = setTimeout(() => {
          loader.classList.add('active');
          document.body.style.pointerEvents = 'none';
        }, 300);
      }

      // Hide loader
      function hideLoader() {
        clearTimeout(loaderTimeout);
        loader.classList.remove('active');
        document.body.style.pointerEvents = 'auto';
      }

      // Auto-save every 30 seconds
      setInterval(() => {
        if (userData.tokens > 0) saveProgress();
      }, 30000);

      // Reset daily quests at midnight
      function checkDailyReset() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const timeUntilReset = tomorrow - now;
        
        setTimeout(() => {
          userData.dailyQuests = {
            taps: { current: 0, target: 100, completed: false },
            coins: { current: 0, target: 500, completed: false }
          };
          saveProgress();
          checkDailyReset(); // Set up next reset
        }, timeUntilReset);
      }
      
      // Initialize daily reset check
      checkDailyReset();

      // Initialize the app
      init();
    });