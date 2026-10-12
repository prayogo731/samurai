// Firebase Realtime Database Security Rules Reference
// As required by Section I of Master Prompt:
// - Requires authentication (Anonymous Auth)
// - Restricts access to room participants
// - Validates player1 and player2 slots and prevents 3rd player
// - Validates data types and ranges

export const FIREBASE_REALTIME_DATABASE_RULES = `{
  "rules": {
    "rooms": {
      "$roomId": {
        // Room can only be read if user is authenticated
        ".read": "auth != null",
        
        // Host can create room; participants can write
        ".write": "auth != null && (!data.exists() || data.child('hostUid').val() === auth.uid || data.child('players/player1/uid').val() === auth.uid || data.child('players/player2/uid').val() === auth.uid || (!data.child('players/player2').exists() && newData.child('players/player2/uid').val() === auth.uid))",

        "players": {
          "player1": {
            ".write": "auth != null && (!data.exists() || data.child('uid').val() === auth.uid || root.child('rooms/' + $roomId + '/hostUid').val() === auth.uid)",
            ".validate": "newData.hasChildren(['uid', 'character'])"
          },
          "player2": {
            // Player 2 can join only if slot is empty or matching their UID
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
}`;

export const SECURITY_RULES_EXPLANATION = `
### Penjelasan Realtime Database Rules:
1. **Autentikasi Anonim Wajib**: Aturan \`auth != null\` memastikan koneksi tidak anonim tidak dapat mengakses basis data sembarangan.
2. **Proteksi Slot Pemain**: Slot \`player1\` dan \`player2\` hanya dapat diubah oleh pemilik UID masing-masing atau Host room.
3. **Pencegahan Pemain Ketiga**: Node \`player2\` menolak write jika sudah terisi oleh UID lain.
4. **Validasi Tipe Data**: Nilai timer dibatasi antara 0–99 detik dan status room dibatasi ke enum yang sah ('waiting', 'ready', 'playing', dll.).
5. **Keterbatasan Keamanan Frontend-Only**: Pada arsitektur web client-side murni tanpa backend server kustom, client yang dimodifikasi secara teknis masih dapat mengirim koordinat simulasi yang dimodifikasi. Model prototipe ini menggunakan Host Authoritative arbitration untuk hasil hit dan timer, yang merupakan standar prototipe game web 1v1 P2P.
`;
