// js/effectManager.js
import { eventBus } from "./eventBus.js";

class EffectManager {
  constructor() {
    this.particlesContainer = document.getElementById("particles");
    this.sharkWrapper = document.querySelector(".shark-wrapper");
    this.createParticles();
    this.setupEventListeners();
  }

  createParticles() {
    if (!this.particlesContainer) return;
    this.particlesContainer.innerHTML = "";
    const particleCount = Math.min(100, Math.floor(window.innerWidth / 15));
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.classList.add("particle");
      const size = Math.random() * 2 + 1;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * window.innerHeight}px`;
      particle.style.opacity = Math.random() * 0.5 + 0.1;
      const duration = Math.random() * 20 + 10;
      const delay = Math.random() * -duration;
      particle.style.animation = `float ${duration}s linear ${delay}s infinite`;
      fragment.appendChild(particle);
    }
    this.particlesContainer.appendChild(fragment);
  }

  showTapEffect({ type, event, text }) {
    if (!event || !this.sharkWrapper) return;
    const wrapperRect = this.sharkWrapper.getBoundingClientRect();
    const x = event.clientX - wrapperRect.left;
    const y = event.clientY - wrapperRect.top;
    const effectContainer = document.createElement("div");
    effectContainer.className = "tap-effect-container";
    effectContainer.style.left = `${x}px`;
    effectContainer.style.top = `${y}px`;
    const textElement = document.createElement("div");
    let textClass = "tap-plus";
    let animationDuration = 800;
    switch (type) {
      case "gem":
        textClass = "tap-gem";
        break;
      case "ore":
        textClass = "tap-ore";
        break;
      case "energy":
        textClass = "tap-energy";
        break;
      case "critical":
        textClass = "critical-hit";
        animationDuration = 1000;
        break;
      default:
        textClass = "tap-plus";
        break;
    }
    textElement.className = `tap-text ${textClass}`;
    textElement.innerText = text;
    effectContainer.appendChild(textElement);
    this.sharkWrapper.appendChild(effectContainer);
    setTimeout(() => effectContainer.remove(), animationDuration);
  }

  activateBoostEffect({ duration }) {
    if (!this.sharkWrapper) return;
    const boostEffect = document.createElement("div");
    boostEffect.className = "boost-effect-overlay";
    this.sharkWrapper.appendChild(boostEffect);
    setTimeout(() => boostEffect.remove(), duration);
  }

  setupEventListeners() {
    eventBus.on("effect:show_tap", (data) => this.showTapEffect(data));
    eventBus.on("effect:show_boost", (data) => this.activateBoostEffect(data));
    window.addEventListener("resize", () => this.createParticles());
  }
}

export const effectManager = new EffectManager();
