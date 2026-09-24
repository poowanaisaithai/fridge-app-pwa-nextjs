import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  Firestore,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  FirebaseStorage,
} from 'firebase/storage';
import { FridgeItem, PushSubscriptionData } from './types';
import { INITIAL_SAMPLE_ITEMS } from './sample-data';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.apiKey !== 'AIzaSyYourFirebaseApiKeyHere' &&
  firebaseConfig.apiKey.length > 10
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (typeof window !== 'undefined' || isFirebaseConfigured) {
  try {
    if (isFirebaseConfigured) {
      app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      try {
        db = initializeFirestore(app, {
          ignoreUndefinedProperties: true,
        });
      } catch {
        db = getFirestore(app);
      }

      if (firebaseConfig.storageBucket) {
        try {
          storage = getStorage(app);
        } catch (sErr) {
          console.warn('Storage init skipped or unavailable:', sErr);
        }
      }
    }
  } catch (err) {
    console.warn('Firebase initialization note:', err);
  }
}

export { app, db, storage };

/**
 * Remove undefined fields before writing to Firestore
 */
export function cleanForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

const LOCAL_STORAGE_ITEMS_KEY = 'fresh_fridge_items_v1';
const LOCAL_STORAGE_SUBS_KEY = 'fresh_fridge_subs_v1';

// -----------------------------------------------------------------------------
// ITEMS CRUD OPERATIONS
// -----------------------------------------------------------------------------

export async function fetchFridgeItems(): Promise<FridgeItem[]> {
  if (isFirebaseConfigured && db) {
    try {
      const itemsCol = collection(db, 'items');
      const q = query(itemsCol, orderBy('expirationDate', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FridgeItem));
    } catch (err) {
      console.warn('Falling back to local storage:', err);
    }
  }

  // Fallback to LocalStorage (Demo Mode)
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_STORAGE_ITEMS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(INITIAL_SAMPLE_ITEMS));
      return INITIAL_SAMPLE_ITEMS;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      return INITIAL_SAMPLE_ITEMS;
    }
  }
  return INITIAL_SAMPLE_ITEMS;
}

export async function saveFridgeItem(item: FridgeItem): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'items', item.id);
      const cleaned = cleanForFirestore(item);
      await setDoc(docRef, cleaned, { merge: true });
      console.log('✅ [Firebase Firestore] บันทึกข้อมูลอาหารสำเร็จ:', item.name, item.id);
      return;
    } catch (err: any) {
      console.error('❌ [Firebase Firestore] บันทึกข้อมูลล้มเหลว:', err?.message || err);
    }
  } else {
    console.warn('⚠️ [Firebase] ยังไม่ได้เชื่อมต่อ Firebase หรือ db เป็น null กำลังบันทึกลง LocalStorage แทน');
  }

  // LocalStorage fallback
  if (typeof window !== 'undefined') {
    const current = await fetchFridgeItems();
    const index = current.findIndex((i) => i.id === item.id);
    let updated: FridgeItem[];
    if (index >= 0) {
      updated = current.map((i) => (i.id === item.id ? item : i));
    } else {
      updated = [item, ...current];
    }
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(updated));
  }
}

export async function removeFridgeItem(itemId: string, imageStoragePath?: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      await deleteDoc(doc(db, 'items', itemId));
      // Only delete from storage if it's an external bucket file (not inline Firestore or local demo)
      if (
        imageStoragePath &&
        imageStoragePath !== 'inline_firestore' &&
        !imageStoragePath.startsWith('local_') &&
        storage
      ) {
        const imgRef = ref(storage, imageStoragePath);
        deleteObject(imgRef).catch(() => {});
      }
      return;
    } catch (err) {
      console.warn('Firebase delete failed, falling back to local storage:', err);
    }
  }

  // LocalStorage fallback
  if (typeof window !== 'undefined') {
    const current = await fetchFridgeItems();
    const updated = current.filter((i) => i.id !== itemId);
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(updated));
  }
}

export async function markItemConsumed(itemId: string, consumed: boolean = true): Promise<void> {
  const now = new Date().toISOString();
  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, 'items', itemId), {
        consumed,
        consumedAt: consumed ? now : null,
        updatedAt: now,
      });
      return;
    } catch (err) {
      console.warn('Firebase update failed, falling back to local storage:', err);
    }
  }

  // LocalStorage fallback
  if (typeof window !== 'undefined') {
    const current = await fetchFridgeItems();
    const updated = current.map((i) =>
      i.id === itemId
        ? { ...i, consumed, consumedAt: consumed ? now : undefined, updatedAt: now }
        : i
    );
    localStorage.setItem(LOCAL_STORAGE_ITEMS_KEY, JSON.stringify(updated));
  }
}

// -----------------------------------------------------------------------------
// CLOUD STORAGE & INLINE FIRESTORE IMAGE UPLOAD (100% Free Tier - No Card Needed)
// -----------------------------------------------------------------------------

export async function uploadItemImageToStorage(
  compressedFile: File,
  itemId: string
): Promise<{ downloadUrl: string; storagePath: string }> {
  // If Firebase Storage is initialized and configured, attempt bucket upload
  if (isFirebaseConfigured && storage && firebaseConfig.storageBucket) {
    try {
      const extension = compressedFile.name.split('.').pop() || 'webp';
      const storagePath = `items/${itemId}_${Date.now()}.${extension}`;
      const storageRef = ref(storage, storagePath);

      const uploadResult = await uploadBytes(storageRef, compressedFile, {
        contentType: compressedFile.type || 'image/webp',
      });

      const downloadUrl = await getDownloadURL(uploadResult.ref);
      return { downloadUrl, storagePath };
    } catch (err) {
      console.warn(
        'Firebase Storage upload failed or requires Blaze plan. Seamlessly falling back to Firestore Inline WebP Storage:',
        err
      );
    }
  }

  // 100% Free Tier Fallback (Spark Plan / No Credit Card Needed):
  // Convert compressed WebP image to Base64 Data URL and store directly inside Firestore item document
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        downloadUrl: reader.result as string,
        storagePath: 'inline_firestore',
      });
    };
    reader.readAsDataURL(compressedFile);
  });
}

// -----------------------------------------------------------------------------
// PUSH SUBSCRIPTION STORAGE
// -----------------------------------------------------------------------------

export async function savePushSubscriptionToDb(subData: PushSubscriptionData): Promise<void> {
  // Hash endpoint to generate unique doc ID
  const subId = btoa(subData.endpoint).slice(0, 48).replace(/[^a-zA-Z0-9]/g, '_');
  const recordWithId = cleanForFirestore({ ...subData, id: subId });

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'subscriptions', subId);
      await setDoc(docRef, recordWithId, { merge: true });
      console.log('✅ [Firebase Firestore] บันทึก Push Subscription สำเร็จ:', subId);
      return;
    } catch (err: any) {
      console.error('❌ [Firebase Firestore] บันทึก Push Subscription ล้มเหลว:', err?.message || err);
    }
  }

  // LocalStorage fallback
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_SUBS_KEY, JSON.stringify(recordWithId));
  }
}
