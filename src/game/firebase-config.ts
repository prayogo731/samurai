// Firebase Configuration holder
// Users can provide credentials directly here, via environment variables, or via the in-game Settings modal!

export interface FirebaseConfigType {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const STORAGE_KEY = 'samurai_duel_firebase_config';

// Default placeholder config
export const defaultFirebaseConfig: FirebaseConfigType = {
  apiKey: "ISI_API_KEY",
  authDomain: "ISI_AUTH_DOMAIN",
  databaseURL: "ISI_DATABASE_URL",
  projectId: "ISI_PROJECT_ID",
  storageBucket: "ISI_STORAGE_BUCKET",
  messagingSenderId: "ISI_MESSAGING_SENDER_ID",
  appId: "ISI_APP_ID"
};

// Retrieve saved config from localStorage if available, or environment, or fallback
export function getFirebaseConfig(): FirebaseConfigType {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.apiKey && !parsed.apiKey.includes('ISI_')) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage errors
  }

  // Check if Vite environment variables are provided
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  return defaultFirebaseConfig;
}

export function saveFirebaseConfig(config: FirebaseConfigType) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save Firebase config to localStorage', err);
  }
}

export function isFirebaseConfigured(config: FirebaseConfigType = getFirebaseConfig()): boolean {
  if (!config.apiKey || config.apiKey.includes('ISI_') || config.apiKey === '') {
    return false;
  }
  if (!config.databaseURL || config.databaseURL.includes('ISI_') || config.databaseURL === '') {
    return false;
  }
  return true;
}
