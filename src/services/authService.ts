import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
  type Unsubscribe,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export type UserRole = 'admin' | 'staff';

export interface StaffUser {
  uid: string;
  email: string;
  role: UserRole;
}

/**
 * Sign in with email and password (staff/admin login).
 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

/**
 * Sign out the current user.
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * Listen to authentication state changes.
 */
export function onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
  return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Get current user.
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Check if a user has admin role by looking up the users collection.
 */
export async function isAdmin(uid: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return false;
    return userDoc.data()?.role === 'admin';
  } catch {
    return false;
  }
}

/**
 * Get full staff user profile from Firestore.
 */
export async function getStaffProfile(uid: string): Promise<StaffUser | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;
    const data = userDoc.data();
    return {
      uid,
      email: data.email,
      role: data.role,
    };
  } catch {
    return null;
  }
}
