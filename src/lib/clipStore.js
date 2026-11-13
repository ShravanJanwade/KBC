// IndexedDB storage for the Host Voice Pack (recorded or imported audio clips, keyed by moment id).
// Clips never leave this device.
const DB = "kbc-voice-pack";
const STORE = "clips";

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function run(mode, fn) {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const result = fn(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(result?.result);
        tx.onerror = () => reject(tx.error);
      })
  );
}

export async function loadClips() {
  const out = new Map();
  try {
    const db = await open();
    await new Promise((resolve) => {
      const cursor = db.transaction(STORE, "readonly").objectStore(STORE).openCursor();
      cursor.onsuccess = () => {
        const c = cursor.result;
        if (!c) return resolve();
        out.set(c.key, c.value);
        c.continue();
      };
      cursor.onerror = () => resolve();
    });
  } catch {
    // IndexedDB unavailable (private mode): the game simply uses synthesised voices.
  }
  return out;
}

export const saveClip = (id, blob) => run("readwrite", (s) => s.put(blob, id));
export const deleteClip = (id) => run("readwrite", (s) => s.delete(id));
