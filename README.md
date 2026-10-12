# SAMURAI DUEL (侍 決闘)
### *ONE BLADE. ONE HONOR. ONE WINNER.*

Game web pertarungan samurai 2D pixel-art 1 vs 1 dengan sistem duel side-view, animasi katana berkecepatan tinggi, kecerdasan buatan (AI) komputer, kontrol sentuh multi-finger untuk mobile, dan sistem online multiplayer real-time berbasis Firebase Realtime Database.

---

## 🗡️ Fitur Utama

- **Gameplay 1 vs 1 Berbasis Hitbox & Hurtbox Sejati**: Deteksi tabrakan presisi pada frame aktif serangan, bukan sekadar jarak visual. Satu tebasan hanya mengenai lawan sekali.
- **Sistem Parry & Guard Break**: 
  - **Parry**: Menekan Block tepat saat serangan lawan datang (jendela 160ms pertama) membatalkan seluruh damage, memulihkan stamina, memunculkan kilatan emas (*golden ring*), dan men-stagger lawan.
  - **Block**: Mengurangi damage sebesar 80% dengan mengonsumsi stamina. Jika stamina habis, terjadi *Guard Break*.
  - **Dash Dodge**: Memiliki *invulnerability frame* singkat untuk menembus atau mundur dari tebasan lawan.
- **Dua Karakter Bersejarah Unik**:
  1. **KENJI (紅の疾風 - The Crimson Gale)**: Haori hitam dengan syal merah menyala. Gaya bertarung seimbang, serangan cepat, teknik spesial *Dragon Gale (竜風斬)* berupa tebasan kilat melintang.
  2. **RYU (蒼穹の城壁 - The Azure Fortress)**: Hakama biru navy, topi jerami ronin (*kasa*), jangkauan pedang lebih panjang, HP lebih tinggi, teknik spesial *Thunder Stance (雷光撃)* cleave pemecah pertahanan.
- **Tiga Arena Parallax Dinamis**:
  - **Sakura Village (桜の里)**: Desa senja dengan Gunung Fuji, gerbang Torii, lampion menyala, dan guguran kelopak bunga sakura.
  - **Bamboo Forest (竹林の道)**: Hutan bambu berkabut hijau zamrud di bawah bulan sabit dengan dedaunan bambu melayang.
  - **Moonlit Castle (月下の城)**: Atap kastel feodal di bawah purnama merah darah (*blood moon*) dengan hujan rintik-rintik.
- **Visual Pemilihan Karakter Pixel-Art Interaktif**:
  - Saat memilih karakter (KENJI / RYU), ditampilkan tampilan bentuk pixel-art animasi utuh dengan kuda-kuda bertarung, pernapasan idle, kibasan syal/pita kasa, bayangan di atas tatami, dan partikel aura khas (kelopak sakura untuk Kenji, kilatan petir biru untuk Ryu).
  - Tombol tes animasi langsung di layar seleksi: **BERDIRI (IDLE)**, **TEBASAN (ATTACK)** dengan garis cahaya pedang, dan **MENANG (VICTORY)** dengan pose menyarungkan pedang (*chiburi & noto*).
- **Musik Game Pixel 8-Bit Chiptune Retro (Web Audio API)**:
  - Musik latar sintetis chiptune multi-channel tanpa file audio berat:
    - **Menu & Karakter BGM**: *"Way of the Ronin"* (Skala pentatonik Jepang Hirajoshi bernuansa koto/shakuhachi melankolis dengan ritme taiko).
    - **Battle Duel BGM**: *"Duel of Honor"* (Arcade battle 140 BPM bertempo cepat dengan bassline arpeggio 16th-note yang memacu adrenalin).
  - Tombol kontrol audio mandiri: On/Off 8-bit BGM dan On/Off Efek Suara (SFX) di Title Screen, HUD Pertandingan, dan Menu Pengaturan.
- **Mode 1: Player vs Computer (AI)**:
  - Berfungsi 100% offline tanpa perlu koneksi Firebase.
  - 3 Tingkat kesulitan: **EASY**, **NORMAL**, dan **HARD**.
  - State machine AI adaptif: *Approach, Attack, Defend, Dodge, Recover, Retreat*.
- **Mode 2: Online Multiplayer Real-time (Firebase)**:
  - Duel jarak jauh antar perangkat berbeda (Laptop ke Laptop, HP ke HP, Laptop ke HP).
  - Sistem Create Room & Join Room dengan kode 5 huruf unik (contoh: `RONIN`, `BLADE`).
  - Throttled network synchronization (~18 updates/detik) dengan interpolasi gerakan mulus.
  - Host authoritative arbitration untuk penentuan HP, ronde, dan timer 99 detik.
