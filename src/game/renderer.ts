import { Fighter } from './fighter.ts';
import { ARENAS, ArenaDef } from './arenas.ts';
import { ArenaId, FighterState } from './types.ts';
import { EffectsManager } from './effects.ts';

export class GameRenderer {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public width: number = 800;
  public height: number = 450;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not get Canvas 2D context');
    this.ctx = context;

    this.resizeCanvas();
  }

  public resizeCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx.imageSmoothingEnabled = false;
  }

  public render(
    p1: Fighter,
    p2: Fighter,
    arenaId: ArenaId,
    effects: EffectsManager,
    matchTimer: number,
    matchPhase: string,
    roundNumber: number,
    p1Score: number,
    p2Score: number
  ) {
    const ctx = this.ctx;
    const arena = ARENAS[arenaId] || ARENAS.sakura;

    ctx.save();

    // Screen Shake
    if (effects.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * effects.screenShake;
      const shakeY = (Math.random() - 0.5) * effects.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Clear Screen
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.width, this.height);

    // 1. Render Arena Background & Parallax
    this.renderArenaBackground(arena);

    // 2. Render Arena Foreground & Floor
    this.renderArenaFloor(arena);

    // 3. Render Fighter Shadows
    this.renderShadow(p1, arena.groundY);
    this.renderShadow(p2, arena.groundY);

    // 4. Render Fighters Pixel Art
    this.renderFighter(p1);
    this.renderFighter(p2);

    // 5. Render Attack Slash Visuals
    this.renderAttackSlashes(p1);
    this.renderAttackSlashes(p2);

    // 6. Render Particles & Floating Damage Texts
    this.renderEffects(effects);

    // Restore shake
    ctx.restore();

    // 7. Render Arcade HUD (HP bars, stamina, timer, round tokens)
    this.renderHUD(p1, p2, matchTimer, roundNumber, p1Score, p2Score);

    // 8. Render Match Phase Overlay Announcements (e.g. "ROUND 1", "FIGHT!", "KO!")
    this.renderPhaseAnnouncements(matchPhase, matchTimer);
  }

  // --- ARENA RENDERING ---
  private renderArenaBackground(arena: ArenaDef) {
    const ctx = this.ctx;

    // Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, arena.groundY);
    skyGrad.addColorStop(0, arena.skyGradient[0]);
    skyGrad.addColorStop(1, arena.skyGradient[1]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, arena.groundY);

    if (arena.id === 'sakura') {
      // Giant Pale Moon
      ctx.fillStyle = 'rgba(254, 243, 199, 0.85)';
      ctx.beginPath();
      ctx.arc(620, 110, 68, 0, Math.PI * 2);
      ctx.fill();

      // Distant Mt. Fuji Silhouette
      ctx.fillStyle = 'rgba(30, 27, 46, 0.7)';
      ctx.beginPath();
      ctx.moveTo(320, arena.groundY);
      ctx.lineTo(470, 140);
      ctx.lineTo(495, 140);
      ctx.lineTo(640, arena.groundY);
      ctx.closePath();
      ctx.fill();

      // Snowcap on mountain
      ctx.fillStyle = 'rgba(241, 245, 249, 0.45)';
      ctx.beginPath();
      ctx.moveTo(435, 175);
      ctx.lineTo(470, 140);
      ctx.lineTo(495, 140);
      ctx.lineTo(528, 175);
      ctx.closePath();
      ctx.fill();

      // Pagoda & Torii Silhouettes
      ctx.fillStyle = '#171324';
      // Torii Gate on left
      ctx.fillRect(70, arena.groundY - 140, 12, 140);
      ctx.fillRect(160, arena.groundY - 140, 12, 140);
      ctx.fillRect(50, arena.groundY - 130, 144, 14); // Crossbeam
      ctx.fillRect(60, arena.groundY - 110, 124, 10);

      // Pagoda silhouette on right
      this.drawPagodaRoof(660, arena.groundY - 90, 110, 16);
      this.drawPagodaRoof(675, arena.groundY - 130, 80, 14);
      this.drawPagodaRoof(690, arena.groundY - 165, 50, 12);

      // Stone Lanterns with glowing flame
      this.drawStoneLantern(240, arena.groundY);
      this.drawStoneLantern(560, arena.groundY);

    } else if (arena.id === 'bamboo') {
      // Crescent Moon
      ctx.fillStyle = 'rgba(209, 250, 229, 0.8)';
      ctx.beginPath();
      ctx.arc(160, 90, 48, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = arena.skyGradient[0];
      ctx.beginPath();
      ctx.arc(175, 84, 44, 0, Math.PI * 2);
      ctx.fill();

      // Misty Bamboo Stalks Background layer
      ctx.fillStyle = 'rgba(6, 78, 59, 0.4)';
      for (let x = 20; x < this.width; x += 38) {
        ctx.fillRect(x, 40, 12, arena.groundY - 40);
        // Stalk notches
        for (let y = 70; y < arena.groundY; y += 45) {
          ctx.fillRect(x - 2, y, 16, 3);
        }
      }

      // Foreground Dark Bamboo Stalks
      ctx.fillStyle = '#064e3b';
      for (let x = 60; x < this.width; x += 110) {
        ctx.fillRect(x, 10, 20, arena.groundY - 10);
        for (let y = 60; y < arena.groundY; y += 50) {
          ctx.fillRect(x - 3, y, 26, 4);
        }
      }

    } else if (arena.id === 'castle') {
      // Blood Moon
      ctx.fillStyle = 'rgba(220, 38, 38, 0.85)';
      ctx.beginPath();
      ctx.arc(400, 110, 80, 0, Math.PI * 2);
      ctx.fill();

      // Castle Rooftop Parapets & Watchtower Silhouettes
      ctx.fillStyle = '#09090b';
      this.drawPagodaRoof(350, arena.groundY - 120, 240, 26);
      this.drawPagodaRoof(380, arena.groundY - 175, 180, 22);
      this.drawPagodaRoof(415, arena.groundY - 220, 110, 18);

      // Distant castle walls & banners
      ctx.fillRect(80, arena.groundY - 180, 160, 180);
      ctx.fillRect(580, arena.groundY - 160, 140, 160);
    }
  }

  private drawPagodaRoof(x: number, y: number, w: number, h: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x - 20, y + h);
    ctx.lineTo(x + w + 20, y + h);
    ctx.lineTo(x + w - 10, y);
    ctx.lineTo(x + 10, y);
    ctx.closePath();
    ctx.fill();
  }

  private drawStoneLantern(x: number, groundY: number) {
    const ctx = this.ctx;
    // Base
    ctx.fillStyle = '#292524';
    ctx.fillRect(x - 12, groundY - 45, 24, 45);
    // Roof
    ctx.fillRect(x - 16, groundY - 55, 32, 10);
    // Glow inside lantern
    ctx.fillStyle = 'rgba(251, 191, 36, 0.8)';
    ctx.fillRect(x - 6, groundY - 38, 12, 14);
  }

  private renderArenaFloor(arena: ArenaDef) {
    const ctx = this.ctx;
    // Floor Slab
    ctx.fillStyle = arena.groundColor;
    ctx.fillRect(0, arena.groundY, this.width, this.height - arena.groundY);

    // Floor edge highlight line
    ctx.fillStyle = '#78716c';
    ctx.fillRect(0, arena.groundY, this.width, 3);

    // Floor stone pavers / tatami planks
    ctx.fillStyle = arena.floorPattern;
    for (let x = 0; x < this.width; x += 40) {
      ctx.fillRect(x, arena.groundY + 3, 2, this.height - arena.groundY);
    }
  }

  private renderShadow(fighter: Fighter, groundY: number) {
    const ctx = this.ctx;
    const shadowWidth = Math.max(16, fighter.width * 1.1 - (groundY - (fighter.y + fighter.height)) * 0.15);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(fighter.x + fighter.width / 2, groundY - 2, shadowWidth / 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- PIXEL-ART SAMURAI RENDERING ---
  private renderFighter(f: Fighter) {
    const ctx = this.ctx;
    const isP1 = f.id === 'player1';
    const char = f.charDef;
    const { x, y, width, height, facing, state, stateTimer, animFrame } = f;

    ctx.save();

    // Invulnerability flashing (e.g. when struck)
    if (f.isInvincible && Math.floor(stateTimer * 30) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Center pivot for flipping
    ctx.translate(x + width / 2, y + height / 2);
    ctx.scale(facing, 1);

    // Bobbing offset for idle breathing
    let bobY = 0;
    if (state === 'idle') {
      bobY = Math.sin(stateTimer * 6) * 2;
    } else if (state === 'walk') {
      bobY = Math.abs(Math.sin(stateTimer * 12)) * 3;
    }

    // Stagger recoil when hit
    if (state === 'hit') {
      ctx.rotate(-0.15);
    } else if (state === 'defeat') {
      bobY += 18; // kneeling down
      ctx.rotate(-0.1);
    }

    const px = -width / 2;
    const py = -height / 2 + bobY;

    // --- LEGS & FEET (Hakama pants / sandals) ---
    ctx.fillStyle = char.colorTheme.primary;
    if (state === 'walk') {
      const legCycle = Math.sin(stateTimer * 12);
      ctx.fillRect(px + 10 + legCycle * 6, py + 48, 10, 24);
      ctx.fillRect(px + 24 - legCycle * 6, py + 48, 10, 24);
    } else if (state === 'jump') {
      // Tucked legs
      ctx.fillRect(px + 10, py + 46, 11, 18);
      ctx.fillRect(px + 23, py + 44, 11, 18);
    } else {
      // Standing / Stance
      ctx.fillRect(px + 8, py + 48, 12, 24);
      ctx.fillRect(px + 24, py + 48, 12, 24);
    }

    // Wooden sandals (Geta)
    ctx.fillStyle = '#b45309';
    ctx.fillRect(px + 6, py + 70, 14, 4);
    ctx.fillRect(px + 24, py + 70, 14, 4);

    // --- TORSO & KIMONO / HAORI ---
    ctx.fillStyle = char.colorTheme.primary;
    ctx.fillRect(px + 8, py + 22, 28, 28);

    // Kimono Lapel / Sash
    ctx.fillStyle = char.colorTheme.secondary;
    // Cross collar
    ctx.beginPath();
    ctx.moveTo(px + 16, py + 22);
    ctx.lineTo(px + 22, py + 34);
    ctx.lineTo(px + 28, py + 22);
    ctx.lineTo(px + 32, py + 22);
    ctx.lineTo(px + 22, py + 38);
    ctx.lineTo(px + 12, py + 22);
    ctx.closePath();
    ctx.fill();

    // Obi (Waist Sash)
    ctx.fillStyle = char.colorTheme.accent;
    ctx.fillRect(px + 10, py + 42, 24, 6);

    // Flowing Scarf / Haori tails (waving in the wind)
    const scarfWave = Math.sin(stateTimer * 8) * 4;
    ctx.fillStyle = char.colorTheme.secondary;
    ctx.beginPath();
    ctx.moveTo(px + 8, py + 24);
    ctx.quadraticCurveTo(px - 14, py + 28 + scarfWave, px - 22, py + 38 + scarfWave);
    ctx.lineTo(px - 18, py + 44 + scarfWave);
    ctx.quadraticCurveTo(px - 10, py + 34 + scarfWave, px + 8, py + 32);
    ctx.closePath();
    ctx.fill();

    // --- HEAD, FACE & HAIR/HELMET ---
    // Neck & Face (Skin tone)
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(px + 15, py + 10, 14, 12);

    // Samurai Eye & Eyebrow
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(px + 22, py + 14, 4, 2); // Fierce eye
    ctx.fillStyle = '#451a03';
    ctx.fillRect(px + 21, py + 12, 6, 2); // Eyebrow

    if (char.id === 'kenji') {
      // Kenji: Black spiky hair with Golden Headband (Hachi-gane)
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(px + 12, py + 4, 20, 8);
      // Spikes behind
      ctx.fillRect(px + 8, py + 6, 6, 8);
      ctx.fillRect(px + 6, py + 10, 4, 6);
      // Golden Headband plate
      ctx.fillStyle = '#facc15';
      ctx.fillRect(px + 16, py + 8, 12, 4);
    } else {
      // Ryu: Traditional Ronin Straw Hat (Kasa) / Topknot
      ctx.fillStyle = '#d97706'; // Woven bamboo straw
      ctx.beginPath();
      ctx.moveTo(px + 2, py + 10);
      ctx.lineTo(px + 22, py + 2);
      ctx.lineTo(px + 42, py + 10);
      ctx.closePath();
      ctx.fill();
      // Hat rim shadow
      ctx.fillStyle = '#78350f';
      ctx.fillRect(px + 4, py + 9, 36, 2);
    }

    // --- ARMS & KATANA STANCE ---
    this.renderFighterArmsAndKatana(ctx, px, py, f, char);

    ctx.restore();
  }

  private renderFighterArmsAndKatana(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    f: Fighter,
    char: typeof f.charDef
  ) {
    const { state, stateTimer } = f;

    ctx.save();

    if (state === 'idle') {
      // Left arm resting on katana scabbard at hip
      ctx.fillStyle = char.colorTheme.primary;
      ctx.fillRect(px + 6, py + 26, 8, 16);
      // Hand on scabbard
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(px + 10, py + 40, 5, 5);

      // Katana at waist (Scabbard - Saya)
      ctx.fillStyle = '#18181b';
      ctx.fillRect(px - 14, py + 38, 30, 4);
      // Golden Hilt (Tsuka) & Handguard (Tsuba)
      ctx.fillStyle = char.colorTheme.accent;
      ctx.fillRect(px + 16, py + 37, 3, 6); // Tsuba
      ctx.fillRect(px + 19, py + 38, 10, 4); // Tsuka

    } else if (state === 'walk') {
      // Arms swinging slightly
      ctx.fillStyle = char.colorTheme.primary;
      ctx.fillRect(px + 8, py + 26, 8, 16);
      ctx.fillStyle = '#18181b';
      ctx.fillRect(px - 12, py + 38, 28, 4);
      ctx.fillStyle = char.colorTheme.accent;
      ctx.fillRect(px + 16, py + 37, 3, 6);

    } else if (state === 'block') {
      // Guard Stance: Both arms forward, blade held angled vertically
      ctx.fillStyle = char.colorTheme.primary;
      ctx.fillRect(px + 18, py + 24, 16, 8);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(px + 32, py + 24, 6, 6);

      // Katana held in defense
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(px + 34, py + 4, 4, 38);
      ctx.fillStyle = char.colorTheme.accent;
      ctx.fillRect(px + 32, py + 28, 8, 3); // Tsuba

      // Defensive Blue / Gold energy sheen around katana
      ctx.fillStyle = f.parryWindowTimer > 0 ? 'rgba(250, 204, 21, 0.45)' : 'rgba(56, 189, 248, 0.35)';
      ctx.fillRect(px + 30, py + 2, 12, 42);

    } else if (state === 'light_attack') {
      // Quick horizontal slashing strike
      ctx.fillStyle = char.colorTheme.primary;
      ctx.fillRect(px + 20, py + 24, 22, 8); // Arm extended forward
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(px + 40, py + 24, 6, 6);

      // Katana Blade pointing forward
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(px + 46, py + 25, 42, 4);
      ctx.fillStyle = char.colorTheme.accent;
      ctx.fillRect(px + 44, py + 23, 3, 8);

    } else if (state === 'heavy_attack') {
      // Two-handed overhead high-impact swing
      if (stateTimer < 0.2) {
        // Raised overhead
        ctx.fillStyle = char.colorTheme.primary;
        ctx.fillRect(px + 14, py + 12, 10, 16);
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(px + 15, py + 6, 6, 6);
        // Katana pointing high up
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(px + 16, py - 36, 5, 42);
        ctx.fillStyle = char.colorTheme.accent;
        ctx.fillRect(px + 14, py + 4, 9, 3);
      } else {
        // Smashed down to ground
        ctx.fillStyle = char.colorTheme.primary;
        ctx.fillRect(px + 24, py + 26, 18, 10);
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(px + 40, py + 34, 6, 6);
        // Blade angled down forward
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(px + 42, py + 38, 48, 5);
        ctx.fillStyle = char.colorTheme.accent;
        ctx.fillRect(px + 40, py + 36, 4, 8);
      }

    } else if (state === 'skill') {
      // Full speed dash thrust
      ctx.fillStyle = char.colorTheme.primary;
      ctx.fillRect(px + 22, py + 22, 28, 8);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(px + 48, py + 22, 6, 6);
      // Glowing Extended Katana
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(px + 54, py + 23, 62, 5);
      ctx.fillStyle = char.colorTheme.bladeGlow;
      ctx.fillRect(px + 52, py + 21, 66, 9);

    } else if (state === 'victory') {
      // Blood flick & Sheathing pose (Noto)
      ctx.fillStyle = char.colorTheme.primary;
      ctx.fillRect(px + 12, py + 24, 12, 12);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(px + 14, py + 36, 6, 6);
      // Katana clicked into saya
      ctx.fillStyle = '#18181b';
      ctx.fillRect(px - 14, py + 38, 30, 4);
      ctx.fillStyle = char.colorTheme.accent;
      ctx.fillRect(px + 16, py + 36, 4, 8);

    } else if (state === 'defeat') {
      // Fallen samurai
      ctx.fillStyle = '#18181b';
      // Katana stuck vertically into ground
      ctx.fillRect(px + 42, py + 28, 4, 46);
      ctx.fillStyle = char.colorTheme.accent;
      ctx.fillRect(px + 40, py + 28, 8, 3);
    } else {
      // Default
      ctx.fillStyle = char.colorTheme.primary;
      ctx.fillRect(px + 8, py + 26, 8, 16);
    }

    ctx.restore();
  }

  // --- ATTACK SLASH VISUAL TRAILS ---
  private renderAttackSlashes(f: Fighter) {
    const ctx = this.ctx;
    const { x, y, width, height, facing, state, stateTimer, charDef } = f;

    if (state === 'light_attack' && stateTimer >= 0.05 && stateTimer <= 0.22) {
      // Clean crescent white-glow slash
      ctx.save();
      const slashX = facing === 1 ? x + width + 10 : x - 30;
      const slashY = y + height / 2 - 10;
      
      ctx.strokeStyle = charDef.colorTheme.bladeGlow;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(slashX, slashY, 38, -Math.PI * 0.45, Math.PI * 0.45, facing === -1);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(slashX, slashY, 38, -Math.PI * 0.45, Math.PI * 0.45, facing === -1);
      ctx.stroke();
      ctx.restore();
    }

    if (state === 'heavy_attack' && stateTimer >= 0.16 && stateTimer <= 0.38) {
      // Giant descending fiery / lightning cleave arc
      ctx.save();
      const slashX = facing === 1 ? x + width + 15 : x - 40;
      const slashY = y + height / 2;

      ctx.strokeStyle = charDef.colorTheme.bladeGlow;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.arc(slashX, slashY, 52, -Math.PI * 0.5, Math.PI * 0.5, facing === -1);
      ctx.stroke();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(slashX, slashY, 52, -Math.PI * 0.5, Math.PI * 0.5, facing === -1);
      ctx.stroke();
      ctx.restore();
    }

    if (state === 'skill' && stateTimer >= 0.08 && stateTimer <= 0.50) {
      // Blazing multi-blade stream
      ctx.save();
      const trailWidth = 80;
      const startX = facing === 1 ? x - 40 : x + width + 40;
      const endX = facing === 1 ? x + width + 60 : x - 60;

      const grad = ctx.createLinearGradient(startX, y, endX, y);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.5, charDef.colorTheme.bladeGlow);
      grad.addColorStop(1, '#ffffff');

      ctx.fillStyle = grad;
      ctx.fillRect(Math.min(startX, endX), y + 16, trailWidth, 24);
      ctx.restore();
    }
  }

  // --- PARTICLES & FLOATING DAMAGE TEXTS ---
  private renderEffects(effects: EffectsManager) {
    const ctx = this.ctx;

    // Particles
    for (const p of effects.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'parry_ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + (p.life / p.maxLife) * 2), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'petal') {
        ctx.translate(p.x, p.y);
        if (p.rotation !== undefined) ctx.rotate(p.rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'leaf') {
        ctx.translate(p.x, p.y);
        if (p.rotation !== undefined) ctx.rotate(p.rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'rain') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 1.5, p.y + p.vy * 1.5);
        ctx.stroke();
      } else {
        // Sparks / Dust
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      ctx.restore();
    }

    // Floating text
    for (const ft of effects.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 13px "Press Start 2P", monospace';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  // --- ARCADE HUD ---
  private renderHUD(
    p1: Fighter,
    p2: Fighter,
    matchTimer: number,
    roundNumber: number,
    p1Score: number,
    p2Score: number
  ) {
    const ctx = this.ctx;
    const hudY = 16;
    const barWidth = 280;
    const barHeight = 18;

    // --- P1 HEALTH BAR (Left to right) ---
    // Background frame
    ctx.fillStyle = '#18181b';
    ctx.fillRect(40, hudY, barWidth, barHeight);
    // Red Damage underlay
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(40, hudY, barWidth, barHeight);
    // Actual HP Green/Gold fill
    const p1HpRatio = Math.max(0, p1.hp / p1.maxHp);
    const p1HpColor = p1HpRatio > 0.4 ? '#22c55e' : (p1HpRatio > 0.2 ? '#eab308' : '#ef4444');
    ctx.fillStyle = p1HpColor;
    ctx.fillRect(40 + barWidth * (1 - p1HpRatio), hudY, barWidth * p1HpRatio, barHeight);

    // P1 Golden Border
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(40, hudY, barWidth, barHeight);

    // P1 Stamina Bar (Cyan/Teal)
    const p1StamRatio = Math.max(0, p1.stamina / p1.maxStamina);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, hudY + barHeight + 4, barWidth, 6);
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(40 + barWidth * (1 - p1StamRatio), hudY + barHeight + 4, barWidth * p1StamRatio, 6);

    // P1 Name & Japanese Kanji Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillText(`${p1.charDef.name}`, 40, hudY - 4);

    // P1 Win Tokens (Round dots)
    for (let r = 0; r < 2; r++) {
      ctx.fillStyle = r < p1Score ? '#eab308' : '#3f3f46';
      ctx.beginPath();
      ctx.arc(330 - r * 16, hudY + barHeight + 18, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // --- P2 HEALTH BAR (Right to left) ---
    const p2BarX = this.width - 40 - barWidth;
    ctx.fillStyle = '#18181b';
    ctx.fillRect(p2BarX, hudY, barWidth, barHeight);
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(p2BarX, hudY, barWidth, barHeight);
    const p2HpRatio = Math.max(0, p2.hp / p2.maxHp);
    const p2HpColor = p2HpRatio > 0.4 ? '#22c55e' : (p2HpRatio > 0.2 ? '#eab308' : '#ef4444');
    ctx.fillStyle = p2HpColor;
    ctx.fillRect(p2BarX, hudY, barWidth * p2HpRatio, barHeight);

    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(p2BarX, hudY, barWidth, barHeight);

    // P2 Stamina Bar
    const p2StamRatio = Math.max(0, p2.stamina / p2.maxStamina);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(p2BarX, hudY + barHeight + 4, barWidth, 6);
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(p2BarX, hudY + barHeight + 4, barWidth * p2StamRatio, 6);

    // P2 Name
    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px "Press Start 2P", monospace';
    const p2Name = p2.isAi ? `${p2.charDef.name} [CPU]` : p2.charDef.name;
    const nameWidth = ctx.measureText(p2Name).width;
    ctx.fillText(p2Name, this.width - 40 - nameWidth, hudY - 4);

    // P2 Win Tokens
    for (let r = 0; r < 2; r++) {
      ctx.fillStyle = r < p2Score ? '#eab308' : '#3f3f46';
      ctx.beginPath();
      ctx.arc(p2BarX + r * 16, hudY + barHeight + 18, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // --- ARCADE TIMER IN CENTER ---
    ctx.fillStyle = '#09090b';
    ctx.fillRect(this.width / 2 - 28, hudY - 4, 56, 36);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.width / 2 - 28, hudY - 4, 56, 36);

    ctx.fillStyle = matchTimer <= 15 ? '#ef4444' : '#facc15';
    ctx.font = 'bold 20px "Press Start 2P", monospace';
    const timerText = `${Math.ceil(matchTimer)}`;
    const textW = ctx.measureText(timerText).width;
    ctx.fillText(timerText, this.width / 2 - textW / 2, hudY + 22);
  }

  // --- ANNOUNCEMENT OVERLAYS ---
  private renderPhaseAnnouncements(phase: string, timer: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 14;

    if (phase === 'countdown') {
      ctx.font = 'bold 36px "Press Start 2P", monospace';
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#ea580c';
      ctx.fillText('DUEL BEGINS!', this.width / 2, this.height / 2 - 30);
    } else if (phase === 'round_over' || phase === 'finished') {
      ctx.font = 'bold 44px "Press Start 2P", monospace';
      ctx.fillStyle = '#dc2626';
      ctx.shadowColor = '#000000';
      ctx.fillText('IPPON! (一本)', this.width / 2, this.height / 2 - 30);
    }

    ctx.restore();
  }
}
