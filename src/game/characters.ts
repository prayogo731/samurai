import { CharacterDef, CharacterId } from './types.ts';

export const CHARACTERS: Record<CharacterId, CharacterDef> = {
  kenji: {
    id: 'kenji',
    name: 'KENJI',
    title: 'The Crimson Gale (紅の疾風)',
    colorTheme: {
      primary: '#1c1917',   // dark charcoal kimono
      secondary: '#dc2626', // crimson red haori/scarf
      accent: '#facc15',    // golden hilt & eyes
      bladeGlow: '#ef4444', // fiery red blade trail
    },
    maxHp: 100,
    maxStamina: 100,
    speed: 4.8,
    jumpForce: 13.5,
    dashSpeed: 10.5,
    attackPower: {
      light: 8,
      heavy: 18,
      skill: 28,
    },
    attackRange: {
      light: 74,
      heavy: 84,
      skill: 125,
    },
    cooldowns: {
      light: 0.28,
      heavy: 0.55,
      skill: 4.0,
    },
    skillName: 'Dragon Gale (竜風斬)',
    skillDescription: 'Dash swiftly forward slicing through defense with burning gale-force blade.',
    lore: 'A masterless ronin wandering across Edo provinces. Known for blindingly swift iaido strikes and unwavering bushido discipline.',
  },
  ryu: {
    id: 'ryu',
    name: 'RYU',
    title: 'The Azure Fortress (蒼穹の城壁)',
    colorTheme: {
      primary: '#1e3a8a',   // deep indigo hakama
      secondary: '#f8fafc', // white sash & crest
      accent: '#38bdf8',    // electric cyan
      bladeGlow: '#06b6d4', // lightning blue blade trail
    },
    maxHp: 115,
    maxStamina: 110,
    speed: 4.0,
    jumpForce: 12.8,
    dashSpeed: 9.0,
    attackPower: {
      light: 10,
      heavy: 22,
      skill: 32,
    },
    attackRange: {
      light: 86,
      heavy: 98,
      skill: 140,
    },
    cooldowns: {
      light: 0.35,
      heavy: 0.68,
      skill: 5.0,
    },
    skillName: 'Thunder Stance (雷光撃)',
    skillDescription: 'Focuses thunderous chi into a long-reach crushing cleave that shatters poise.',
    lore: 'An elite castle guard trained in ancient Daisho-ryu. Uses greater katana reach and resolute counter-attacks to break foes.',
  },
};
