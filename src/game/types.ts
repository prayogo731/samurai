export type CharacterId = 'kenji' | 'ryu';
export type ArenaId = 'sakura' | 'bamboo' | 'castle';
export type AIDifficulty = 'easy' | 'normal' | 'hard';
export type GameMode = 'ai' | 'pvp_local' | 'pvp_online' | 'training';

export type FighterState = 
  | 'idle'
  | 'walk'
  | 'jump'
  | 'dash'
  | 'light_attack'
  | 'heavy_attack'
  | 'skill'
  | 'block'
  | 'parry'
  | 'hit'
  | 'victory'
  | 'defeat';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  title: string;
  colorTheme: {
    primary: string;
    secondary: string;
    accent: string;
    bladeGlow: string;
  };
  maxHp: number;
  maxStamina: number;
  speed: number;
  jumpForce: number;
  dashSpeed: number;
  attackPower: {
    light: number;
    heavy: number;
    skill: number;
  };
  attackRange: {
    light: number;
    heavy: number;
    skill: number;
  };
  cooldowns: {
    light: number;
    heavy: number;
    skill: number;
  };
  skillName: string;
  skillDescription: string;
  lore: string;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Hitbox extends Box {
  damage: number;
  knockbackX: number;
  knockbackY: number;
  hitStun: number;
  isHeavy: boolean;
  isSkill: boolean;
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'petal' | 'dust' | 'slash_arc' | 'leaf' | 'rain' | 'parry_ring';
  rotation?: number;
  vRot?: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  vy: number;
  alpha: number;
  color: string;
  scale: number;
}

export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
  lightAttack: boolean;
  heavyAttack: boolean;
  block: boolean;
  dash: boolean;
  skill: boolean;
}

export interface NetworkFighterSnapshot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  state: FighterState;
  stateTimer: number;
  hp: number;
  stamina: number;
  animFrame: number;
  lastActionSeq: number;
}

export interface OnlineRoomData {
  id: string;
  createdAt: number;
  lastActivity: number;
  status: 'waiting' | 'ready' | 'starting' | 'playing' | 'round_end' | 'finished';
  hostUid: string;
  arena: ArenaId;
  timer: number;
  round: number;
  score: {
    player1: number;
    player2: number;
  };
  players: {
    player1?: {
      uid: string;
      name: string;
      character: CharacterId;
      ready: boolean;
      connected: boolean;
      state?: NetworkFighterSnapshot;
    };
    player2?: {
      uid: string;
      name: string;
      character: CharacterId;
      ready: boolean;
      connected: boolean;
      state?: NetworkFighterSnapshot;
    };
  };
  lastHitEvent?: {
    attacker: 'player1' | 'player2';
    damage: number;
    type: 'hit' | 'block' | 'parry';
    timestamp: number;
  };
}
