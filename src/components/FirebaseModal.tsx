import React, { useState } from 'react';
import { FirebaseConfigType, getFirebaseConfig, saveFirebaseConfig, isFirebaseConfigured } from '../game/firebase-config.ts';
import { multiplayer } from '../game/multiplayer.ts';
import { X, CheckCircle2, AlertCircle, Database, Key, Globe, ShieldAlert } from 'lucide-react';

interface FirebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRules: () => void;
}

export const FirebaseModal: React.FC<FirebaseModalProps> = ({ isOpen, onClose, onOpenRules }) => {
  const [config, setConfig] = useState<FirebaseConfigType>(getFirebaseConfig());
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleChange = (key: keyof FirebaseConfigType, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value.trim() }));
  };

  const handleSave = async () => {
    saveFirebaseConfig(config);
    setTestStatus('testing');
    setTestMessage('Testing Firebase connection...');
    
    try {
      const ok = await multiplayer.init();
      if (ok) {
        setTestStatus('success');
        setTestMessage('Connected to Firebase Realtime Database successfully!');
      } else {
        setTestStatus('error');
        setTestMessage('Initialization failed. Check your API Key and Database URL.');
      }
    } catch (err: unknown) {
      setTestStatus('error');
      setTestMessage(err instanceof Error ? err.message : 'Connection failed');
    }
  };

  const isConfigured = isFirebaseConfigured(config);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-neutral-900 border-2 border-amber-600/70 rounded-xl p-6 shadow-2xl text-neutral-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-amber-950 border border-amber-500 rounded-lg text-amber-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-feudal tracking-wide text-amber-400">
              FIREBASE MULTIPLAYER SETUP
            </h2>
            <p className="text-xs text-neutral-400 font-pixel">
              REALTIME DATABASE & ANONYMOUS AUTH CONFIGURATION
            </p>
          </div>
        </div>

        {/* Status banner */}
        <div className={`p-3 rounded-lg border mb-5 flex items-start gap-3 ${
          isConfigured ? 'bg-emerald-950/40 border-emerald-600 text-emerald-300' : 'bg-amber-950/40 border-amber-600 text-amber-300'
        }`}>
          {isConfigured ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          )}
          <div className="text-xs">
            <p className="font-bold">
              {isConfigured ? 'Status: Configured' : 'Status: Belum Dikonfigurasi (Fallback Mode)'}
            </p>
            <p className="mt-1 text-neutral-300 leading-relaxed">
              {isConfigured
                ? 'Kredensial Firebase tersimpan. Anda siap membuat atau bergabung ke room online 1 vs 1!'
                : 'Mode Player vs Computer tetap dapat dimainkan tanpa koneksi. Untuk duel online antar perangkat, masukkan konfigurasi dari Firebase Console Anda di bawah ini.'}
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-4 p-3 bg-neutral-950/80 border border-neutral-800 rounded-lg text-xs space-y-1.5 text-neutral-300">
          <p className="font-semibold text-amber-300">Langkah Konfigurasi Firebase:</p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Buka <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">Firebase Console</a> & buat project baru (Gratis Spark Plan).</li>
            <li>Aktifkan <strong>Authentication</strong> &gt; Sign-in method &gt; <strong>Anonymous</strong>.</li>
            <li>Aktifkan <strong>Realtime Database</strong> (pilih lokasi terdekat, e.g. Singapore / US).</li>
            <li>Terapkan Aturan Keamanan (lihat tombol &quot;Security Rules&quot; di bawah).</li>
            <li>Di Project Settings &gt; General &gt; Your Apps &gt; Web App, salin <code>firebaseConfig</code> ke sini.</li>
          </ol>
        </div>

        {/* Inputs */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-neutral-400 mb-1 font-pixel text-[10px]">API KEY</label>
            <input
              type="text"
              value={config.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white focus:border-amber-500 outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-neutral-400 mb-1 font-pixel text-[10px]">DATABASE URL</label>
            <input
              type="text"
              value={config.databaseURL}
              onChange={(e) => handleChange('databaseURL', e.target.value)}
              placeholder="https://your-app-default-rtdb.firebaseio.com"
              className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white focus:border-amber-500 outline-none font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1 font-pixel text-[10px]">PROJECT ID</label>
              <input
                type="text"
                value={config.projectId}
                onChange={(e) => handleChange('projectId', e.target.value)}
                placeholder="my-samurai-duel"
                className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white focus:border-amber-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-pixel text-[10px]">AUTH DOMAIN</label>
              <input
                type="text"
                value={config.authDomain}
                onChange={(e) => handleChange('authDomain', e.target.value)}
                placeholder="my-samurai.firebaseapp.com"
                className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white focus:border-amber-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-400 mb-1 font-pixel text-[10px]">APP ID</label>
              <input
                type="text"
                value={config.appId}
                onChange={(e) => handleChange('appId', e.target.value)}
                placeholder="1:123456789:web:abcdef"
                className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white focus:border-amber-500 outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1 font-pixel text-[10px]">STORAGE BUCKET</label>
              <input
                type="text"
                value={config.storageBucket}
                onChange={(e) => handleChange('storageBucket', e.target.value)}
                placeholder="my-samurai.appspot.com"
                className="w-full bg-neutral-950 border border-neutral-700 rounded p-2 text-white focus:border-amber-500 outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {testMessage && (
          <div className={`mt-3 p-2 rounded text-xs ${
            testStatus === 'success' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' :
            testStatus === 'error' ? 'bg-red-950 text-red-300 border border-red-600' :
            'bg-neutral-800 text-amber-300'
          }`}>
            {testMessage}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3 justify-between items-center pt-3 border-t border-neutral-800">
          <button
            onClick={onOpenRules}
            type="button"
            className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-lg text-xs font-semibold text-amber-300 transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Security Rules Template
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-semibold text-neutral-300"
            >
              Tutup
            </button>
            <button
              onClick={handleSave}
              type="button"
              disabled={testStatus === 'testing'}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 rounded-lg text-xs font-bold text-black shadow-lg transition-transform active:scale-95 flex items-center gap-2"
            >
              {testStatus === 'testing' ? 'Menghubungkan...' : 'Simpan & Uji Koneksi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
