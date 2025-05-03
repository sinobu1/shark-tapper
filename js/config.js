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
      name: "Дельфин",
      cost: 500,
      income: 20,
      currency: "coin",
      costIncrease: 1.15,
      rarity: "common",
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/u2.png?raw=true",
    },
    orca: {
      name: "Косатка",
      cost: 1500,
      income: 50,
      currency: "coin",
      costIncrease: 1.2,
      rarity: "rare",
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/u2.png?raw=true",
    }, // Иконки можно кастомизировать
    whale: {
      name: "Кит",
      cost: 5000,
      income: 100,
      currency: "coin",
      costIncrease: 1.25,
      rarity: "rare",
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/u2.png?raw=true",
    },
    shark: {
      name: "Акула",
      cost: 15000,
      income: 200,
      currency: "coin",
      costIncrease: 1.3,
      rarity: "epic",
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/u2.png?raw=true",
    },
    submarine: {
      name: "Подлодка",
      cost: 50000,
      income: 500,
      currency: "coin",
      costIncrease: 1.35,
      rarity: "epic",
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/u2.png?raw=true",
    },
    fleet: {
      name: "Флот",
      cost: 150000,
      income: 1000,
      currency: "coin",
      costIncrease: 1.4,
      rarity: "legendary",
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/u2.png?raw=true",
    },
  },
  upgrades: {
    powerTap: {
      name: "Сила Тапа",
      cost: 2000,
      effect: 1,
      currency: "coin",
      maxLevel: 10,
      rarity: "common",
      costIncrease: 1.5,
      icon: "fa-fist-raised",
      description: (lvl, effect) => `+${lvl * effect} к базовому урону`,
    },
    criticalChance: {
      name: "Критический шанс",
      cost: 5000,
      effect: 0.01,
      currency: "coin",
      maxLevel: 5,
      rarity: "rare",
      costIncrease: 2,
      icon: "fa-bolt",
      description: (lvl, effect) =>
        `+${(lvl * effect * 100).toFixed(1)}% к шансу крита`,
    },
    oreChance: {
      name: "Удача рудокопа",
      cost: 3000,
      effect: 0.005,
      currency: "coin",
      maxLevel: 10,
      rarity: "rare",
      costIncrease: 1.8,
      icon: "fa-gem",
      description: (lvl, effect) =>
        `+${(lvl * effect * 100).toFixed(1)}% к шансу руды`,
    },
    energyRegen: {
      name: "Регенерация",
      cost: 10,
      effect: 1,
      currency: "gem",
      maxLevel: 5,
      rarity: "epic",
      costIncrease: 2.5,
      icon: "fa-battery-three-quarters",
      description: (lvl, effect) => `+${lvl * effect} к регенерации энергии`,
    },
    energyMax: {
      name: "Энергия+",
      cost: 5,
      effect: 50,
      currency: "gem",
      maxLevel: 10,
      rarity: "epic",
      costIncrease: 1.5,
      icon: "fa-battery-full",
      description: (lvl, effect) => `+${lvl * effect} к максимуму энергии`,
    },
    incomeMultiplier: {
      name: "Множитель дохода",
      cost: 10000,
      effect: 1.2,
      currency: "coin",
      maxLevel: 5,
      rarity: "legendary",
      costIncrease: 3,
      icon: "fa-chart-line",
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
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/shark.png?raw=true",
      description: "Стандартный NFT скин",
    },
    gold: {
      name: "Whater Storm",
      cost: 100,
      costGems: 0,
      costOre: 0,
      multiplier: 1.5,
      rarity: "rare",
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/shark_whoterstorm.png?raw=true",
      description: (mult) => `x${mult} к силе тапа`,
    }, // TODO: Add specific icon paths
    robot: {
      name: "SAKURA",
      cost: 10000,
      costGems: 0,
      costOre: 0,
      multiplier: 2,
      rarity: "rare",
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/shark_sakura.png?raw=true",
      description: (mult) => `x${mult} к силе тапа`,
    },
    dragon: {
      name: "Акула-дракон",
      cost: 20000,
      costGems: 10,
      costOre: 0,
      multiplier: 3,
      rarity: "epic",
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/shark_darkside.png?raw=true",
      description: (mult) => `x${mult} к силе тапа`,
    },
    cyber: {
      name: "Кибер-акула",
      cost: 50000,
      costGems: 0,
      costOre: 0,
      multiplier: 5,
      rarity: "epic",
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/shark_qr.png?raw=true",
      description: (mult) => `x${mult} к силе тапа`,
    },
    legendary: {
      name: "Легендарная акула",
      cost: 100000,
      costGems: 10,
      costOre: 0,
      multiplier: 10,
      rarity: "legendary",
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/shark_storm.png?raw=true",
      description: (mult) => `x${mult} к силе тапа`,
    },
  },
  lootboxes: {
    common: {
      name: "Обычный лутбокс",
      cost: 5000,
      currency: "coin",
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/sunduk.png?raw=true",
      rarity: "common",
      description: "Шанс получить обычные и редкие предметы",
      rewards: [
        { type: "coin", min: 1000, max: 5000, chance: 0.6 },
        { type: "gem", min: 1, max: 3, chance: 0.3 },
        { type: "helper", rarity: "common", chance: 0.1 },
      ],
    },
    rare: {
      name: "Редкий лутбокс",
      cost: 15000,
      currency: "coin",
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/sunduk.png?raw=true",
      rarity: "rare",
      description: "Шанс получить редкие и эпические предметы",
      rewards: [
        { type: "coin", min: 5000, max: 15000, chance: 0.5 },
        { type: "gem", min: 3, max: 5, chance: 0.3 },
        { type: "helper", rarity: "rare", chance: 0.15 },
        { type: "skin", rarity: "rare", chance: 0.05 },
      ],
    },
    epic: {
      name: "Эпический лутбокс",
      cost: 50000,
      currency: "coin",
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/sunduk.png?raw=true",
      rarity: "epic",
      description: "Шанс получить эпические и легендарные предметы",
      rewards: [
        { type: "coin", min: 15000, max: 50000, chance: 0.4 },
        { type: "gem", min: 5, max: 10, chance: 0.3 },
        { type: "helper", rarity: "epic", chance: 0.2 },
        { type: "skin", rarity: "epic", chance: 0.1 },
      ],
    },
    legendary: {
      name: "Легендарный лутбокс",
      cost: 150000,
      currency: "coin",
      imageUrl: "https://github.com/sinobu1/shark-tapper/blob/main/sunduk.png?raw=true",
      rarity: "legendary",
      description: "Высокий шанс на лучшие предметы",
      rewards: [
        { type: "coin", min: 50000, max: 150000, chance: 0.3 },
        { type: "gem", min: 10, max: 20, chance: 0.2 },
        { type: "helper", rarity: "legendary", chance: 0.3 },
        { type: "skin", rarity: "legendary", chance: 0.2 },
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
