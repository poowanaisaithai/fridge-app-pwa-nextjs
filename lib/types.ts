export type ExpiryStage = 'expired' | 'today' | 'urgent_3d' | 'warning_7d' | 'fresh';

export type FoodCategory =
  | 'dairy'
  | 'produce'
  | 'meat'
  | 'seafood'
  | 'bakery'
  | 'beverages'
  | 'condiments'
  | 'leftovers'
  | 'snacks'
  | 'other';

export type Compartment = 'fridge' | 'freezer' | 'pantry';

export interface FridgeItem {
  id: string;
  name: string;
  category: FoodCategory;
  compartment: Compartment;
  quantity: number;
  unit: string;
  purchaseDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  imageUrl?: string;
  imageStoragePath?: string;
  notes?: string;
  consumed: boolean;
  consumedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PushSubscriptionData {
  id?: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface OCRScanResult {
  rawText: string;
  extractedName?: string;
  extractedDate?: string; // YYYY-MM-DD
  datePatternMatched?: string;
  confidence: number;
}

export interface CategoryMeta {
  id: FoodCategory;
  nameTh: string;
  nameEn: string;
  emoji: string;
  color: string;
}

export interface CompartmentMeta {
  id: Compartment;
  nameTh: string;
  nameEn: string;
  emoji: string;
  descTh: string;
}

export interface ExpiryStatusInfo {
  stage: ExpiryStage;
  daysRemaining: number;
  labelTh: string;
  shortLabelTh: string;
  badgeClass: string;
  glowClass: string;
  borderClass: string;
  emoji: string;
}

export type UserRole = 'admin' | 'member';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
}
