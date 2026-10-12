import React from 'react';
import { InputState } from '../game/types.ts';
import { Sword, Shield, Zap, Wind, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

interface VirtualControlsProps {
  inputState: InputState;
  onInputChange: (key: keyof InputState, value: boolean) => void;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({ onInputChange }) => {
  const handlePointer = (key: keyof InputState, value: boolean) => (e: React.PointerEvent) => {
    e.preventDefault();
    onInputChange(key, value);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-end p-4 md:p-6 z-20">
      <div className="w-full flex justify-between items-end">
        {/* Left D-Pad: Movement & Jump */}
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          {/* Jump */}
          <button
            aria-label="Jump"
            onPointerDown={handlePointer('jump', true)}
            onPointerUp={handlePointer('jump', false)}
            onPointerLeave={handlePointer('jump', false)}
            onPointerCancel={handlePointer('jump', false)}
            className="w-14 h-14 bg-neutral-900/80 active:bg-neutral-800 border-2 border-neutral-600 rounded-xl flex items-center justify-center text-amber-400 shadow-lg active:scale-95 transition-transform"
          >
            <ChevronUp className="w-8 h-8" />
          </button>

          {/* Left / Right */}
          <div className="flex gap-4">
            <button
              aria-label="Move Left"
              onPointerDown={handlePointer('left', true)}
              onPointerUp={handlePointer('left', false)}
              onPointerLeave={handlePointer('left', false)}
              onPointerCancel={handlePointer('left', false)}
              className="w-14 h-14 bg-neutral-900/80 active:bg-neutral-800 border-2 border-neutral-600 rounded-xl flex items-center justify-center text-amber-400 shadow-lg active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              aria-label="Move Right"
              onPointerDown={handlePointer('right', true)}
              onPointerUp={handlePointer('right', false)}
              onPointerLeave={handlePointer('right', false)}
              onPointerCancel={handlePointer('right', false)}
              className="w-14 h-14 bg-neutral-900/80 active:bg-neutral-800 border-2 border-neutral-600 rounded-xl flex items-center justify-center text-amber-400 shadow-lg active:scale-95 transition-transform"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Right Combat Action Buttons */}
        <div className="pointer-events-auto flex flex-col gap-2 items-end">
          {/* Top row: Skill & Dash */}
          <div className="flex gap-2">
            <button
              aria-label="Dash Dodge"
              onPointerDown={handlePointer('dash', true)}
              onPointerUp={handlePointer('dash', false)}
              onPointerLeave={handlePointer('dash', false)}
              onPointerCancel={handlePointer('dash', false)}
              className="w-12 h-12 bg-amber-950/80 active:bg-amber-800 border-2 border-amber-600 rounded-lg flex flex-col items-center justify-center text-amber-200 active:scale-95 shadow-md"
            >
              <Wind className="w-5 h-5" />
              <span className="text-[8px] font-pixel">DASH</span>
            </button>

            <button
              aria-label="Special Skill"
              onPointerDown={handlePointer('skill', true)}
              onPointerUp={handlePointer('skill', false)}
              onPointerLeave={handlePointer('skill', false)}
              onPointerCancel={handlePointer('skill', false)}
              className="w-12 h-12 bg-purple-950/80 active:bg-purple-800 border-2 border-purple-500 rounded-lg flex flex-col items-center justify-center text-purple-200 active:scale-95 shadow-md"
            >
              <Zap className="w-5 h-5" />
              <span className="text-[8px] font-pixel">SKILL</span>
            </button>
          </div>

          {/* Middle/Bottom row: Attacks & Block */}
          <div className="flex gap-2 items-center">
            {/* Block / Parry */}
            <button
              aria-label="Block and Parry"
              onPointerDown={handlePointer('block', true)}
              onPointerUp={handlePointer('block', false)}
              onPointerLeave={handlePointer('block', false)}
              onPointerCancel={handlePointer('block', false)}
              className="w-14 h-14 bg-blue-950/80 active:bg-blue-800 border-2 border-blue-500 rounded-xl flex flex-col items-center justify-center text-blue-200 active:scale-95 shadow-lg"
            >
              <Shield className="w-6 h-6" />
              <span className="text-[8px] font-pixel">GUARD</span>
            </button>

            {/* Light Attack */}
            <button
              aria-label="Light Attack"
              onPointerDown={handlePointer('lightAttack', true)}
              onPointerUp={handlePointer('lightAttack', false)}
              onPointerLeave={handlePointer('lightAttack', false)}
              onPointerCancel={handlePointer('lightAttack', false)}
              className="w-14 h-14 bg-red-950/80 active:bg-red-800 border-2 border-red-500 rounded-xl flex flex-col items-center justify-center text-red-200 active:scale-95 shadow-lg"
            >
              <Sword className="w-6 h-6" />
              <span className="text-[8px] font-pixel">LIGHT</span>
            </button>

            {/* Heavy Attack */}
            <button
              aria-label="Heavy Attack"
              onPointerDown={handlePointer('heavyAttack', true)}
              onPointerUp={handlePointer('heavyAttack', false)}
              onPointerLeave={handlePointer('heavyAttack', false)}
              onPointerCancel={handlePointer('heavyAttack', false)}
              className="w-16 h-16 bg-red-900/90 active:bg-red-700 border-2 border-amber-400 rounded-2xl flex flex-col items-center justify-center text-amber-200 active:scale-95 shadow-xl"
            >
              <Sword className="w-7 h-7 rotate-45" />
              <span className="text-[9px] font-pixel font-bold">HEAVY</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
