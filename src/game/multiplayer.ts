import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, User } from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  onValue, 
  off, 
  onDisconnect, 
  serverTimestamp,
  Database,
  Unsubscribe 
} from 'firebase/database';
import { CharacterId, OnlineRoomData, NetworkFighterSnapshot } from './types.ts';
import { getFirebaseConfig, isFirebaseConfigured } from './firebase-config.ts';

export type MultiplayerRole = 'player1' | 'player2' | null;

export class MultiplayerManager {
  private app: FirebaseApp | null = null;
  private db: Database | null = null;
  private currentUser: User | null = null;
  
  public currentRoomId: string | null = null;
  public myRole: MultiplayerRole = null;
  public roomData: OnlineRoomData | null = null;
  
  private roomUnsubscribe: Unsubscribe | null = null;
  private lastSyncTimestamp: number = 0;
  private syncThrottleMs: number = 55; // ~18 updates/sec
  
  public onRoomUpdate: ((data: OnlineRoomData) => void) | null = null;
  public onError: ((err: string) => void) | null = null;
  public onOpponentDisconnected: (() => void) | null = null;

  public isReady(): boolean {
    return isFirebaseConfigured();
  }

  // Initialize Firebase app & auth anonymously
  public async init(): Promise<boolean> {
    if (!isFirebaseConfigured()) {
      return false;
    }

    try {
      const config = getFirebaseConfig();
      if (!getApps().length) {
        this.app = initializeApp(config);
      } else {
        this.app = getApp();
      }

      this.db = getDatabase(this.app);
      const auth = getAuth(this.app);
      
      const userCredential = await signInAnonymously(auth);
      this.currentUser = userCredential.user;
      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Firebase init error:', errorMsg);
      if (this.onError) this.onError(errorMsg);
      return false;
    }
  }

  public getUid(): string {
    return this.currentUser ? this.currentUser.uid : 'anon-' + Math.random().toString(36).substring(2, 8);
  }

  // Create a new room as Host (player1)
  public async createRoom(character: CharacterId, arena = 'sakura'): Promise<string> {
    const initialized = await this.init();
    if (!initialized || !this.db) {
      throw new Error('Firebase is not configured. Please enter your Firebase credentials in Settings.');
    }

    const roomId = this.generateRoomCode();
    const uid = this.getUid();
    this.currentRoomId = roomId;
    this.myRole = 'player1';

    const roomRef = ref(this.db, `rooms/${roomId}`);
    const initialData: OnlineRoomData = {
      id: roomId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      status: 'waiting',
      hostUid: uid,
      arena: arena as any,
      timer: 99,
      round: 1,
      score: {
        player1: 0,
        player2: 0,
      },
      players: {
        player1: {
          uid,
          name: 'Player 1',
          character,
          ready: false,
          connected: true,
        },
      },
    };

    await set(roomRef, initialData);

    // Setup disconnect cleanup for host
    const p1Ref = ref(this.db, `rooms/${roomId}/players/player1/connected`);
    await onDisconnect(p1Ref).set(false);

    this.listenToRoom(roomId);
    return roomId;
  }

