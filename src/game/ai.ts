import { Fighter } from './fighter.ts';
import { AIDifficulty, InputState } from './types.ts';

type AIState = 'idle' | 'approach' | 'attack' | 'defend' | 'dodge' | 'retreat' | 'recover';

export class SamuraiAI {
  public difficulty: AIDifficulty;
  public aiState: AIState = 'idle';
  public decisionTimer: number = 0;
  public blockHoldTimer: number = 0;
  
  constructor(difficulty: AIDifficulty = 'normal') {
    this.difficulty = difficulty;
  }

  public setDifficulty(diff: AIDifficulty) {
    this.difficulty = diff;
  }

  public update(dt: number, aiFighter: Fighter, playerFighter: Fighter): InputState {
    const input: InputState = {
      left: false,
      right: false,
      jump: false,
      lightAttack: false,
      heavyAttack: false,
      block: false,
      dash: false,
      skill: false,
    };

    this.decisionTimer -= dt;
    if (this.blockHoldTimer > 0) {
      this.blockHoldTimer -= dt;
      input.block = true;
    }

    // Reaction interval based on difficulty
    const reactionInterval = this.difficulty === 'easy' ? 0.38 : (this.difficulty === 'normal' ? 0.20 : 0.10);

    const distance = Math.abs(aiFighter.x - playerFighter.x);
    const isAiToLeft = aiFighter.x < playerFighter.x;
    const isPlayerAttacking = playerFighter.state === 'light_attack' || 
                              playerFighter.state === 'heavy_attack' || 
                              playerFighter.state === 'skill';

    // 1. Reactive defense to player attacks
    if (isPlayerAttacking && distance < 140) {
      const parryRoll = Math.random();
      const defendChance = this.difficulty === 'easy' ? 0.25 : (this.difficulty === 'normal' ? 0.55 : 0.85);

      if (parryRoll < defendChance) {
        // Chance to dash away or block
        if (this.difficulty === 'hard' && Math.random() < 0.4 && aiFighter.stamina >= 20) {
          input.dash = true; // dodge back
        } else {
          this.blockHoldTimer = 0.28;
          input.block = true;
          return input;
        }
      }
    }

    // 2. Periodic tactical re-evaluation
    if (this.decisionTimer <= 0) {
      this.decisionTimer = reactionInterval + Math.random() * 0.12;

      // Low stamina -> retreat & recover
      if (aiFighter.stamina < 25) {
        this.aiState = 'retreat';
      } else if (distance > 130) {
        this.aiState = 'approach';
      } else if (distance <= 110) {
        // In striking range!
        const attackRoll = Math.random();
        if (attackRoll < 0.75) {
          this.aiState = 'attack';
        } else if (attackRoll < 0.90) {
          this.aiState = 'dodge';
        } else {
          this.aiState = 'idle';
        }
      } else {
        this.aiState = 'approach';
      }
    }

    // 3. Execute AI State Machine
    switch (this.aiState) {
      case 'approach':
        if (isAiToLeft) {
          input.right = true;
        } else {
          input.left = true;
        }
        // Jump occasionally on Normal & Hard
        if (this.difficulty !== 'easy' && Math.random() < 0.05 && aiFighter.isGrounded) {
          input.jump = true;
        }
        break;

      case 'retreat':
        // Move away from player
        if (isAiToLeft) {
          input.left = true;
        } else {
          input.right = true;
        }
        // If backed into corner, jump or dash through
        if (aiFighter.x < 50 || aiFighter.x > 750) {
          if (aiFighter.stamina >= 20) {
            input.dash = true;
          } else {
            input.jump = true;
          }
        }
        break;

      case 'dodge':
        if (aiFighter.stamina >= 20) {
          input.dash = true;
        } else {
          // step back
          if (isAiToLeft) input.left = true;
          else input.right = true;
        }
        this.aiState = 'idle';
        break;

      case 'attack':
        // Face opponent
        if (isAiToLeft) input.right = true;
        else input.left = true;

        // Choose attack based on range and stamina
        if (aiFighter.stamina >= 45 && aiFighter.skillCooldownTimer <= 0 && Math.random() < 0.35) {
          input.skill = true;
        } else if (aiFighter.stamina >= 25 && aiFighter.heavyCooldownTimer <= 0 && Math.random() < 0.5) {
          input.heavyAttack = true;
        } else if (aiFighter.lightCooldownTimer <= 0) {
          input.lightAttack = true;
        }
        this.aiState = 'recover';
        break;

      case 'recover':
        // Brief pause after attack
        if (Math.random() < 0.4) {
          this.aiState = 'retreat';
        }
        break;

      case 'idle':
      default:
        // Stance hold, slight shimmy
        if (Math.random() < 0.2) {
          if (isAiToLeft) input.right = true;
          else input.left = true;
        }
        break;
    }

    return input;
  }
}
