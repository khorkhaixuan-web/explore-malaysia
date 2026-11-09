// Review photo/video storage.
// There is no backend, so the files are kept in the browser's IndexedDB (localStorage is far too small for
// videos). The review itself only stores a small list: [{ id, type: "image" | "video", name }].
// To use a real server later, replace putMedia/getMedia/deleteMedia with upload/download calls.

export const MAX_MEDIA = 5; // files per review
export const MAX_IMAGE_MB = 10; // before compression
export const MAX_VIDEO_MB = 50;
export const ACCEPT = "image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime";

const DB = "explore-malaysia-media";
const STORE = "files";

const openDb = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const run = async (mode, fn) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = fn(tx.objectStore(STORE));
    tx.oncomplete = () => {
      db.close();
      resolve(request?.result);
    };
    tx.onerror = tx.onabort = () => {
      db.close();
      reject(tx.error || new Error("Storage error"));
    };
  });
};

export const putMedia = (id, blob) => run("readwrite", (s) => s.put(blob, id));
export const getMedia = (id) => run("readonly", (s) => s.get(id));
export const deleteMedia = (id) => run("readwrite", (s) => s.delete(id)).catch(() => {});

export const mediaType = (file) => (file.type.startsWith("video/") ? "video" : "image");

// Returns an error message, or "" when the file is fine.
export function checkFile(file) {
  const ok = ACCEPT.split(",").includes(file.type);
  if (!ok) return `"${file.name}" is not supported. Use JPG, PNG, WebP, MP4, WebM or MOV.`;
  const mb = file.size / 1024 / 1024;
  if (mediaType(file) === "image" && mb > MAX_IMAGE_MB) return `"${file.name}" is larger than ${MAX_IMAGE_MB} MB.`;
  if (mediaType(file) === "video" && mb > MAX_VIDEO_MB) return `"${file.name}" is larger than ${MAX_VIDEO_MB} MB.`;
  return "";
}

// Shrink big photos (max 1600px, JPEG) so storage is not wasted. Falls back to the original file.
export async function compressImage(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

export const newMediaId = () => `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
