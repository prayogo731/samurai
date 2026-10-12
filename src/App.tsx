import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  CharacterId, 
  ArenaId, 
  AIDifficulty, 
  GameMode, 
  InputState, 
  OnlineRoomData 
} from './game/types.ts';
import { CHARACTERS } from './game/characters.ts';
import { ARENAS } from './game/arenas.ts';
import { Fighter } from './game/fighter.ts';
import { GameRenderer } from './game/renderer.ts';
import { EffectsManager } from './game/effects.ts';
import { SamuraiAI } from './game/ai.ts';
import { sounds } from './game/audio.ts';
import { multiplayer } from './game/multiplayer.ts';
import { isFirebaseConfigured } from './game/firebase-config.ts';
import { VirtualControls } from './components/VirtualControls.tsx';
import { CharacterPreviewCanvas } from './components/CharacterPreviewCanvas.tsx';
import { FirebaseModal } from './components/FirebaseModal.tsx';
import { RulesModal } from './components/RulesModal.tsx';
import confetti from 'canvas-confetti';
import { 
  Swords, 
  Bot, 
  Globe, 
  User, 
  Settings, 
  Volume2, 
  VolumeX, 
  Music,
  Music2,
  RotateCcw, 
  Home, 
  Copy, 
  Check, 
  Play, 
  ShieldAlert, 
  Sparkles,
  Smartphone,
  ChevronLeft
} from 'lucide-react';

type Screen = 'title' | 'mode_select' | 'char_select' | 'multiplayer_menu' | 'online_lobby' | 'battle' | 'settings';

