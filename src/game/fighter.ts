import { Box, CharacterDef, CharacterId, FighterState, Hitbox, InputState, NetworkFighterSnapshot } from './types.ts';
import { CHARACTERS } from './characters.ts';
import { sounds } from './audio.ts';

export class Fighter {
  public id: string; // 'player1' | 'player2'
  public charDef: CharacterDef;
  public isAi: boolean = false;
  
  // Position & Physics
  public x: number;
  public y: number;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 44;
  public height: number = 76;
  public groundY: number = 340;
  public facing: 1 | -1 = 1;
  public isGrounded: boolean = true;

  // Attributes
  public hp: number;
  public maxHp: number;
  public stamina: number;
  public maxStamina: number;
  
  // State Machine
  public state: FighterState = 'idle';
  public stateTimer: number = 0;
  public animFrame: number = 0;
  
  // Attack & Combat Flags
  public hasDealtDamage: boolean = false;
  public parryWindowTimer: number = 0; // first 0.16s of block is parry
  public isInvincible: boolean = false;
  public invincibleTimer: number = 0;
  public hitStunTimer: number = 0;
  public dashCooldownTimer: number = 0;
  public lightCooldownTimer: number = 0;
  public heavyCooldownTimer: number = 0;
  public skillCooldownTimer: number = 0;
  
  // Stats
  public roundsWon: number = 0;
  public lastActionSeq: number = 0;

  constructor(id: string, charId: CharacterId, startX: number, facing: 1 | -1, groundY: number = 340) {
    this.id = id;
    this.charDef = CHARACTERS[charId] || CHARACTERS.kenji;
    this.x = startX;
    this.groundY = groundY;
    this.y = groundY - this.height;
    this.facing = facing;
    
    this.maxHp = this.charDef.maxHp;
    this.hp = this.maxHp;
    this.maxStamina = this.charDef.maxStamina;
    this.stamina = this.maxStamina;
  }

  public reset(startX: number, facing: 1 | -1) {
    this.x = startX;
    this.y = this.groundY - this.height;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.state = 'idle';
    this.stateTimer = 0;
    this.hp = this.maxHp;
    this.stamina = this.maxStamina;
    this.hasDealtDamage = false;
    this.parryWindowTimer = 0;
    this.invincibleTimer = 0;
    this.hitStunTimer = 0;
    this.dashCooldownTimer = 0;
    this.lightCooldownTimer = 0;
    this.heavyCooldownTimer = 0;
    this.skillCooldownTimer = 0;
  }

  public setCharacter(charId: CharacterId) {
    this.charDef = CHARACTERS[charId];
    this.maxHp = this.charDef.maxHp;
    this.hp = this.maxHp;
    this.maxStamina = this.charDef.maxStamina;
    this.stamina = this.maxStamina;
  }

  public update(dt: number, input: InputState, arenaWidth: number = 800) {
    // Tick cooldowns
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer -= dt;
    if (this.lightCooldownTimer > 0) this.lightCooldownTimer -= dt;
    if (this.heavyCooldownTimer > 0) this.heavyCooldownTimer -= dt;
    if (this.skillCooldownTimer > 0) this.skillCooldownTimer -= dt;

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
      this.isInvincible = this.invincibleTimer > 0;
    }

    // Tick parry window
    if (this.parryWindowTimer > 0) {
      this.parryWindowTimer -= dt;
    }

    // Natural stamina regeneration (if not blocking, attacking, or dashing)
    const isExerting = this.state === 'block' || this.state === 'dash' || 
                       this.state === 'light_attack' || this.state === 'heavy_attack' || this.state === 'skill';
    if (!isExerting && this.stamina < this.maxStamina && this.state !== 'hit') {
      this.stamina = Math.min(this.maxStamina, this.stamina + 22 * dt);
    }

    // Hit Stun Handling
    if (this.hitStunTimer > 0) {
      this.hitStunTimer -= dt;
      this.state = 'hit';
      // Apply friction
      this.vx *= 0.88;
      this.applyGravity(dt);
      this.handleWorldBounds(arenaWidth);
      return;
    }

    // Cannot act if in round victory/defeat
    if (this.state === 'victory' || this.state === 'defeat') {
      this.vx *= 0.85;
      this.applyGravity(dt);
      this.handleWorldBounds(arenaWidth);
      return;
    }

    // Process State Machines
    this.handleActions(dt, input);
    this.handleMovement(dt, input);
    this.applyGravity(dt);
    this.handleWorldBounds(arenaWidth);

