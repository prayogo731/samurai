import React, { useState } from 'react';
import { FIREBASE_REALTIME_DATABASE_RULES, SECURITY_RULES_EXPLANATION } from '../game/rules-reference.ts';
import { X, Copy, Check, ShieldCheck } from 'lucide-react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(FIREBASE_REALTIME_DATABASE_RULES);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-2 border-amber-600 rounded-xl p-6 shadow-2xl text-neutral-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-amber-950 border border-amber-500 rounded-lg text-amber-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-feudal tracking-wide text-amber-400">
              FIREBASE REALTIME DATABASE RULES
            </h2>
            <p className="text-xs text-neutral-400 font-pixel">
              PRODUCTION SECURITY & ACCESS CONTROL
            </p>
          </div>
        </div>

        <p className="text-xs text-neutral-300 mb-3">
          Salin aturan JSON ini ke tab <strong>Realtime Database &gt; Rules</strong> di Firebase Console Anda untuk melindungi data pertandingan:
        </p>

        <div className="relative">
          <button
            onClick={handleCopy}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-amber-600/90 hover:bg-amber-500 text-black font-semibold text-xs rounded shadow transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-900" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Rules</span>
              </>
            )}
          </button>
          <pre className="bg-neutral-950 border border-neutral-800 p-4 rounded-lg font-mono text-xs text-emerald-400 overflow-x-auto max-h-72">
            {FIREBASE_REALTIME_DATABASE_RULES}
          </pre>
        </div>

        <div className="mt-4 p-3 bg-neutral-950/70 border border-neutral-800 rounded text-xs text-neutral-300 leading-relaxed whitespace-pre-line">
          {SECURITY_RULES_EXPLANATION}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
