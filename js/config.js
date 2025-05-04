// js/config.js
export const config = {
  firebase: {
    apiKey: "AIzaSyDgi8vq_3Wpky7o_bzWbVuKRtOShGjd5o4",
    authDomain: "tralalero-fec07.firebaseapp.com",
    databaseURL: "https://tralalero-fec07-default-rtdb.firebaseio.com",
    projectId: "tralalero-fec07",
    storageBucket: "tralalero-fec07.firebasestorage.app",
    messagingSenderId: "322571108862",
    appId: "1:322571108862:web:14f4fe3a8168abab19c0af",
  },
  game: {
    baseTapValue: 1,
    criticalChance: 0.05,
    criticalMultiplier: 2,
    oreChance: 0.03, // Базовый шанс руды
    gemChanceOnTap: 0.01, // Шанс гема при тапе
    energyRegenRate: 1, // Базовая регенерация
    energyCostPerTap: 1,
    maxEnergy: 100, // Базовая макс. энергия
    boostMultiplier: 2, // Множитель для буста
    boostDuration: 10000, // Длительность буста (мс)
    boostCostGems: 1, // Стоимость буста в гемах
    levelUpBaseTapIncreaseInterval: 5, // Каждые N уровней +1 к базовому тапу
    levelUpBaseTapIncreaseAmount: 1, // На сколько увеличивать базовый тап
    baseProgressToNextLevel: 100, // Опыт для первого уровня
    progressToNextLevelMultiplier: 1.5, // Множитель опыта для след. уровня
    saveInterval: 30000, // Интервал автосохранения (мс)
    duplicateSkinCoinMultiplier: 0.2, // % от стоимости скина в монетах за дубликат
    minCoinsForDuplicateSkin: 1000, // Мин. монет за дубликат
    fallbackLootboxCoins: 500, // Монет, если из лутбокса ничего не выпало
  },
  // Определения предметов магазина (статичные данные)
  helpers: {
    dolphin: {
      name: "Br Br Patapim",
      cost: 50,
      income: 1,
      currency: "coin",
      maxLevel: 50, // ← добавлено
      costIncrease: 1.1,
      rarity: "common",
      imageUrl: "./img/patapim.png",
    },
    orca: {
      name: "Crocodilo Ananasino",
      cost: 500,
      income: 3,
      currency: "coin",
      maxLevel: 40,
      costIncrease: 1.15,
      rarity: "rare",
      imageUrl: "./img/ananasini.png",
    }, // Иконки можно кастомизировать
    whale: {
      name: "Тунг Тунг Тунг Саур",
      cost: 5000,
      income: 10,
      currency: "coin",
      maxLevel: 30,
      costIncrease: 1.2,
      rarity: "rare",
      imageUrl: "./img/tuntun.png",
    },
    shark: {
      name: "Бобрито Мафиито",
      cost: 25000,
      income: 25,
      currency: "coin",
      maxLevel: 20,
      costIncrease: 1.25,
      rarity: "epic",
      imageUrl: "./img/bobrito.png",
    },
    submarine: {
      name: "Асасино Капучино",
      cost: 75000,
      income: 60,
      currency: "coin",
      maxLevel: 15,
      costIncrease: 1.3,
      rarity: "epic",
      imageUrl: "./img/assassini.png",
    },
    fleet: {
      name: "???",
      cost: 250000,
      income: 150,
      currency: "coin",
      maxLevel: 10,
      costIncrease: 1.35,
      rarity: "legendary",
      imageUrl: "./img/assassini.png",
    },
  },
  upgrades: {
    powerTap: {
      name: "Сила Тапа",
      cost: 500,
      effect: 1,
      currency: "coin",
      maxLevel: 10,
      rarity: "common",
      costIncrease: 1.5,
      imageUrl: "./img/01.png",
      description: (lvl, effect) => `+${lvl * effect} к базовому урону`,
    },
    criticalChance: {
      name: "Критический шанс",
      cost: 2000,
      effect: 0.01,
      currency: "coin",
      maxLevel: 5,
      rarity: "rare",
      costIncrease: 2,
      imageUrl: "./img/1.png",
      description: (lvl, effect) =>
        `+${(lvl * effect * 100).toFixed(1)}% к шансу крита`,
    },
    oreChance: {
      name: "Удача рудокопа",
      cost: 1500,
      effect: 0.005,
      currency: "coin",
      maxLevel: 10,
      rarity: "rare",
      costIncrease: 1.8,
      imageUrl: "./img/3.png",
      description: (lvl, effect) =>
        `+${(lvl * effect * 100).toFixed(1)}% к шансу руды`,
    },
    energyRegen: {
      name: "Регенерация",
      cost: 20,
      effect: 1,
      currency: "gem",
      maxLevel: 5,
      rarity: "epic",
      costIncrease: 2.5,
      imageUrl: "./img/4.png",
      description: (lvl, effect) => `+${lvl * effect} к регенерации энергии`,
    },
    energyMax: {
      name: "Энергия+",
      cost: 20,
      effect: 25,
      currency: "gem",
      maxLevel: 10,
      rarity: "epic",
      costIncrease: 1.5,
      imageUrl: "./img/5.png",
      description: (lvl, effect) => `+${lvl * effect} к максимуму энергии`,
    },
    incomeMultiplier: {
      name: "Множитель дохода",
      cost: 7500,
      effect: 1.25,
      currency: "coin",
      maxLevel: 5,
      rarity: "legendary",
      costIncrease: 3,
      imageUrl: "./img/2.png",
      description: (lvl, effect) =>
        `x${Math.pow(effect, lvl).toFixed(2)} к доходу помощников`,
    },
  },
  skins: {
    basic: {
      name: "Базовая акула",
      cost: 0,
      costGems: 0,
      costOre: 0,
      multiplier: 1,
      rarity: "common",
      imageUrl: "./img/shark.png",
      description: "Стандартный скин",
    },
    gold: {
      name: "Whater Storm",
      cost: 2000,
      costGems: 0,
      costOre: 0,
      multiplier: 2,
      rarity: "rare",
      imageUrl: "./img/shark09.png",
      description: (mult) => `x${mult} к силе тапа`,
    }, // TODO: Add specific icon paths
    robot: {
      name: "Штормовой Хищник",
      cost: 15000,
      costGems: 0,
      costOre: 0,
      multiplier: 2,
      rarity: "rare",
      imageUrl: "./img/shark_storm.png",
      description: (mult) =>
        `x${mult} к силе тапа. Опасный вид и модные кроссовки.`,
    },
    dragon: {
      name: "Пурпурный Разряд",
      cost: 30000,
      costGems: 5,
      costOre: 0,
      multiplier: 3,
      rarity: "epic",
      imageUrl: "./img/shark03.png",
      description: (mult) =>
        `x${mult} к силе тапа. Добавьте немного электричества в свой образ!`,
    },
    cyber: {
      name: "Скелет-Акула",
      cost: 75000,
      costGems: 0,
      costOre: 0,
      multiplier: 5,
      rarity: "epic",
      imageUrl: "./img/shark06.png",
      description: (mult) =>
        `x${mult} к силе тапа. Этот парень демонстрирует свой внутренний мир (буквально!)`,
    },
    legendary: {
      name: "Подводный Мститель",
      cost: 200000,
      costGems: 10,
      costOre: 0,
      multiplier: 10,
      rarity: "legendary",
      imageUrl: "./img/shark_iron.png",
      description: (mult) =>
        `x${mult} к силе тапа. С этим скином вы станете подводным героем.`,
    },
  },
  lootboxes: {
    common: {
      name: "Common Chest",
      cost: 2000,
      currency: "coin",
      imageUrl: "./img/comon.png",
      rarity: "common",
      description: "Шанс получить обычные и редкие предметы",
      rewards: [
        { type: "coin", min: 1000, max: 2000, chance: 0.6 },
        { type: "gem", min: 1, max: 2, chance: 0.1 },
        { type: "helper", rarity: "common", chance: 0.05 },
      ],
    },
    rare: {
      name: "Rare Chest",
      cost: 7500,
      currency: "coin",
      imageUrl: "./img/rare.png",
      rarity: "rare",
      description: "Шанс получить редкие и эпические предметы",
      rewards: [
        { type: "coin", min: 5000, max: 7500, chance: 0.5 },
        { type: "gem", min: 2, max: 4, chance: 0.2 },
        { type: "helper", rarity: "rare", chance: 0.1 },
        { type: "skin", rarity: "rare", chance: 0.03 },
      ],
    },
    epic: {
      name: "Epic Chest",
      cost: 25000,
      currency: "coin",
      imageUrl: "./img/epic.png",
      rarity: "epic",
      description: "Шанс получить эпические и легендарные предметы",
      rewards: [
        { type: "coin", min: 20000, max: 25000, chance: 0.4 },
        { type: "gem", min: 4, max: 6, chance: 0.3 },
        { type: "helper", rarity: "epic", chance: 0.15 },
        { type: "skin", rarity: "epic", chance: 0.07 },
      ],
    },
    legendary: {
      name: " Legendary Chest",
      cost: 75000,
      currency: "coin",
      imageUrl: "./img/legenda.png",
      rarity: "legendary",
      description: "Высокий шанс на лучшие предметы",
      rewards: [
        { type: "coin", min: 50000, max: 75000, chance: 0.3 },
        { type: "gem", min: 6, max: 10, chance: 0.5 },
        { type: "helper", rarity: "legendary", chance: 0.2 },
        { type: "skin", rarity: "legendary", chance: 0.15 },
      ],
    },
  },
  achievements: {
    // Перемещаем сюда для централизации
    firstTap: {
      name: "Первые шаги",
      description: "Сделайте 100 тапов",
      threshold: 100,
      rewardGems: 5,
      check: (state) => state.totals.taps, // ✅ totals.taps
      threshold: 100,
    },
    richTapper: {
      name: "Богатый тапер",
      description: "Заработайте 10,000 монет",
      threshold: 10000,
      rewardGems: 5,
      check: (state) => state.totals.coins, // ✅ totals.coins
    },
    sharkMaster: {
      name: "Мастер акул",
      description: "Достигните 10 уровня",
      threshold: 10,
      rewardGems: 5,
      check: (state) => state.player.level, // ✅ player.level
    },
    criticalHit: {
      name: "Критический удар",
      description: "Сделайте 10 критических ударов",
      threshold: 10,
      rewardGems: 5,
      trackEvent: "stats:criticalHits",
      check: (state) => state.stats.criticalHits, // ✅ stats.criticalHits
    }, // Добавим отслеживание
    energyMaster: {
      name: "Энергичный",
      description: "Используйте 1000 энергии",
      threshold: 1000,
      rewardGems: 5,
      trackEvent: "stats:energySpent",
      check: (state) => state.stats.energySpent, // ✅ stats.energySpent
    }, // Добавим отслеживание
  },
};