export default function App() {
  // Screens & Navigation
  const [currentScreen, setCurrentScreen] = useState<Screen>('title');
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('normal');
  
  // Selections
  const [selectedCharP1, setSelectedCharP1] = useState<CharacterId>('kenji');
  const [selectedCharP2, setSelectedCharP2] = useState<CharacterId>('ryu');
  const [selectedArena, setSelectedArena] = useState<ArenaId>('sakura');

  // Audio & Controls toggles
  const [isMuted, setIsMuted] = useState<boolean>(sounds.getMuted());
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(sounds.getMusicMuted());
  const [showTouchControls, setShowTouchControls] = useState<boolean>(false);
  const [previewStance, setPreviewStance] = useState<'idle' | 'attack' | 'victory'>('idle');

  // Modals
  const [showFirebaseModal, setShowFirebaseModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  // Multiplayer State
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [currentRoomCode, setCurrentRoomCode] = useState<string>('');
  const [multiplayerStatus, setMultiplayerStatus] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [myReady, setMyReady] = useState<boolean>(false);
  const [roomData, setRoomData] = useState<OnlineRoomData | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Match State
  const [matchTimer, setMatchTimer] = useState<number>(99);
  const [matchPhase, setMatchPhase] = useState<'countdown' | 'playing' | 'round_over' | 'finished'>('playing');
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [p1Score, setP1Score] = useState<number>(0);
  const [p2Score, setP2Score] = useState<number>(0);
  const [winnerMessage, setWinnerMessage] = useState<string>('');

  // Refs for Game Engine
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<GameRenderer | null>(null);
  const effectsRef = useRef<EffectsManager>(new EffectsManager());
  const aiRef = useRef<SamuraiAI>(new SamuraiAI('normal'));
  
  const p1Ref = useRef<Fighter>(new Fighter('player1', 'kenji', 180, 1));
  const p2Ref = useRef<Fighter>(new Fighter('player2', 'ryu', 580, -1));

  // Current inputs
  const p1InputRef = useRef<InputState>({
    left: false, right: false, jump: false,
    lightAttack: false, heavyAttack: false, block: false, dash: false, skill: false
  });
  const p2InputRef = useRef<InputState>({
    left: false, right: false, jump: false,
    lightAttack: false, heavyAttack: false, block: false, dash: false, skill: false
  });

  // Track keydown latch to prevent auto-repeating attack triggers on key hold
  const activeKeys = useRef<Set<string>>(new Set());
  const animFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const matchPhaseRef = useRef<'countdown' | 'playing' | 'round_over' | 'finished'>('playing');
  const matchTimerRef = useRef<number>(99);
  const roundWinsRef = useRef<{ p1: number; p2: number }>({ p1: 0, p2: 0 });

  // Auto-detect mobile devices for touch controls
  useEffect(() => {
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isMobile) {
      setShowTouchControls(true);
    }
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      const key = e.code;
      const isRepeat = activeKeys.current.has(key);
      activeKeys.current.add(key);

      // Player 1 controls
      if (key === 'KeyA') p1InputRef.current.left = true;
      if (key === 'KeyD') p1InputRef.current.right = true;
      if (key === 'KeyW') p1InputRef.current.jump = true;
      if (key === 'KeyL') p1InputRef.current.block = true;
      
      // Single action triggers (only if not repeating)
      if (!isRepeat) {
        if (key === 'KeyJ') p1InputRef.current.lightAttack = true;
        if (key === 'KeyK') p1InputRef.current.heavyAttack = true;
        if (key === 'KeyU') p1InputRef.current.skill = true;
        if (key === 'Space') p1InputRef.current.dash = true;
      }

      // Player 2 local PvP controls (Arrow keys + Numpad / keys)
      if (gameMode === 'pvp_local') {
        if (key === 'ArrowLeft') p2InputRef.current.left = true;
        if (key === 'ArrowRight') p2InputRef.current.right = true;
        if (key === 'ArrowUp') p2InputRef.current.jump = true;
        if (key === 'Numpad3' || key === 'KeyM') p2InputRef.current.block = true;

        if (!isRepeat) {
          if (key === 'Numpad1' || key === 'KeyB') p2InputRef.current.lightAttack = true;
          if (key === 'Numpad2' || key === 'KeyN') p2InputRef.current.heavyAttack = true;
          if (key === 'Numpad5' || key === 'KeyH') p2InputRef.current.skill = true;
          if (key === 'Numpad0' || key === 'KeyV') p2InputRef.current.dash = true;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      const key = e.code;
      activeKeys.current.delete(key);

      // P1 key releases
      if (key === 'KeyA') p1InputRef.current.left = false;
      if (key === 'KeyD') p1InputRef.current.right = false;
      if (key === 'KeyW') p1InputRef.current.jump = false;
      if (key === 'KeyL') p1InputRef.current.block = false;
      if (key === 'KeyJ') p1InputRef.current.lightAttack = false;
      if (key === 'KeyK') p1InputRef.current.heavyAttack = false;
      if (key === 'KeyU') p1InputRef.current.skill = false;
      if (key === 'Space') p1InputRef.current.dash = false;

      // P2 key releases
      if (gameMode === 'pvp_local') {
        if (key === 'ArrowLeft') p2InputRef.current.left = false;
        if (key === 'ArrowRight') p2InputRef.current.right = false;
        if (key === 'ArrowUp') p2InputRef.current.jump = false;
        if (key === 'Numpad3' || key === 'KeyM') p2InputRef.current.block = false;
        if (key === 'Numpad1' || key === 'KeyB') p2InputRef.current.lightAttack = false;
        if (key === 'Numpad2' || key === 'KeyN') p2InputRef.current.heavyAttack = false;
        if (key === 'Numpad5' || key === 'KeyH') p2InputRef.current.skill = false;
        if (key === 'Numpad0' || key === 'KeyV') p2InputRef.current.dash = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameMode]);

  // Virtual touch input handler
  const handleVirtualInput = useCallback((key: keyof InputState, value: boolean) => {
    p1InputRef.current[key] = value;
  }, []);

  // Initialize Canvas Renderer when Entering Battle
  useEffect(() => {
    if (currentScreen === 'battle' && canvasRef.current) {
      rendererRef.current = new GameRenderer(canvasRef.current);
    }
  }, [currentScreen]);

  // Reset Match State
  const resetRound = useCallback((round: number) => {
    p1Ref.current.reset(180, 1);
    p2Ref.current.reset(580, -1);
    effectsRef.current.clear();
    setMatchTimer(99);
    matchTimerRef.current = 99;
    setMatchPhase('countdown');
    matchPhaseRef.current = 'countdown';
    setRoundNumber(round);
    sounds.playGong();

    setTimeout(() => {
      setMatchPhase('playing');
      matchPhaseRef.current = 'playing';
    }, 1200);
  }, []);

  const startNewMatch = useCallback((mode: GameMode) => {
    setGameMode(mode);
    p1Ref.current.setCharacter(selectedCharP1);
    p2Ref.current.setCharacter(selectedCharP2);
    p2Ref.current.isAi = mode === 'ai';
    aiRef.current.setDifficulty(aiDifficulty);

    setP1Score(0);
    setP2Score(0);
    roundWinsRef.current = { p1: 0, p2: 0 };
    setWinnerMessage('');

    setCurrentScreen('battle');
    resetRound(1);
  }, [selectedCharP1, selectedCharP2, aiDifficulty, resetRound]);

  // Main Game Loop
  useEffect(() => {
    if (currentScreen !== 'battle') {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const gameLoop = (now: number) => {
      // Calculate delta time in seconds, capped to 0.05s (prevents crazy teleporting on lag/tab out)
      const rawDt = (now - lastTimeRef.current) / 1000;
      const dt = Math.min(rawDt, 0.05);
      lastTimeRef.current = now;

      const p1 = p1Ref.current;
      const p2 = p2Ref.current;
      const effects = effectsRef.current;
      const renderer = rendererRef.current;

      // 1. Ambient Particles
      if (Math.random() < 0.25) {
        effects.spawnAmbientParticle(800, ARENAS[selectedArena].ambientParticle);
      }
      effects.update(dt);

      // 2. Timer Update during active fight
      if (matchPhaseRef.current === 'playing') {
        matchTimerRef.current -= dt;
        if (matchTimerRef.current <= 0) {
          matchTimerRef.current = 0;
          // Time over! Determine winner by highest HP
          handleRoundEnd(p1.hp > p2.hp ? 'player1' : (p2.hp > p1.hp ? 'player2' : 'draw'));
        }
        setMatchTimer(matchTimerRef.current);
      }

      // 3. AI Controller Update
      let currentP2Input = p2InputRef.current;
      if (gameMode === 'ai' && matchPhaseRef.current === 'playing') {
        currentP2Input = aiRef.current.update(dt, p2, p1);
      }

      // 4. Update Fighters
      p1.update(dt, p1InputRef.current, 800);
      p2.update(dt, currentP2Input, 800);

      // Single-frame input reset for attacks/dash
      p1InputRef.current.lightAttack = false;
      p1InputRef.current.heavyAttack = false;
      p1InputRef.current.dash = false;
      p1InputRef.current.skill = false;

      if (gameMode === 'pvp_local') {
        p2InputRef.current.lightAttack = false;
        p2InputRef.current.heavyAttack = false;
        p2InputRef.current.dash = false;
        p2InputRef.current.skill = false;
      }

      // 5. Multiplayer Network Synchronization
      if (gameMode === 'pvp_online' && multiplayer.currentRoomId) {
        if (isHost) {
          multiplayer.sendFighterState(p1.getSnapshot());
        } else {
          multiplayer.sendFighterState(p2.getSnapshot());
        }
      }

      // 6. Combat Collision Detection (Hitbox vs Hurtbox)
      if (matchPhaseRef.current === 'playing') {
        // P1 attacking P2
        const p1Hitbox = p1.getHitbox();
        if (p1Hitbox && !p1.hasDealtDamage) {
          const p2Hurtbox = p2.getHurtbox();
          if (checkCollision(p1Hitbox, p2Hurtbox)) {
            p1.hasDealtDamage = true;
            const outcome = p2.takeHit(p1Hitbox);
            handleHitOutcome('player1', p2, p1Hitbox, outcome);
          }
        }

        // P2 attacking P1
        const p2Hitbox = p2.getHitbox();
        if (p2Hitbox && !p2.hasDealtDamage) {
          const p1Hurtbox = p1.getHurtbox();
          if (checkCollision(p2Hitbox, p1Hurtbox)) {
            p2.hasDealtDamage = true;
            const outcome = p1.takeHit(p2Hitbox);
            handleHitOutcome('player2', p1, p2Hitbox, outcome);
          }
        }

        // Check KO
        if (p1.hp <= 0 && p2.hp <= 0) {
          handleRoundEnd('draw');
        } else if (p1.hp <= 0) {
          p1.state = 'defeat';
          p2.state = 'victory';
          handleRoundEnd('player2');
        } else if (p2.hp <= 0) {
          p2.state = 'defeat';
          p1.state = 'victory';
          handleRoundEnd('player1');
        }
      }

      // 7. Render Game
      if (renderer) {
        renderer.render(
          p1,
          p2,
          selectedArena,
          effects,
          matchTimerRef.current,
          matchPhaseRef.current,
          roundNumber,
          roundWinsRef.current.p1,
          roundWinsRef.current.p2
        );
      }

      animFrameId.current = requestAnimationFrame(gameLoop);
    };

    animFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [currentScreen, gameMode, selectedArena, isHost]);

  // Collision Helper (AABB)
  const checkCollision = (box1: { x: number; y: number; width: number; height: number }, box2: { x: number; y: number; width: number; height: number }) => {
    return (
      box1.x < box2.x + box2.width &&
      box1.x + box1.width > box2.x &&
      box1.y < box2.y + box2.height &&
      box1.y + box1.height > box2.y
    );
  };

  // Handle hit outcomes (Sparks, blood, sounds, floating damage text)
  const handleHitOutcome = (attacker: 'player1' | 'player2', defender: Fighter, hitbox: any, outcome: 'hit' | 'block' | 'parry' | 'invincible') => {
    const effects = effectsRef.current;
    const hitX = defender.x + defender.width / 2;
    const hitY = defender.y + defender.height / 2;

    if (outcome === 'parry') {
      effects.spawnParryRing(hitX, hitY);
      // Attacker gets staggered into stun
      const attackerFighter = attacker === 'player1' ? p1Ref.current : p2Ref.current;
      attackerFighter.state = 'hit';
      attackerFighter.hitStunTimer = 0.45;
      attackerFighter.vx = -attackerFighter.facing * 5;
    } else if (outcome === 'block') {
      effects.spawnSparks(hitX, hitY, '#38bdf8', 10);
      effects.addFloatingText('BLOCKED', hitX, hitY - 20, '#38bdf8', 0.9);
      effects.triggerScreenShake(3);
    } else if (outcome === 'hit') {
      effects.spawnBlood(hitX, hitY, hitbox.knockbackX > 0 ? 1 : -1, hitbox.isHeavy ? 24 : 14);
      effects.spawnSparks(hitX, hitY, '#f87171', 12);
      effects.addFloatingText(`-${hitbox.damage}`, hitX, hitY - 24, hitbox.isHeavy ? '#ef4444' : '#f87171', hitbox.isHeavy ? 1.4 : 1.0);
      effects.triggerScreenShake(hitbox.isHeavy ? 12 : 5);
    }
  };

  // Handle Round / Match Ends
  const handleRoundEnd = (winner: 'player1' | 'player2' | 'draw') => {
    if (matchPhaseRef.current !== 'playing') return;
    matchPhaseRef.current = 'round_over';
    setMatchPhase('round_over');

    if (winner === 'player1') {
      roundWinsRef.current.p1++;
      setP1Score(roundWinsRef.current.p1);
    } else if (winner === 'player2') {
      roundWinsRef.current.p2++;
      setP2Score(roundWinsRef.current.p2);
    }

    // Check Match Win (First to 2 wins)
    if (roundWinsRef.current.p1 >= 2 || roundWinsRef.current.p2 >= 2) {
      setTimeout(() => {
        matchPhaseRef.current = 'finished';
        setMatchPhase('finished');
        const matchWinnerName = roundWinsRef.current.p1 >= 2 ? p1Ref.current.charDef.name : p2Ref.current.charDef.name;
        setWinnerMessage(`${matchWinnerName} WINS THE DUEL!`);
        sounds.playGong();
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }, 1800);
    } else {
      // Next Round
      setTimeout(() => {
        resetRound(roundNumber + 1);
      }, 2400);
    }
  };

  // Multiplayer Online callbacks
  useEffect(() => {
    multiplayer.onRoomUpdate = (data) => {
      setRoomData(data);
      if (data.status === 'playing' && currentScreen !== 'battle') {
        setSelectedCharP1(data.players.player1?.character || 'kenji');
        setSelectedCharP2(data.players.player2?.character || 'ryu');
        setSelectedArena(data.arena || 'sakura');
        startNewMatch('pvp_online');
      }

      // Opponent state sync
      if (currentScreen === 'battle') {
        if (isHost && data.players.player2?.state) {
          p2Ref.current.applySnapshot(data.players.player2.state);
        } else if (!isHost && data.players.player1?.state) {
          p1Ref.current.applySnapshot(data.players.player1.state);
        }
      }
    };

    multiplayer.onError = (err) => {
      setMultiplayerStatus(`Error: ${err}`);
    };

    multiplayer.onOpponentDisconnected = () => {
      setMultiplayerStatus('Opponent disconnected from duel.');
      effectsRef.current.addFloatingText('OPPONENT LEFT', 400, 200, '#ef4444', 1.5);
    };

    return () => {
      multiplayer.onRoomUpdate = null;
      multiplayer.onError = null;
      multiplayer.onOpponentDisconnected = null;
    };
  }, [currentScreen, isHost, startNewMatch]);

  // Create Room Flow
  const handleCreateRoom = async () => {
    try {
      setMultiplayerStatus('Creating room...');
      const code = await multiplayer.createRoom(selectedCharP1, selectedArena);
      setCurrentRoomCode(code);
      setIsHost(true);
      setMyReady(false);
      setCurrentScreen('online_lobby');
      setMultiplayerStatus(`Room created! Share code: ${code}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMultiplayerStatus(msg);
      if (!isFirebaseConfigured()) {
        setShowFirebaseModal(true);
      }
    }
  };

  // Join Room Flow
  const handleJoinRoom = async () => {
    if (!roomCodeInput.trim()) {
      setMultiplayerStatus('Please enter a room code');
      return;
    }
    try {
      setMultiplayerStatus('Joining room...');
      await multiplayer.joinRoom(roomCodeInput, selectedCharP2);
      setCurrentRoomCode(roomCodeInput.toUpperCase());
      setIsHost(false);
      setMyReady(false);
      setCurrentScreen('online_lobby');
      setMultiplayerStatus('Joined room! Waiting for ready check.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMultiplayerStatus(msg);
      if (!isFirebaseConfigured()) {
        setShowFirebaseModal(true);
      }
    }
  };

  const handleToggleReady = async () => {
    const nextReady = !myReady;
    setMyReady(nextReady);
    await multiplayer.setReady(nextReady);
  };

  const handleStartOnlineMatch = async () => {
    if (!isHost) return;
    await multiplayer.startMatch();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentRoomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLeaveLobby = () => {
    multiplayer.leaveRoom();
    setCurrentRoomCode('');
    setRoomData(null);
    setCurrentScreen('title');
  };

  // Manage background music tracks across screens
  useEffect(() => {
    if (currentScreen === 'battle') {
      sounds.playMusic('battle');
    } else {
      sounds.playMusic('menu');
    }
  }, [currentScreen]);

  // Unlock Web Audio context on user gesture if browser blocked autoplay
  useEffect(() => {
    const handleGesture = () => {
      if (currentScreen === 'battle') {
        sounds.playMusic('battle');
      } else {
        sounds.playMusic('menu');
      }
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
    window.addEventListener('pointerdown', handleGesture);
    window.addEventListener('keydown', handleGesture);
    return () => {
      window.removeEventListener('pointerdown', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
  }, [currentScreen]);

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const toggleMusic = () => {
    const musicActive = sounds.toggleMusic();
    setIsMusicMuted(!musicActive);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black flex flex-col justify-center items-center select-none font-sans">
      {/* ======================================================== */}
      {/* 1. TITLE SCREEN                                          */}
      {/* ======================================================== */}
      {currentScreen === 'title' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-radial from-neutral-900 via-neutral-950 to-black">
          {/* Kanji Japanese watermark banner */}
          <div className="absolute top-12 text-center pointer-events-none opacity-20">
            <span className="font-kanji text-8xl md:text-9xl tracking-widest text-red-500">
              侍 決 闘
            </span>
          </div>

          <div className="z-10 text-center max-w-xl animate-fade-in">
            {/* Title */}
            <div className="inline-block relative mb-2">
              <h1 className="font-feudal text-5xl md:text-7xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-400 to-amber-700 drop-shadow-[0_4px_16px_rgba(217,119,6,0.6)]">
                SAMURAI DUEL
              </h1>
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-red-600 to-transparent mt-1" />
            </div>

            <p className="font-pixel text-xs md:text-sm tracking-widest text-red-500 mb-8 mt-2 drop-shadow">
              ONE BLADE. ONE HONOR. ONE WINNER.
            </p>

            {/* Menu Buttons */}
            <div className="flex flex-col gap-3.5 w-full max-w-xs mx-auto">
              <button
                onClick={() => {
                  sounds.playUiClick();
                  setGameMode('ai');
                  setCurrentScreen('char_select');
                }}
                className="group relative px-6 py-3.5 bg-gradient-to-r from-red-950 via-neutral-900 to-red-950 border-2 border-red-700/80 hover:border-amber-400 rounded-lg text-white font-pixel text-xs tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-3 cursor-pointer"
              >
                <Bot className="w-5 h-5 text-red-500 group-hover:text-amber-400 transition-colors" />
                <span>VS COMPUTER</span>
              </button>

              <button
                onClick={() => {
                  sounds.playUiClick();
                  setGameMode('pvp_local');
                  setCurrentScreen('char_select');
                }}
                className="group relative px-6 py-3.5 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-900 border-2 border-neutral-700 hover:border-amber-400 rounded-lg text-white font-pixel text-xs tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-3 cursor-pointer"
              >
                <Swords className="w-5 h-5 text-amber-500 group-hover:text-amber-400 transition-colors" />
                <span>LOCAL 2-PLAYER</span>
              </button>

              <button
                onClick={() => {
                  sounds.playUiClick();
                  setCurrentScreen('multiplayer_menu');
                }}
                className="group relative px-6 py-3.5 bg-gradient-to-r from-blue-950 via-neutral-900 to-blue-950 border-2 border-blue-700/80 hover:border-cyan-400 rounded-lg text-white font-pixel text-xs tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-3 cursor-pointer"
              >
                <Globe className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                <span>ONLINE DUEL</span>
              </button>

              <button
                onClick={() => {
                  sounds.playUiClick();
                  setCurrentScreen('settings');
                }}
                className="px-6 py-3 bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-lg text-neutral-400 hover:text-white font-pixel text-[10px] tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>SETTINGS & RULES</span>
              </button>
            </div>
          </div>

          {/* Quick Sound / Music / Setup Toggles at bottom */}
          <div className="absolute bottom-5 flex flex-wrap justify-center items-center gap-4 text-xs font-pixel text-neutral-500">
            <button
              onClick={toggleSound}
              className="flex items-center gap-1.5 hover:text-white p-2 cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              <span>{isMuted ? 'SFX MUTED' : 'SFX ON'}</span>
            </button>
            <button
              onClick={toggleMusic}
              className="flex items-center gap-1.5 hover:text-white p-2 cursor-pointer"
            >
              {isMusicMuted ? <Music className="w-4 h-4 text-neutral-600" /> : <Music2 className="w-4 h-4 text-cyan-400 animate-pulse" />}
              <span>{isMusicMuted ? 'BGM OFF' : '8-BIT BGM'}</span>
            </button>
            <button
              onClick={() => setShowFirebaseModal(true)}
              className="flex items-center gap-1.5 hover:text-amber-400 p-2 cursor-pointer"
            >
              <span className={`w-2 h-2 rounded-full ${isFirebaseConfigured() ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>{isFirebaseConfigured() ? 'FIREBASE READY' : 'CONFIG FIREBASE'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. CHARACTER & ARENA SELECT SCREEN                       */}
      {/* ======================================================== */}
      {currentScreen === 'char_select' && (
        <div className="relative w-full h-full flex flex-col items-center justify-between p-6 bg-neutral-950 overflow-y-auto">
          {/* Header */}
          <div className="w-full max-w-4xl flex items-center justify-between border-b border-neutral-800 pb-4">
            <button
              onClick={() => {
                sounds.playUiClick();
                setCurrentScreen('title');
              }}
              className="flex items-center gap-2 text-neutral-400 hover:text-white font-pixel text-xs cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>MAIN MENU</span>
            </button>
            <h2 className="font-feudal text-2xl md:text-3xl font-bold text-amber-400 tracking-wider">
              CHOOSE YOUR WARRIOR
            </h2>
            <div className="w-20" />
          </div>

          {/* Characters Grid */}
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            {(['kenji', 'ryu'] as CharacterId[]).map((cId) => {
              const char = CHARACTERS[cId];
              const isSelectedP1 = selectedCharP1 === cId;
              const isSelectedP2 = selectedCharP2 === cId;

              return (
                <div
                  key={cId}
                  onClick={() => {
                    sounds.playUiClick();
                    if (gameMode === 'ai' || gameMode === 'pvp_online') {
                      setSelectedCharP1(cId);
                      setSelectedCharP2(cId === 'kenji' ? 'ryu' : 'kenji');
                    } else {
                      // Toggle
                      setSelectedCharP1(cId);
                    }
                  }}
                  className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelectedP1
                      ? 'border-amber-400 bg-neutral-900/90 shadow-[0_0_25px_rgba(251,191,36,0.25)] scale-[1.02]'
                      : 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-600'
                  }`}
                >
                  {/* Character Name & Japanese Title */}
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-feudal text-2xl font-bold text-white tracking-wider">
                        {char.name}
                      </h3>
                      <p className="text-xs text-amber-500 font-serif italic">
                        {char.title}
                      </p>
                    </div>
                    {isSelectedP1 && (
                      <span className="px-2.5 py-1 bg-amber-500 text-black font-pixel text-[9px] rounded font-bold shadow">
                        P1 SELECTED
                      </span>
                    )}
                  </div>

                  {/* Animated Pixel-Art Character Preview Sprite */}
                  <div className="w-full flex flex-col items-center justify-center mb-3 bg-neutral-950/80 rounded-xl p-2 border border-neutral-800/90 shadow-inner">
                    <CharacterPreviewCanvas
                      characterId={cId}
                      isSelected={isSelectedP1}
                      stance={isSelectedP1 ? previewStance : 'idle'}
                      width={180}
                      height={200}
                    />
                    
                    {/* Stance animation preview toggles */}
                    <div className="flex items-center justify-center gap-1.5 mt-1 pt-1 border-t border-neutral-900 w-full">
                      <span className="text-[8px] font-pixel text-neutral-500 mr-1">STANCE:</span>
                      {(['idle', 'attack', 'victory'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sounds.playUiClick();
                            setPreviewStance(st);
                          }}
                          className={`px-2 py-0.5 rounded text-[8px] font-pixel uppercase cursor-pointer transition-all ${
                            (isSelectedP1 ? previewStance : 'idle') === st
                              ? 'bg-amber-500 text-black font-bold shadow'
                              : 'bg-neutral-800/90 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {st === 'idle' ? 'BERDIRI' : st === 'attack' ? 'TEBASAN' : 'MENANG'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lore */}
                  <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                    {char.lore}
                  </p>

                  {/* Stats Bar */}
                  <div className="space-y-2 text-xs font-mono mb-4 bg-neutral-950/60 p-3 rounded-lg border border-neutral-800/80">
                    <div>
                      <div className="flex justify-between text-neutral-400 text-[10px] mb-0.5">
                        <span>VITALITY (HP)</span>
                        <span className="text-white">{char.maxHp}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(char.maxHp / 120) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-neutral-400 text-[10px] mb-0.5">
                        <span>ATTACK POWER</span>
                        <span className="text-white">Heavy: {char.attackPower.heavy}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full"
                          style={{ width: `${(char.attackPower.heavy / 25) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-neutral-400 text-[10px] mb-0.5">
                        <span>KATANA REACH</span>
                        <span className="text-white">{char.attackRange.heavy} px</span>
                      </div>
                      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(char.attackRange.heavy / 100) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-neutral-400 text-[10px] mb-0.5">
                        <span>AGILITY / SPEED</span>
                        <span className="text-white">{char.speed}</span>
                      </div>
                      <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${(char.speed / 5.5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Special Skill Callout */}
                  <div className="p-2.5 bg-purple-950/40 border border-purple-800/50 rounded text-xs">
                    <span className="font-pixel text-[10px] text-purple-300 block mb-1">
                      TECHNIQUE: {char.skillName}
                    </span>
                    <span className="text-neutral-400 text-[11px]">
                      {char.skillDescription}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Arena & AI Difficulty Selector */}
          <div className="w-full max-w-4xl flex flex-wrap gap-4 justify-between items-center bg-neutral-900/60 p-4 rounded-xl border border-neutral-800">
            {/* Arena */}
            <div className="flex items-center gap-3">
              <span className="font-pixel text-[10px] text-neutral-400">ARENA:</span>
              <div className="flex gap-2">
                {(['sakura', 'bamboo', 'castle'] as ArenaId[]).map((aId) => (
                  <button
                    key={aId}
                    onClick={() => {
                      sounds.playUiClick();
                      setSelectedArena(aId);
                    }}
                    className={`px-3 py-1.5 rounded text-xs font-feudal font-bold cursor-pointer transition-colors ${
                      selectedArena === aId
                        ? 'bg-amber-600 text-black'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {ARENAS[aId].name}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Difficulty if in AI mode */}
            {gameMode === 'ai' && (
              <div className="flex items-center gap-3">
                <span className="font-pixel text-[10px] text-neutral-400">AI DIFFICULTY:</span>
                <div className="flex gap-2">
                  {(['easy', 'normal', 'hard'] as AIDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      onClick={() => {
                        sounds.playUiClick();
                        setAiDifficulty(diff);
                      }}
                      className={`px-2.5 py-1 rounded text-[10px] font-pixel uppercase cursor-pointer transition-colors ${
                        aiDifficulty === diff
                          ? 'bg-red-600 text-white font-bold'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ready to Fight Button */}
            <button
              onClick={() => {
                sounds.playUiClick();
                startNewMatch(gameMode);
              }}
              className="px-8 py-3 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-black font-pixel text-xs tracking-wider font-bold rounded-lg shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>START DUEL</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. ONLINE MULTIPLAYER MENU                               */}
      {/* ======================================================== */}
      {currentScreen === 'multiplayer_menu' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-neutral-950">
          <div className="w-full max-w-md bg-neutral-900 border-2 border-neutral-700 rounded-2xl p-6 shadow-2xl text-center">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800">
              <button
                onClick={() => {
                  sounds.playUiClick();
                  setCurrentScreen('title');
                }}
                className="text-neutral-400 hover:text-white font-pixel text-xs flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>BACK</span>
              </button>
              <h2 className="font-feudal text-xl font-bold text-cyan-400">
                ONLINE 1 VS 1 DUEL
              </h2>
              <div className="w-12" />
            </div>

            {/* Firebase Status Badge */}
            <div className="mb-6">
              <button
                onClick={() => setShowFirebaseModal(true)}
                className={`w-full p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer ${
                  isFirebaseConfigured()
                    ? 'bg-emerald-950/40 border-emerald-600 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-600 text-amber-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isFirebaseConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{isFirebaseConfigured() ? 'Firebase Online Connected' : 'Firebase Belum Dikonfigurasi'}</span>
                </span>
                <span className="underline font-pixel text-[9px]">Settings</span>
              </button>
            </div>

            {/* Create Room */}
            <div className="space-y-4">
              <button
                onClick={handleCreateRoom}
                className="w-full py-4 bg-gradient-to-r from-red-900 via-neutral-900 to-red-900 hover:border-amber-400 border-2 border-red-700 rounded-xl text-white font-pixel text-xs tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                CREATE ROOM (HOST)
              </button>

              <div className="flex items-center gap-2 text-neutral-600 my-2">
                <div className="h-px bg-neutral-800 flex-1" />
                <span className="font-pixel text-[9px]">OR</span>
                <div className="h-px bg-neutral-800 flex-1" />
              </div>

              {/* Join Room */}
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={5}
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="ROOM CODE"
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl p-3 text-center text-white font-pixel text-sm tracking-widest uppercase focus:border-cyan-400 outline-none"
                />
                <button
                  onClick={handleJoinRoom}
                  className="px-6 py-3 bg-cyan-700 hover:bg-cyan-600 active:bg-cyan-800 text-white font-pixel text-xs rounded-xl shadow cursor-pointer"
                >
                  JOIN
                </button>
              </div>

              {multiplayerStatus && (
                <p className="text-xs text-amber-400 mt-2 font-mono">
                  {multiplayerStatus}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. ONLINE MATCH LOBBY                                    */}
      {/* ======================================================== */}
      {currentScreen === 'online_lobby' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-neutral-950">
          <div className="w-full max-w-lg bg-neutral-900 border-2 border-amber-600 rounded-2xl p-6 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
              <span className="font-pixel text-[10px] text-amber-400">
                {isHost ? 'HOST ROOM' : 'GUEST PLAYER'}
              </span>
              <button
                onClick={handleLeaveLobby}
                className="text-xs text-red-400 hover:text-red-300 font-pixel cursor-pointer"
              >
                LEAVE ROOM
              </button>
            </div>

            {/* Room Code Display */}
            <div className="text-center p-4 bg-neutral-950 border border-neutral-800 rounded-xl mb-6">
              <span className="text-[10px] text-neutral-400 font-pixel block mb-1">ROOM CODE</span>
              <div className="flex items-center justify-center gap-3">
                <span className="font-pixel text-3xl md:text-4xl text-amber-400 tracking-widest font-bold">
                  {currentRoomCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-300 cursor-pointer"
                  title="Copy code"
                >
                  {copiedCode ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[11px] text-neutral-400 mt-2">
                Share this 5-letter code with your opponent on another device.
              </p>
            </div>

            {/* Players Status Slots */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Player 1 */}
              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl text-center">
                <span className="text-[9px] font-pixel text-neutral-400 block mb-1">PLAYER 1 (HOST)</span>
                <span className="font-feudal text-lg font-bold text-white block">
                  {roomData?.players.player1 ? roomData.players.player1.character.toUpperCase() : 'Waiting...'}
                </span>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-pixel ${
                  roomData?.players.player1?.ready ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {roomData?.players.player1?.ready ? 'READY' : 'NOT READY'}
                </span>
              </div>

              {/* Player 2 */}
              <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-xl text-center">
                <span className="text-[9px] font-pixel text-neutral-400 block mb-1">PLAYER 2 (GUEST)</span>
                <span className="font-feudal text-lg font-bold text-white block">
                  {roomData?.players.player2 ? roomData.players.player2.character.toUpperCase() : 'Empty Slot'}
                </span>
                <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[9px] font-pixel ${
                  roomData?.players.player2?.ready ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {roomData?.players.player2?.ready ? 'READY' : 'WAITING...'}
                </span>
              </div>
            </div>

            {/* Ready & Start Duel Controls */}
            <div className="space-y-3">
              <button
                onClick={handleToggleReady}
                className={`w-full py-3.5 rounded-xl font-pixel text-xs tracking-wider font-bold transition-all cursor-pointer ${
                  myReady
                    ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
              >
                {myReady ? 'YOU ARE READY (CLICK TO UNREADY)' : 'CLICK WHEN READY'}
              </button>

              {isHost && (
                <button
                  disabled={!roomData?.players.player1?.ready || !roomData?.players.player2?.ready}
                  onClick={handleStartOnlineMatch}
                  className={`w-full py-3.5 rounded-xl font-pixel text-xs tracking-wider font-bold transition-all ${
                    roomData?.players.player1?.ready && roomData?.players.player2?.ready
                      ? 'bg-gradient-to-r from-red-600 to-amber-500 text-black shadow-lg cursor-pointer hover:scale-102'
                      : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                  }`}
                >
                  START ONLINE DUEL
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. IN-GAME BATTLE VIEW (CANVAS + HUD + CONTROLS)         */}
      {/* ======================================================== */}
      {currentScreen === 'battle' && (
        <div className="relative w-full h-full flex flex-col justify-center items-center bg-black overflow-hidden">
          {/* Top In-Game Quick Action bar */}
          <div className="absolute top-2 left-4 right-4 flex justify-between items-center z-30 pointer-events-auto">
            <button
              onClick={() => {
                sounds.playUiClick();
                setCurrentScreen('title');
              }}
              className="px-2.5 py-1 bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-700 rounded text-[10px] font-pixel text-neutral-300 flex items-center gap-1 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>

            {/* Quick sound toggle, music toggle & Touch control toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowTouchControls((prev) => !prev)}
                className={`px-2.5 py-1 border rounded text-[10px] font-pixel flex items-center gap-1 cursor-pointer ${
                  showTouchControls ? 'bg-amber-950/80 border-amber-500 text-amber-300' : 'bg-neutral-900/80 border-neutral-700 text-neutral-400'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>TOUCH</span>
              </button>
              <button
                onClick={toggleMusic}
                title="Toggle 8-bit Music"
                className="px-2.5 py-1 bg-neutral-900/80 border border-neutral-700 rounded text-[10px] font-pixel text-neutral-300 flex items-center gap-1 cursor-pointer"
              >
                {isMusicMuted ? <Music className="w-3.5 h-3.5 text-neutral-500" /> : <Music2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
              </button>
              <button
                onClick={toggleSound}
                title="Toggle Sound Effects"
                className="px-2.5 py-1 bg-neutral-900/80 border border-neutral-700 rounded text-[10px] font-pixel text-neutral-300 flex items-center gap-1 cursor-pointer"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            </div>
          </div>

          {/* Canvas Viewport Container with Crisp Retro Scaling */}
          <div className="relative w-full h-full max-w-[1000px] max-h-[562px] aspect-[16/9] flex items-center justify-center">
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain pixelated shadow-2xl"
              style={{ imageRendering: 'pixelated' }}
            />
            
            {/* Scanlines Overlay */}
            <div className="absolute inset-0 scanlines pointer-events-none" />
            <div className="absolute inset-0 vintage-vignette pointer-events-none" />
          </div>

          {/* Virtual Controls for Mobile / Touch screens */}
          {showTouchControls && (
            <VirtualControls
              inputState={p1InputRef.current}
              onInputChange={handleVirtualInput}
            />
          )}

          {/* Match Victory / Defeat Modal Overlay */}
          {matchPhase === 'finished' && (
            <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center p-6 animate-fade-in">
              <div className="bg-neutral-900 border-2 border-amber-500 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
                <span className="font-kanji text-5xl text-amber-500 block mb-2">
                  勝 負 決
                </span>
                <h3 className="font-feudal text-2xl font-extrabold text-amber-400 tracking-wider mb-2">
                  {winnerMessage}
                </h3>
                <p className="font-pixel text-[10px] text-neutral-400 mb-6">
                  {p1Score > p2Score ? 'HONOR AND VICTORY ARE YOURS.' : 'TRAIN HARDER, RONIN.'}
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      sounds.playUiClick();
                      setP1Score(0);
                      setP2Score(0);
                      roundWinsRef.current = { p1: 0, p2: 0 };
                      resetRound(1);
                    }}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-black font-pixel text-xs font-bold rounded-lg cursor-pointer shadow active:scale-95"
                  >
                    REMATCH
                  </button>
                  <button
                    onClick={() => {
                      sounds.playUiClick();
                      setCurrentScreen('title');
                    }}
                    className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-pixel text-xs rounded-lg cursor-pointer"
                  >
                    RETURN TO MENU
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. SETTINGS & HOW TO PLAY SCREEN                         */}
      {/* ======================================================== */}
      {currentScreen === 'settings' && (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-neutral-950 overflow-y-auto">
          <div className="w-full max-w-2xl bg-neutral-900 border-2 border-neutral-700 rounded-2xl p-6 shadow-2xl text-neutral-200">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-3 mb-4">
              <button
                onClick={() => {
                  sounds.playUiClick();
                  setCurrentScreen('title');
                }}
                className="text-neutral-400 hover:text-white font-pixel text-xs flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>BACK</span>
              </button>
              <h2 className="font-feudal text-xl font-bold text-amber-400">
                GAME CONTROLS & SETTINGS
              </h2>
              <div className="w-12" />
            </div>

            {/* Keyboard Controls Table */}
            <div className="mb-6">
              <h3 className="font-pixel text-xs text-amber-400 mb-2">KEYBOARD CONTROLS (PLAYER 1):</h3>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-neutral-950 p-3 rounded-lg border border-neutral-800">
                <div><span className="text-amber-300 font-bold">A / D</span>: Gerak Kiri / Kanan</div>
                <div><span className="text-amber-300 font-bold">W</span>: Lompat</div>
                <div><span className="text-amber-300 font-bold">J</span>: Serangan Ringan (Light)</div>
                <div><span className="text-amber-300 font-bold">K</span>: Serangan Berat (Heavy)</div>
                <div><span className="text-amber-300 font-bold">L</span>: Block / Parry (160ms sweet spot)</div>
                <div><span className="text-amber-300 font-bold">Space</span>: Dash / Menghindar</div>
                <div><span className="text-amber-300 font-bold">U</span>: Special Skill</div>
              </div>
            </div>

            {/* Audio & 8-Bit Pixel Music Settings */}
            <div className="mb-6 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
              <h3 className="font-pixel text-xs text-amber-400 mb-3 flex items-center gap-2">
                <Music className="w-4 h-4 text-cyan-400" />
                <span>8-BIT CHIPTUNE & AUDIO SETTINGS:</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <button
                  type="button"
                  onClick={toggleMusic}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                    !isMusicMuted
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    <span>Pixel BGM Music</span>
                  </span>
                  <span className="font-pixel text-[10px] font-bold">{!isMusicMuted ? 'PLAYING' : 'MUTED'}</span>
                </button>
                <button
                  type="button"
                  onClick={toggleSound}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                    !isMuted
                      ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                      : 'bg-neutral-900 border-neutral-700 text-neutral-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    <span>Katana SFX Sounds</span>
                  </span>
                  <span className="font-pixel text-[10px] font-bold">{!isMuted ? 'ENABLED' : 'MUTED'}</span>
                </button>
              </div>
              <p className="text-[11px] text-neutral-400 mt-2.5 leading-relaxed">
                • <strong>Menu BGM</strong>: &quot;Way of the Ronin&quot; (Japanese Hirajoshi Pentatonic Chiptune)<br />
                • <strong>Battle BGM</strong>: &quot;Duel of Honor&quot; (140 BPM Fast Arcade Chiptune Clash)
              </p>
            </div>

            {/* Combat System Guide */}
            <div className="mb-6 bg-neutral-950/70 p-3.5 rounded-lg border border-neutral-800 text-xs text-neutral-300 space-y-1.5 leading-relaxed">
              <h3 className="font-pixel text-[11px] text-red-400">PANDUAN BUSHIDO COMBAT:</h3>
              <p>• <strong>Parry</strong>: Tekan Block tepat saat pedang lawan mendekat (jendela 160ms pertama). Parry sempurna membatalkan damage, memulihkan stamina, dan men-stagger lawan!</p>
              <p>• <strong>Guard Break</strong>: Menahan Block terlalu lama menyerap stamina. Jika stamina habis saat menahan serangan berat, pertahanan Anda pecah!</p>
              <p>• <strong>Dash Invulnerability</strong>: Dash memberikan frame kebal singkat untuk menembus serangan lawan.</p>
            </div>

            {/* Buttons for Firebase Config & Rules */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setShowFirebaseModal(true)}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-amber-300 rounded-lg font-semibold text-xs border border-neutral-600 cursor-pointer flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span>Konfigurasi Firebase Console</span>
              </button>
              <button
                onClick={() => setShowRulesModal(true)}
                className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded-lg font-semibold text-xs border border-neutral-600 cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                <span>Realtime Database Rules</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODALS                                                */}
      {/* ======================================================== */}
      <FirebaseModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
        onOpenRules={() => {
          setShowFirebaseModal(false);
          setShowRulesModal(true);
        }}
      />
      <RulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />
    </div>
  );
}
