import { supabase } from './supabase';
import * as firestoreAdapter from './supabase-adapter';

// Attempt to synchronously resolve the current Supabase session user from localStorage on module load
let cachedUser: any = null;
try {
  if (typeof window !== "undefined" && window.localStorage) {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const stored = window.localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.user) {
            cachedUser = {
              uid: parsed.user.id,
              email: parsed.user.email,
              displayName: parsed.user.user_metadata?.full_name || parsed.user.email?.split('@')[0] || 'User'
            };
            break;
          }
        }
      }
    }
  }
} catch (e) {
  console.warn("Failed to retrieve cached Supabase session:", e);
}

// Emulate Firebase Auth behavior dynamically
class FirebaseAuthWrapper {
  private _currentUser: any = cachedUser;
  private _listeners: Set<(user: any) => void> = new Set();

  constructor() {
    // Initial fetch of session dynamically
    supabase.auth.getSession().then(({ data: { session } }) => {
      this._updateUser(session?.user || null);
    });

    // Listen to changes
    supabase.auth.onAuthStateChange((_event, session) => {
      this._updateUser(session?.user || null);
    });
  }

  private _updateUser(user: any) {
    if (user) {
      this._currentUser = {
        uid: user.id,
        email: user.email,
        displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
      };
    } else {
      this._currentUser = null;
    }
    this._listeners.forEach(cb => cb(this._currentUser));
  }

  get currentUser() {
    return this._currentUser;
  }

  onAuthStateChanged(cb: (user: any) => void) {
    this._listeners.add(cb);
    // Invoke immediately with current value
    cb(this._currentUser);
    return () => {
      this._listeners.delete(cb);
    };
  }

  async signOut() {
    await supabase.auth.signOut();
  }
}

export const auth = new FirebaseAuthWrapper();
export const db = firestoreAdapter.getFirestore();
