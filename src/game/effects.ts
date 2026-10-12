import { Particle, FloatingText } from './types.ts';

export class EffectsManager {
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public screenShake: number = 0;

  public triggerScreenShake(amount: number) {
    this.screenShake = Math.max(this.screenShake, amount);
  }

  public update(dt: number) {
    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 24 * dt);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      if (p.rotation !== undefined && p.vRot !== undefined) {
        p.rotation += p.vRot * dt;
      }
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt * 60;
      ft.alpha -= 1.2 * dt;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  public spawnSparks(x: number, y: number, color: string = '#fef08a', count: number = 14) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * Math.random());
      const speed = 2 + Math.random() * 5.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 2 + Math.random() * 3,
        color,
        alpha: 1,
        life: 0,
        maxLife: 0.25 + Math.random() * 0.25,
        type: 'spark',
      });
    }
  }

  public spawnBlood(x: number, y: number, facing: number, count: number = 18) {
    for (let i = 0; i < count; i++) {
      const angle = (facing > 0 ? -0.3 : Math.PI + 0.3) + (Math.random() - 0.5) * 1.2;
      const speed = 3 + Math.random() * 6;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + (Math.random() * 2),
        size: 2.5 + Math.random() * 2.5,
        color: Math.random() > 0.4 ? '#dc2626' : '#991b1b',
        alpha: 1,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.3,
        type: 'spark',
      });
    }
  }

  public spawnParryRing(x: number, y: number) {
    this.triggerScreenShake(8);
    // Golden sparks
    this.spawnSparks(x, y, '#fde047', 24);
    // Shock ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      size: 12,
      color: '#fef08a',
      alpha: 1,
      life: 0,
      maxLife: 0.25,
      type: 'parry_ring',
    });
    this.addFloatingText('PERFECT PARRY!', x, y - 30, '#facc15', 1.2);
  }

  public spawnDust(x: number, y: number, facing: number) {
    for (let i = 0; i < 6; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + 2,
        vx: -facing * (1 + Math.random() * 2),
        vy: -0.5 - Math.random() * 1.5,
        size: 3 + Math.random() * 3,
        color: '#78716c',
        alpha: 0.7,
        life: 0,
        maxLife: 0.3,
        type: 'dust',
      });
    }
  }

  public spawnAmbientParticle(width: number, type: 'petal' | 'leaf' | 'rain') {
    if (type === 'petal') {
      this.particles.push({
        x: Math.random() * (width + 100) - 50,
        y: -10,
        vx: 1 + Math.random() * 1.8,
        vy: 1.2 + Math.random() * 1.5,
        size: 4 + Math.random() * 3,
        color: Math.random() > 0.3 ? '#fbcfe8' : '#f472b6',
        alpha: 0.85,
        life: 0,
        maxLife: 7,
        type: 'petal',
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 2,
      });
    } else if (type === 'leaf') {
      this.particles.push({
        x: Math.random() * (width + 100) - 50,
        y: -10,
        vx: 0.5 + Math.random() * 1.5,
        vy: 1.0 + Math.random() * 1.2,
        size: 5 + Math.random() * 4,
        color: Math.random() > 0.4 ? '#4ade80' : '#22c55e',
        alpha: 0.8,
        life: 0,
        maxLife: 8,
        type: 'leaf',
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 2.5,
      });
    } else if (type === 'rain') {
      this.particles.push({
        x: Math.random() * (width + 200) - 100,
        y: -10,
        vx: -2.5,
        vy: 14 + Math.random() * 6,
        size: 2,
        color: '#93c5fd',
        alpha: 0.4,
        life: 0,
        maxLife: 1.5,
        type: 'rain',
      });
    }
  }

  public addFloatingText(text: string, x: number, y: number, color: string = '#f87171', scale: number = 1.0) {
    this.floatingTexts.push({
      id: Math.random().toString(36).substring(2, 9),
      text,
      x,
      y,
      vy: -1.4,
      alpha: 1,
      color,
      scale,
    });
  }

  public clear() {
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
  }
}
