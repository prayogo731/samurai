import React, { useEffect, useRef } from 'react';
import { CharacterId } from '../game/types.ts';
import { CHARACTERS } from '../game/characters.ts';

interface CharacterPreviewCanvasProps {
  characterId: CharacterId;
  width?: number;
  height?: number;
  isSelected?: boolean;
  stance?: 'idle' | 'attack' | 'victory';
}

export const CharacterPreviewCanvas: React.FC<CharacterPreviewCanvasProps> = ({
  characterId,
  width = 180,
  height = 220,
  isSelected = false,
  stance = 'idle',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false;

    let animFrame: number;
    let startTime = performance.now();

    // Floating particles (sakura for kenji, lightning sparks for ryu)
    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[] = [];
    for (let i = 0; i < 12; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 0.5 + Math.random() * 0.8,
        size: 2 + Math.random() * 3,
        alpha: 0.2 + Math.random() * 0.6,
        color: characterId === 'kenji' ? '#f472b6' : '#38bdf8',
      });
    }

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // 1. Japanese Circular Crest / Aura Background
      const centerX = width / 2;
      const centerY = height / 2 - 10;
      const radius = 64;

      const radial = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius + 20);
      if (characterId === 'kenji') {
        radial.addColorStop(0, isSelected ? 'rgba(220, 38, 38, 0.45)' : 'rgba(153, 27, 27, 0.25)');
        radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        radial.addColorStop(0, isSelected ? 'rgba(14, 165, 233, 0.45)' : 'rgba(3, 105, 161, 0.25)');
        radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = radial;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 20, 0, Math.PI * 2);
      ctx.fill();

      // Kanji Watermark in center background
      ctx.fillStyle = characterId === 'kenji' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.15)';
      ctx.font = 'bold 80px "Yuji Mai", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(characterId === 'kenji' ? '紅' : '蒼', centerX, centerY);

      // Ring border
      ctx.strokeStyle = characterId === 'kenji' ? 'rgba(220, 38, 38, 0.4)' : 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // 2. Ambient floating particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > height) {
          p.y = -5;
          p.x = Math.random() * width;
        }
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1.0;

      // 3. Wooden Tatami Pedestal / Shadow
      const standY = height - 28;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.ellipse(centerX, standY, 44, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tatami mat
      ctx.fillStyle = '#292524';
      ctx.fillRect(centerX - 48, standY - 2, 96, 6);
      ctx.fillStyle = characterId === 'kenji' ? '#dc2626' : '#0284c7';
      ctx.fillRect(centerX - 48, standY + 3, 96, 2);

      // 4. Character Pixel Sprite Rendering (Enlarged Scale ~2.4x)
      ctx.save();
      ctx.translate(centerX, standY - 8);

      const charDef = CHARACTERS[characterId];
      const bobY = Math.sin(elapsed * 4.5) * 2.5;

      // Stance adjustments
      const px = -22;
      const py = -94 + (stance === 'idle' ? bobY : 0);

      // --- LEGS & SANDALS ---
      ctx.fillStyle = charDef.colorTheme.primary;
      ctx.fillRect(px + 6, py + 58, 12, 28);
      ctx.fillRect(px + 24, py + 58, 12, 28);

      // Wooden Geta sandals
      ctx.fillStyle = '#b45309';
      ctx.fillRect(px + 4, py + 84, 15, 5);
      ctx.fillRect(px + 23, py + 84, 15, 5);

      // --- TORSO & KIMONO ---
      ctx.fillStyle = charDef.colorTheme.primary;
      ctx.fillRect(px + 6, py + 26, 30, 34);

      // Kimono Lapel / Trim
      ctx.fillStyle = charDef.colorTheme.secondary;
      ctx.beginPath();
      ctx.moveTo(px + 14, py + 26);
      ctx.lineTo(px + 21, py + 40);
      ctx.lineTo(px + 28, py + 26);
      ctx.lineTo(px + 32, py + 26);
      ctx.lineTo(px + 21, py + 46);
      ctx.lineTo(px + 10, py + 26);
      ctx.closePath();
      ctx.fill();

      // Obi Sash
      ctx.fillStyle = charDef.colorTheme.accent;
      ctx.fillRect(px + 8, py + 52, 26, 7);

      // Flowing scarf / haori tails
      const wave = Math.sin(elapsed * 6) * 5;
      ctx.fillStyle = charDef.colorTheme.secondary;
      ctx.beginPath();
      ctx.moveTo(px + 6, py + 28);
      ctx.quadraticCurveTo(px - 18, py + 36 + wave, px - 28, py + 50 + wave);
      ctx.lineTo(px - 22, py + 58 + wave);
      ctx.quadraticCurveTo(px - 12, py + 42 + wave, px + 6, py + 38);
      ctx.closePath();
      ctx.fill();

      // --- HEAD, FACE, HAIR / HAT ---
      // Skin
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(px + 13, py + 12, 16, 14);

      // Fierce Eyes & Brow
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px + 22, py + 16, 5, 2);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(px + 20, py + 14, 7, 2);

      if (characterId === 'kenji') {
        // Kenji: Spiky black hair & Golden Forehead Plate (Hachi-gane)
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(px + 10, py + 4, 22, 10);
        ctx.fillRect(px + 4, py + 6, 8, 10);
        ctx.fillRect(px + 2, py + 12, 6, 8);
        // Golden headband
        ctx.fillStyle = '#facc15';
        ctx.fillRect(px + 14, py + 10, 14, 4);
      } else {
        // Ryu: Woven Bamboo Straw Hat (Kasa) with cyan ribbon
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.moveTo(px - 3, py + 12);
        ctx.lineTo(px + 21, py + 2);
        ctx.lineTo(px + 45, py + 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px - 1, py + 11, 44, 3);
        // Cyan ribbon
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(px + 10, py + 12, 4, 18);
      }

      // --- ARMS & KATANA ---
      if (stance === 'attack') {
        // Slashing posture with glowing arc
        ctx.fillStyle = charDef.colorTheme.primary;
        ctx.fillRect(px + 20, py + 28, 26, 9);
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(px + 44, py + 28, 7, 7);

        // Extended Blade
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(px + 50, py + 29, 44, 5);
        ctx.fillStyle = charDef.colorTheme.bladeGlow;
        ctx.fillRect(px + 48, py + 27, 48, 9);

        // Blade flash spark
        const flashAlpha = Math.abs(Math.sin(elapsed * 10));
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
        ctx.fillRect(px + 74, py + 20, 6, 24);

      } else if (stance === 'victory') {
        // Sheathing pose (Noto)
        ctx.fillStyle = charDef.colorTheme.primary;
        ctx.fillRect(px + 10, py + 28, 14, 14);
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(px + 12, py + 42, 7, 7);

        // Katana resting at hip
        ctx.fillStyle = '#18181b';
        ctx.fillRect(px - 18, py + 44, 36, 4);
        ctx.fillStyle = charDef.colorTheme.accent;
        ctx.fillRect(px + 18, py + 42, 5, 8);

      } else {
        // Default Idle Stance
        ctx.fillStyle = charDef.colorTheme.primary;
        ctx.fillRect(px + 4, py + 30, 10, 18);
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(px + 8, py + 46, 6, 6);

        // Katana Saya at hip
        ctx.fillStyle = '#18181b';
        ctx.fillRect(px - 16, py + 44, 34, 4);
        ctx.fillStyle = charDef.colorTheme.accent;
        ctx.fillRect(px + 18, py + 43, 4, 7);
        ctx.fillRect(px + 22, py + 44, 10, 4);

        // Subtle blade gleam
        if (Math.sin(elapsed * 3) > 0.8) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px + 20, py + 41, 3, 3);
        }
      }

      ctx.restore();

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [characterId, width, height, isSelected, stance]);

  return (
    <div className={`relative flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
      isSelected ? 'shadow-[0_0_20px_rgba(251,191,36,0.3)]' : ''
    }`}>
      <canvas
        ref={canvasRef}
        className="w-full h-auto object-contain pixelated pointer-events-none"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};