- **Responsif Laptop & Smartphone**:
  - Dukungan keyboard penuh untuk laptop.
  - Virtual On-Screen Controller untuk perangkat sentuh dengan Pointer Events multi-touch (bisa bergerak sambil menyerang).

---

## 🎮 Kontrol Permainan

### Keyboard (Laptop / Komputer)
| Tombol | Fungsi |
|---|---|
| **A / D** | Bergerak ke Kiri / Kanan |
| **W** | Melompat (Jump) |
| **J** | Serangan Ringan (Light Slash) |
| **K** | Serangan Berat (Heavy Cleave) |
| **L** | Block / Parry (160ms sweet spot) |
| **Space** | Dash / Dodge (Kebal sesaat) |
| **U** | Special Skill (Teknik Rahasia) |

### Kontrol Layar Sentuh (HP / Tablet)
- **D-Pad Kiri**: Tombol Gerak Kiri, Kanan, dan Lompat.
- **Tombol Kanan**: Tombol **LIGHT**, **HEAVY**, **GUARD**, **DASH**, dan **SKILL**.
- Multi-touch didukung sehingga pemain dapat menahan arah bergerak sambil menekan tombol serangan.

---

## ⚙️ Konfigurasi Firebase Multiplayer

Game dapat dimainkan melawan AI **tanpa konfigurasi apa pun**. Untuk bermain online 1 vs 1 dengan teman di perangkat lain, ikuti langkah berikut:

### Langkah 1: Buat Proyek Firebase
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Buat proyek baru (pilih paket gratis **Spark Plan**).
3. Buka menu **Build > Authentication** > tab **Sign-in method** > aktifkan **Anonymous** provider.
4. Buka menu **Build > Realtime Database** > klik **Create Database** (pilih lokasi terdekat, misal `asia-southeast1` atau `us-central1`).

### Langkah 2: Terapkan Aturan Keamanan (Database Rules)
Salin aturan di bawah ini ke tab **Realtime Database > Rules**:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": "auth != null",
        ".write": "auth != null && (!data.exists() || data.child('hostUid').val() === auth.uid || data.child('players/player1/uid').val() === auth.uid || data.child('players/player2/uid').val() === auth.uid || (!data.child('players/player2').exists() && newData.child('players/player2/uid').val() === auth.uid))",

        "players": {
          "player1": {
            ".write": "auth != null && (!data.exists() || data.child('uid').val() === auth.uid || root.child('rooms/' + $roomId + '/hostUid').val() === auth.uid)",
            ".validate": "newData.hasChildren(['uid', 'character'])"
          },
          "player2": {
            ".write": "auth != null && (!data.exists() || data.child('uid').val() === auth.uid || root.child('rooms/' + $roomId + '/hostUid').val() === auth.uid)",
            ".validate": "newData.hasChildren(['uid', 'character'])"
          }
        },

        "timer": {
          ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 99"
        },

        "status": {
          ".validate": "newData.isString() && (newData.val() === 'waiting' || newData.val() === 'ready' || newData.val() === 'playing' || newData.val() === 'round_end' || newData.val() === 'finished')"
        }
      }
    }
  }
}
```

### Langkah 3: Masukkan Kredensial di Aplikasi
1. Di Firebase Console, buka **Project Settings > General > Your Apps > Web App (</>)**.
2. Salin objek `firebaseConfig`.
3. Buka menu **SETTINGS** di dalam game, lalu pilih **Konfigurasi Firebase Console**.
4. Tempel **API Key** dan **Database URL**, lalu klik **Simpan & Uji Koneksi**.
5. Kredensial tersimpan aman di browser Anda via `localStorage`.

---

## 🚀 Menjalankan Secara Lokal & Deploy ke GitHub Pages

### Menjalankan di Lokal:
```bash
# Install dependencies
npm install

# Jalankan server development Vite
npm run dev
```
Akses di browser melalui `http://localhost:3000`.

### Build untuk GitHub Pages / Hosting Statis:
```bash
# Build bundle produksi
npm run build
```
Folder hasil build `dist/` siap di-deploy langsung ke **GitHub Pages**, **Vercel**, atau **Firebase Hosting** tanpa memerlukan server Node.js aktif!

---

*SAMURAI DUEL — Crafted with honor & bushido spirit.*