  // Join an existing room as Player 2
  public async joinRoom(roomId: string, character: CharacterId): Promise<boolean> {
    const initialized = await this.init();
    if (!initialized || !this.db) {
      throw new Error('Firebase is not configured. Please enter your Firebase credentials in Settings.');
    }

    const cleanRoomId = roomId.trim().toUpperCase();
    const roomRef = ref(this.db, `rooms/${cleanRoomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      throw new Error(`Room [${cleanRoomId}] not found. Please check the code.`);
    }

    const data = snapshot.val() as OnlineRoomData;
    if (data.players.player2 && data.players.player2.connected && data.players.player2.uid !== this.getUid()) {
      throw new Error(`Room [${cleanRoomId}] is full.`);
    }

    const uid = this.getUid();
    this.currentRoomId = cleanRoomId;
    this.myRole = 'player2';

    // Update player 2 slot
    await update(ref(this.db, `rooms/${cleanRoomId}/players/player2`), {
      uid,
      name: 'Player 2',
      character,
      ready: false,
      connected: true,
    });

    // Update room status
    await update(roomRef, {
      status: 'ready',
      lastActivity: serverTimestamp(),
    });

    // On disconnect mark connected = false
    const p2Ref = ref(this.db, `rooms/${cleanRoomId}/players/player2/connected`);
    await onDisconnect(p2Ref).set(false);

    this.listenToRoom(cleanRoomId);
    return true;
  }

  // Set Ready status
  public async setReady(isReady: boolean) {
    if (!this.db || !this.currentRoomId || !this.myRole) return;
    const playerReadyRef = ref(this.db, `rooms/${this.currentRoomId}/players/${this.myRole}/ready`);
    await set(playerReadyRef, isReady);
  }

  // Update chosen character
  public async setCharacter(character: CharacterId) {
    if (!this.db || !this.currentRoomId || !this.myRole) return;
    const charRef = ref(this.db, `rooms/${this.currentRoomId}/players/${this.myRole}/character`);
    await set(charRef, character);
  }

  // Host starts the match
  public async startMatch() {
    if (!this.db || !this.currentRoomId || this.myRole !== 'player1') return;
    const roomRef = ref(this.db, `rooms/${this.currentRoomId}`);
    await update(roomRef, {
      status: 'playing',
      timer: 99,
      lastActivity: serverTimestamp(),
    });
  }

  // Throttled Network Snapshot send
  public sendFighterState(state: NetworkFighterSnapshot) {
    if (!this.db || !this.currentRoomId || !this.myRole) return;

    const now = performance.now();
    if (now - this.lastSyncTimestamp < this.syncThrottleMs) return;
    this.lastSyncTimestamp = now;

    const stateRef = ref(this.db, `rooms/${this.currentRoomId}/players/${this.myRole}/state`);
    set(stateRef, state).catch(() => {});
  }

  // Send combat hit event
  public sendHitEvent(damage: number, type: 'hit' | 'block' | 'parry') {
    if (!this.db || !this.currentRoomId || !this.myRole) return;
    const hitRef = ref(this.db, `rooms/${this.currentRoomId}/lastHitEvent`);
    set(hitRef, {
      attacker: this.myRole,
      damage,
      type,
      timestamp: Date.now(),
    }).catch(() => {});
  }

  // Host updates match timer / scores
  public updateMatchState(timer: number, phase: OnlineRoomData['status'], p1Score: number, p2Score: number) {
    if (!this.db || !this.currentRoomId || this.myRole !== 'player1') return;
    const roomRef = ref(this.db, `rooms/${this.currentRoomId}`);
    update(roomRef, {
      timer: Math.ceil(timer),
      status: phase,
      score: {
        player1: p1Score,
        player2: p2Score,
      },
    }).catch(() => {});
  }

  // Listen to Room updates
  private listenToRoom(roomId: string) {
    if (!this.db) return;
    this.cleanupListener();

    const roomRef = ref(this.db, `rooms/${roomId}`);
    this.roomUnsubscribe = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        if (this.onError) this.onError('Room has been closed by host.');
        this.leaveRoom();
        return;
      }

      const data = snapshot.val() as OnlineRoomData;
      this.roomData = data;

      // Check opponent disconnect
      const oppSlot = this.myRole === 'player1' ? data.players.player2 : data.players.player1;
      if (oppSlot && oppSlot.connected === false && data.status === 'playing') {
        if (this.onOpponentDisconnected) this.onOpponentDisconnected();
      }

      if (this.onRoomUpdate) {
        this.onRoomUpdate(data);
      }
    });
  }

  public leaveRoom() {
    this.cleanupListener();
    if (this.db && this.currentRoomId && this.myRole) {
      // Mark disconnected
      const roleRef = ref(this.db, `rooms/${this.currentRoomId}/players/${this.myRole}/connected`);
      set(roleRef, false).catch(() => {});
      
      // If host leaves, close the room
      if (this.myRole === 'player1') {
        const roomRef = ref(this.db, `rooms/${this.currentRoomId}`);
        set(roomRef, null).catch(() => {});
      }
    }
    this.currentRoomId = null;
    this.myRole = null;
    this.roomData = null;
  }

  private cleanupListener() {
    if (this.roomUnsubscribe) {
      this.roomUnsubscribe();
      this.roomUnsubscribe = null;
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

export const multiplayer = new MultiplayerManager();
