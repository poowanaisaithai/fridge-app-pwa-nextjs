'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  updateDoc,
} from 'firebase/firestore';
import { auth, googleProvider, db, isFirebaseConfigured, cleanForFirestore } from './firebase';
import { UserProfile, UserRole } from './types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  fetchAllUsers: () => Promise<UserProfile[]>;
  updateUserRole: (uid: string, role: UserRole) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isAdmin: false,
  isLoading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
  fetchAllUsers: async () => [],
  updateUserRole: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Monitor Auth State
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserProfile(currentUser);
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Synchronize User Profile in Firestore
  const syncUserProfile = async (fbUser: FirebaseUser) => {
    if (!db) return;

    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userDocRef);

      const now = new Date().toISOString();

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        const updated = {
          ...data,
          displayName: fbUser.displayName || data.displayName || 'สมาชิก',
          photoURL: fbUser.photoURL || data.photoURL,
          email: fbUser.email || data.email,
          lastLoginAt: now,
        };
        await updateDoc(userDocRef, cleanForFirestore({ lastLoginAt: now }));
        setUserProfile(updated);
      } else {
        // First user or specific admin emails automatically receive 'admin' role
        let role: UserRole = 'member';
        const adminEmails = [
          'poowanai.saithai@gmail.com',
          process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase(),
        ].filter(Boolean);

        if (fbUser.email && adminEmails.includes(fbUser.email.toLowerCase())) {
          role = 'admin';
        } else {
          // If this is the very first user in the system, grant admin
          const usersCol = collection(db, 'users');
          const allUsersSnap = await getDocs(usersCol);
          if (allUsersSnap.empty) {
            role = 'admin';
          }
        }

        const newProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'สมาชิก',
          photoURL: fbUser.photoURL,
          role,
          createdAt: now,
          lastLoginAt: now,
        };

        await setDoc(userDocRef, cleanForFirestore(newProfile));
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.warn('Sync user profile note:', err);
      // Fallback local state if firestore fails
      setUserProfile({
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || 'สมาชิก',
        photoURL: fbUser.photoURL,
        role: 'member',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
    }
  };

  const loginWithGoogle = async () => {
    if (!auth) {
      throw new Error('ระบบยังไม่ได้เชื่อมต่อ Firebase หรือ Auth ยังไม่พร้อมใช้งาน');
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncUserProfile(result.user);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      throw err;
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Back-office Admin Helpers
  const fetchAllUsers = async (): Promise<UserProfile[]> => {
    if (!db) return [];
    try {
      const usersCol = collection(db, 'users');
      const snap = await getDocs(usersCol);
      return snap.docs.map((d) => d.data() as UserProfile);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      return [];
    }
  };

  const updateUserRole = async (uid: string, role: UserRole): Promise<boolean> => {
    if (!db) return false;
    try {
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, { role });
      // If updating current user
      if (userProfile && userProfile.uid === uid) {
        setUserProfile({ ...userProfile, role });
      }
      return true;
    } catch (err) {
      console.error('Failed to update role:', err);
      return false;
    }
  };

  const isAdmin = userProfile?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        isLoading,
        loginWithGoogle,
        logout,
        fetchAllUsers,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
