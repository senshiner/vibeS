import type { PhotoItem } from '@/types';

/**
 * Penyimpanan foto memakai IndexedDB, bukan localStorage.
 *
 * Alasan dan batas yang jujur:
 * - localStorage hanya muat sekitar 5 MB, foto gampang melebihi itu.
 * - IndexedDB muat jauh lebih besar, tapi kuotanya tergantung browser
 *   dan perangkat, dan tidak ada angka pasti yang bisa dijanjikan.
 * - Foto hanya tersimpan di browser ini. Tidak ada sinkronisasi ke
 *   perangkat lain, dan foto hilang kalau data situs dihapus.
 * - Karena itu setiap foto dikecilkan dulu sebelum disimpan
 *   (sisi terpanjang 1600 px, JPEG kualitas 0.85).
 */

const DB_NAME = 'vibes-photos';
const STORE_NAME = 'photos';
const DB_VERSION = 1;

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MAX_SIDE_PX = 1600;

export interface StoredPhoto extends PhotoItem {
  blob: Blob;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('IndexedDB tidak bisa dibuka'));
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const request = run(transaction.objectStore(STORE_NAME));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('Gagal mengakses penyimpanan foto'));
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => reject(new Error('Gagal mengakses penyimpanan foto'));
      }),
  );
}

export async function savePhoto(photo: StoredPhoto): Promise<void> {
  await tx('readwrite', (store) => store.put(photo));
}

export async function getAllPhotos(): Promise<StoredPhoto[]> {
  const photos = await tx('readonly', (store) => store.getAll());
  return (photos as StoredPhoto[]).sort((a, b) => a.createdAt - b.createdAt);
}

export async function updatePhoto(id: string, patch: Partial<PhotoItem>): Promise<void> {
  const db = await openDb();
  const photo = await new Promise<StoredPhoto | undefined>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result as StoredPhoto | undefined);
    request.onerror = () => reject(new Error('Foto tidak ditemukan'));
  });
  if (!photo) {
    db.close();
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put({ ...photo, ...patch });
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Gagal menyimpan perubahan foto'));
  });
  db.close();
}

export async function deletePhoto(id: string): Promise<void> {
  await tx('readwrite', (store) => store.delete(id));
}

/** Kecilkan gambar ke sisi terpanjang 1600 px dan simpan sebagai JPEG. */
export async function downscaleImage(file: File): Promise<Blob> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Ukuran file maksimal 25 MB.');
  }
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas tidak tersedia di browser ini.');
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85),
    );
    if (!blob) throw new Error('Gambar gagal diproses.');
    return blob;
  } finally {
    bitmap.close();
  }
}

export function newPhotoId(): string {
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
