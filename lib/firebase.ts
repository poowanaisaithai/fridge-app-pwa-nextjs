import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
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
  firebaseConfig.apiKey !== 'AIzaSyYourFirebaseApiKeyHere'
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (typeof window !== 'undefined' || isFirebaseConfigured) {
  try {
    if (isFirebaseConfigured) {
      app = getApps().length ? getApp() : initializeApp(firebaseConfig);
      db = getFirestore(app);
      storage = getStorage(app);
    }
  } catch (err) {
    console.warn('Firebase initialization note:', err);
  }
}

export { app, db, storage };

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
      await setDoc(docRef, item, { merge: true });
      return;
    } catch (err) {
      console.warn('Firebase save failed, falling back to local storage:', err);
    }
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
      if (imageStoragePath && storage) {
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
// CLOUD STORAGE IMAGE UPLOAD (Free Tier us-central1)
// -----------------------------------------------------------------------------

export async function uploadItemImageToStorage(
  compressedFile: File,
  itemId: string
): Promise<{ downloadUrl: string; storagePath: string }> {
  if (isFirebaseConfigured && storage) {
    const extension = compressedFile.name.split('.').pop() || 'webp';
    const storagePath = `items/${itemId}_${Date.now()}.${extension}`;
    const storageRef = ref(storage, storagePath);

    const uploadResult = await uploadBytes(storageRef, compressedFile, {
      contentType: compressedFile.type || 'image/webp',
    });

    const downloadUrl = await getDownloadURL(uploadResult.ref);
    return { downloadUrl, storagePath };
  }

  // Demo mode: Return blob / data URL preview
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        downloadUrl: reader.result as string,
        storagePath: `local_demo_${Date.now()}`,
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
  const recordWithId = { ...subData, id: subId };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'subscriptions', subId);
      await setDoc(docRef, recordWithId, { merge: true });
      return;
    } catch (err) {
      console.warn('Firebase subscription save failed:', err);
    }
  }

  // LocalStorage fallback
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_SUBS_KEY, JSON.stringify(recordWithId));
  }
}