    // Update state timer & animation frame
    this.stateTimer += dt;
    this.animFrame = Math.floor(this.stateTimer * 12);
  }

  private handleActions(dt: number, input: InputState) {
    // Attack / Action States lock input until finished
    if (this.state === 'light_attack') {
      const duration = this.charDef.cooldowns.light;
      this.vx *= 0.85; // friction during swing
      if (this.stateTimer >= duration) {
        this.state = 'idle';
        this.hasDealtDamage = false;
      }
      return;
    }

    if (this.state === 'heavy_attack') {
      const duration = this.charDef.cooldowns.heavy;
      this.vx *= 0.82;
      if (this.stateTimer >= duration) {
        this.state = 'idle';
        this.hasDealtDamage = false;
      }
      return;
    }

    if (this.state === 'skill') {
      const duration = 0.65;
      // Dash burst forward during skill
      this.vx = this.facing * (this.charDef.dashSpeed * 1.3);
      if (this.stateTimer >= duration) {
        this.state = 'idle';
        this.hasDealtDamage = false;
      }
      return;
    }

    if (this.state === 'dash') {
      const duration = 0.22;
      this.isInvincible = true;
      if (this.stateTimer >= duration) {
        this.state = 'idle';
        this.isInvincible = false;
      }
      return;
    }

    // Blocking / Parry
    if (input.block && this.isGrounded && this.stamina >= 10) {
      if (this.state !== 'block') {
        this.state = 'block';
        this.stateTimer = 0;
        this.parryWindowTimer = 0.16; // 160ms sweet spot for Parry
      }
      this.vx = 0;
      return;
    } else if (this.state === 'block' && (!input.block || this.stamina < 5)) {
      this.state = 'idle';
      this.parryWindowTimer = 0;
    }

    // Trigger Dash
    if (input.dash && this.dashCooldownTimer <= 0 && this.stamina >= 18) {
      this.state = 'dash';
      this.stateTimer = 0;
      this.stamina -= 18;
      this.dashCooldownTimer = 0.55;
      this.vx = this.facing * this.charDef.dashSpeed;
      sounds.playDash();
      this.lastActionSeq++;
      return;
    }

    // Trigger Special Skill
    if (input.skill && this.skillCooldownTimer <= 0 && this.stamina >= 40) {
      this.state = 'skill';
      this.stateTimer = 0;
      this.hasDealtDamage = false;
      this.stamina -= 40;
      this.skillCooldownTimer = this.charDef.cooldowns.skill;
      sounds.playSkill();
      this.lastActionSeq++;
      return;
    }

    // Trigger Heavy Attack
    if (input.heavyAttack && this.heavyCooldownTimer <= 0 && this.stamina >= 20) {
      this.state = 'heavy_attack';
      this.stateTimer = 0;
      this.hasDealtDamage = false;
      this.stamina -= 20;
      this.heavyCooldownTimer = this.charDef.cooldowns.heavy;
      sounds.playSlashHeavy();
      this.lastActionSeq++;
      return;
    }

    // Trigger Light Attack
    if (input.lightAttack && this.lightCooldownTimer <= 0 && this.stamina >= 10) {
      this.state = 'light_attack';
      this.stateTimer = 0;
      this.hasDealtDamage = false;
      this.stamina -= 10;
      this.lightCooldownTimer = this.charDef.cooldowns.light;
      sounds.playSlashLight();
      this.lastActionSeq++;
      return;
    }
  }

  private handleMovement(dt: number, input: InputState) {
    if (this.state === 'block' || this.state === 'dash' || 
        this.state === 'light_attack' || this.state === 'heavy_attack' || this.state === 'skill') {
      return;
    }

    // Horizontal Movement
    if (input.left && !input.right) {
      this.vx = -this.charDef.speed;
      this.facing = -1;
      if (this.isGrounded) this.state = 'walk';
    } else if (input.right && !input.left) {
      this.vx = this.charDef.speed;
      this.facing = 1;
      if (this.isGrounded) this.state = 'walk';
    } else {
      this.vx = 0;
      if (this.isGrounded) this.state = 'idle';
    }

    // Jump
    if (input.jump && this.isGrounded && this.stamina >= 8) {
      this.vy = -this.charDef.jumpForce;
      this.isGrounded = false;
      this.stamina -= 8;
      this.state = 'jump';
      this.lastActionSeq++;
    }
  }

  private applyGravity(dt: number) {
    const gravity = 32;
    this.vy += gravity * dt;
    this.x += this.vx;
    this.y += this.vy;

    // Floor collision
    const floorY = this.groundY - this.height;
    if (this.y >= floorY) {
      this.y = floorY;
      this.vy = 0;
      this.isGrounded = true;
      if (this.state === 'jump') {
        this.state = 'idle';
      }
    } else {
      this.isGrounded = false;
      if (this.state !== 'light_attack' && this.state !== 'heavy_attack' && this.state !== 'skill' && this.state !== 'hit') {
        this.state = 'jump';
      }
    }
  }

  private handleWorldBounds(arenaWidth: number) {
    const minX = 20;
    const maxX = arenaWidth - this.width - 20;
    if (this.x < minX) this.x = minX;
    if (this.x > maxX) this.x = maxX;
  }

  // Get Hurtbox (where attacks can damage this fighter)
  public getHurtbox(): Box {
    return {
      x: this.x + 8,
      y: this.y + 6,
      width: this.width - 16,
      height: this.height - 6,
    };
  }

  // Get Active Attack Hitbox
  public getHitbox(): Hitbox | null {
    if (this.hasDealtDamage) return null;

    if (this.state === 'light_attack') {
      // Active window: 0.08s to 0.20s
      if (this.stateTimer >= 0.06 && this.stateTimer <= 0.22) {
        const range = this.charDef.attackRange.light;
        const boxX = this.facing === 1 ? this.x + this.width : this.x - range;
        return {
          x: boxX,
          y: this.y + 16,
          width: range,
          height: 38,
          damage: this.charDef.attackPower.light,
          knockbackX: this.facing * 4.5,
          knockbackY: -2.5,
          hitStun: 0.22,
          isHeavy: false,
          isSkill: false,
          active: true,
        };
      }
    }

    if (this.state === 'heavy_attack') {
      // Active window: 0.18s to 0.40s
      if (this.stateTimer >= 0.16 && this.stateTimer <= 0.42) {
        const range = this.charDef.attackRange.heavy;
        const boxX = this.facing === 1 ? this.x + this.width : this.x - range;
        return {
          x: boxX,
          y: this.y + 10,
          width: range,
          height: 48,
          damage: this.charDef.attackPower.heavy,
          knockbackX: this.facing * 8.0,
          knockbackY: -4.0,
          hitStun: 0.45,
          isHeavy: true,
          isSkill: false,
          active: true,
        };
      }
    }

    if (this.state === 'skill') {
      // Active throughout dash
      if (this.stateTimer >= 0.10 && this.stateTimer <= 0.55) {
        const range = this.charDef.attackRange.skill;
        const boxX = this.facing === 1 ? this.x : this.x - range + this.width;
        return {
          x: boxX,
          y: this.y + 12,
          width: range,
          height: 52,
          damage: this.charDef.attackPower.skill,
          knockbackX: this.facing * 12.0,
          knockbackY: -5.5,
          hitStun: 0.60,
          isHeavy: true,
          isSkill: true,
          active: true,
        };
      }
    }

    return null;
  }

  // Handle Taking Hit: return outcome
  public takeHit(hitbox: Hitbox): 'hit' | 'block' | 'parry' | 'invincible' {
    if (this.isInvincible) return 'invincible';

    // Check Parry
    if (this.state === 'block' && this.parryWindowTimer > 0) {
      sounds.playParry();
      this.stamina = Math.min(this.maxStamina, this.stamina + 15);
      return 'parry';
    }

    // Check Block
    if (this.state === 'block') {
      sounds.playBlock();
      const staminaDrain = hitbox.isHeavy ? 25 : 12;
      this.stamina = Math.max(0, this.stamina - staminaDrain);
      
      // Chip damage only (20% of attack)
      const chipDamage = Math.max(1, Math.round(hitbox.damage * 0.2));
      this.hp = Math.max(0, this.hp - chipDamage);

      // Light pushback
      this.vx = hitbox.knockbackX * 0.35;
      
      // Guard Break if stamina reaches zero
      if (this.stamina <= 0) {
        this.state = 'hit';
        this.hitStunTimer = 0.5;
      }
      return 'block';
    }

    // Normal Hit
    sounds.playHit();
    this.hp = Math.max(0, this.hp - hitbox.damage);
    this.state = 'hit';
    this.hitStunTimer = hitbox.hitStun;
    this.invincibleTimer = 0.12; // brief i-frame to prevent instant multi-ticks
    this.isInvincible = true;
    this.vx = hitbox.knockbackX;
    this.vy = hitbox.knockbackY;

    if (this.hp <= 0) {
      this.state = 'defeat';
    }

    return 'hit';
  }

  // Network serialization
  public getSnapshot(): NetworkFighterSnapshot {
    return {
      x: Math.round(this.x),
      y: Math.round(this.y),
      vx: Number(this.vx.toFixed(2)),
      vy: Number(this.vy.toFixed(2)),
      facing: this.facing,
      state: this.state,
      stateTimer: Number(this.stateTimer.toFixed(2)),
      hp: this.hp,
      stamina: Math.round(this.stamina),
      animFrame: this.animFrame,
      lastActionSeq: this.lastActionSeq,
    };
  }

  // Network interpolation
  public applySnapshot(snap: NetworkFighterSnapshot) {
    // Smooth lerp position
    this.x += (snap.x - this.x) * 0.45;
    this.y += (snap.y - this.y) * 0.45;
    this.vx = snap.vx;
    this.vy = snap.vy;
    this.facing = snap.facing;
    this.state = snap.state;
    this.stateTimer = snap.stateTimer;
    this.hp = snap.hp;
    this.stamina = snap.stamina;
    this.animFrame = snap.animFrame;
    this.lastActionSeq = snap.lastActionSeq;
  }
}
