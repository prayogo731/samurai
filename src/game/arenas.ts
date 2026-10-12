import { ArenaId } from './types.ts';

export interface ArenaDef {
  id: ArenaId;
  name: string;
  kanji: string;
  description: string;
  groundY: number;
  skyGradient: [string, string];
  groundColor: string;
  floorPattern: string;
  ambientParticle: 'petal' | 'leaf' | 'rain';
  particleCount: number;
}

export const ARENAS: Record<ArenaId, ArenaDef> = {
  sakura: {
    id: 'sakura',
    name: 'Sakura Village',
    kanji: '桜の里',
    description: 'Ancient peaceful village at dusk where cherry blossom petals dance in the mountain breeze.',
    groundY: 340,
    skyGradient: ['#1e1026', '#4a154b'],
    groundColor: '#1c1917',
    floorPattern: '#292524',
    ambientParticle: 'petal',
    particleCount: 28,
  },
  bamboo: {
    id: 'bamboo',
    name: 'Bamboo Forest',
    kanji: '竹林の道',
    description: 'Serene bamboo thicket shrouded in emerald mist under the watchful crescent moon.',
    groundY: 340,
    skyGradient: ['#06241a', '#0d4a36'],
    groundColor: '#142a1f',
    floorPattern: '#1f3f30',
    ambientParticle: 'leaf',
    particleCount: 24,
  },
  castle: {
    id: 'castle',
    name: 'Moonlit Castle',
    kanji: '月下の城',
    description: 'Feudal castle rooftop battleground drenched in the ominous crimson light of a blood moon.',
    groundY: 340,
    skyGradient: ['#0f0514', '#2d0a1e'],
    groundColor: '#18181b',
    floorPattern: '#27272a',
    ambientParticle: 'rain',
    particleCount: 45,
  },
};
