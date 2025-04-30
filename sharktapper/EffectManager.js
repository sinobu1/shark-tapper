// ====================== МЕНЕДЖЕР ЭФФЕКТОВ (из main.js) ======================
class EffectManager {
    constructor(eventBus) {
        this.eventBus = eventBus;
         this.particlesContainer = document.getElementById('particles'); // Кэшируем контейнер
         this.sharkWrapper = document.querySelector('.shark-wrapper'); // Кэшируем обертку акулы

        // Инициализация частиц при создании
        if (this.particlesContainer) {
            this.createParticles();
        } else {
            console.warn("Particles container not found.");
        }
        this.setupEventListeners();
    }

     createParticles() {
         if (!this.particlesContainer) return;
         this.particlesContainer.innerHTML = ''; // Очищаем старые частицы

         // Оптимизация: не создаем слишком много частиц
         const particleCount = Math.min(100, Math.floor(window.innerWidth / 15));

         const fragment = document.createDocumentFragment(); // Используем фрагмент для производительности

         for (let i = 0; i < particleCount; i++) {
             const particle = document.createElement('div');
             particle.classList.add('particle');

             const size = Math.random() * 2 + 1;
             particle.style.width = `${size}px`;
             particle.style.height = `${size}px`;
             // Распределяем частицы по всей высоте видимой области
             particle.style.left = `${Math.random() * 100}%`;
             particle.style.top = `${Math.random() * window.innerHeight}px`; // Используем высоту окна
             particle.style.opacity = Math.random() * 0.5 + 0.1;

             // Анимация будет задана через CSS для лучшей производительности
              // Добавляем случайную задержку анимации через style
              const duration = Math.random() * 20 + 10; // От 10 до 30 секунд
              const delay = Math.random() * -duration; // Отрицательная задержка для старта в разных фазах
              particle.style.animation = `float ${duration}s linear ${delay}s infinite`;


             fragment.appendChild(particle);
         }
          this.particlesContainer.appendChild(fragment);

         // Стиль для анимации float уже должен быть в CSS. Если нет, добавляем:
         // const styleId = 'particle-float-style';
         // if (!document.getElementById(styleId)) {
         //     const style = document.createElement('style');
         //     style.id = styleId;
         //     style.innerHTML = `
         //         @keyframes float {
         //             0% { transform: translateY(0) translateX(0); opacity: 1; }
         //             50% { transform: translateY(-50px) translateX(${Math.random() * 40 - 20}px); } // Небольшое боковое смещение
         //             100% { transform: translateY(-150px) translateX(${Math.random() * 20 - 10}px); opacity: 0; }
         //         }
         //         .particle { /* Базовые стили частицы */
         //             position: absolute;
         //             background-color: rgba(255, 255, 255, 0.5);
         //             border-radius: 50%;
         //             pointer-events: none; /* Чтобы не мешали кликам */
         //             will-change: transform, opacity; /* Оптимизация */
         //         }
         //     `;
         //     document.head.appendChild(style);
         // }

    }


     showTapEffect({ type, event, text }) {
         if (!event || !this.sharkWrapper) return;

         const wrapperRect = this.sharkWrapper.getBoundingClientRect();
         // Координаты относительно обертки акулы
         const x = event.clientX - wrapperRect.left;
         const y = event.clientY - wrapperRect.top;

         // Общий контейнер для эффекта и текста
          const effectContainer = document.createElement('div');
          effectContainer.className = 'tap-effect-container';
          effectContainer.style.left = `${x}px`;
          effectContainer.style.top = `${y}px`;


         // 1. Эффект круга (если нужен)
         // const circleEffect = document.createElement('div');
         // circleEffect.className = 'tap-effect-circle'; // Добавить стили в CSS
         // effectContainer.appendChild(circleEffect);

         // 2. Текст эффекта
         const textElement = document.createElement('div');
         let textClass = 'tap-plus'; // По умолчанию для монет
         let animationDuration = 800; // мс

         switch (type) {
             case 'gem': textClass = 'tap-gem'; break;
             case 'ore': textClass = 'tap-ore'; break;
             case 'energy': textClass = 'tap-energy'; break; // Если нужно показывать расход энергии
             case 'critical':
                 textClass = 'critical-hit';
                 animationDuration = 1000; // Дольше для крита
                 break;
         }
         textElement.className = `tap-text ${textClass}`;
         textElement.innerText = text;
         effectContainer.appendChild(textElement);

         // Добавляем контейнер в обертку акулы
         this.sharkWrapper.appendChild(effectContainer);

         // Удаление после анимации
         setTimeout(() => {
             effectContainer.remove();
         }, animationDuration);
     }


    activateBoostEffect({ duration }) {
         if (!this.sharkWrapper) return;

         const boostEffect = document.createElement('div');
         boostEffect.className = 'boost-effect-overlay'; // Задаем стили в CSS
         // Пример стилей в CSS:
         /*
         .boost-effect-overlay {
             position: absolute;
             top: 0; left: 0; right: 0; bottom: 0;
             border-radius: 50%; / Или по форме акулы /
             background: radial-gradient(circle, rgba(0, 255, 255, 0.4) 0%, rgba(0, 150, 255, 0) 70%);
             animation: pulse 0.6s infinite alternate;
             pointer-events: none;
             z-index: 5; / Над акулой, но под текстом /
         }
         @keyframes pulse {
             from { transform: scale(1); opacity: 0.7; }
             to { transform: scale(1.1); opacity: 0.4; }
         }
         */
         this.sharkWrapper.appendChild(boostEffect);


         setTimeout(() => {
             boostEffect.remove();
         }, duration);
     }

    setupEventListeners() {
        this.eventBus.on('effect:show', (data) => this.showTapEffect(data));
        this.eventBus.on('effect:boost', (data) => this.activateBoostEffect(data));
    }
}