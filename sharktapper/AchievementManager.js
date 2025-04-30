// ====================== МЕНЕДЖЕР ДОСТИЖЕНИЙ ======================
class AchievementManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.achievements = {
            firstTap: { name: "Первые шаги", description: "Сделайте 100 тапов", threshold: 100, unlocked: false, progress: 0 },
            richTapper: { name: "Богатый тапер", description: "Заработайте 10,000 монет", threshold: 10000, unlocked: false, progress: 0 },
            sharkMaster: { name: "Мастер акул", description: "Достигните 10 уровня", threshold: 10, unlocked: false, progress: 0 },
            criticalHit: { name: "Критический удар", description: "Сделайте 10 критических ударов", threshold: 10, unlocked: false, progress: 0 },
            energyMaster: { name: "Энергичный", description: "Используйте 1000 энергии", threshold: 1000, unlocked: false, progress: 0 }
        };
        
        this.setupEventListeners();
    }
    
    checkAchievement(name) {
        const achievement = this.achievements[name];
        
        if (!achievement.unlocked && achievement.progress >= achievement.threshold) {
            achievement.unlocked = true;
            
            // Награда за достижение
            this.eventBus.emit('currency:add', { type: 'gem', amount: 5 });
            
            // Показать уведомление
            this.eventBus.emit('achievement:unlocked', achievement);
        }
    }
    
    setupEventListeners() {
        this.eventBus.on('achievement:progress', ({ name, amount }) => {
            if (this.achievements[name]) {
                this.achievements[name].progress += amount;
                this.checkAchievement(name);
            }
        });
        
        this.eventBus.on('state:updated', (state) => {
            // Проверка достижений, зависящих от состояния
            if (state.totalTaps >= 100 && !this.achievements.firstTap.unlocked) {
                this.achievements.firstTap.unlocked = true;
                this.eventBus.emit('achievement:unlocked', this.achievements.firstTap);
            }
            
            if (state.totalCoins >= 10000 && !this.achievements.richTapper.unlocked) {
                this.achievements.richTapper.unlocked = true;
                this.eventBus.emit('achievement:unlocked', this.achievements.richTapper);
            }
            
            if (state.playerLevel >= 10 && !this.achievements.sharkMaster.unlocked) {
                this.achievements.sharkMaster.unlocked = true;
                this.eventBus.emit('achievement:unlocked', this.achievements.sharkMaster);
            }
        });
        
        this.eventBus.on('achievement:unlocked', (achievement) => {
            this.showAchievementNotification(achievement);
        });
    }
    
    showAchievementNotification(achievement) {
        const notification = document.getElementById('achievement-notification');
        notification.querySelector('h4').textContent = achievement.name;
        notification.querySelector('p').textContent = achievement.description;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}