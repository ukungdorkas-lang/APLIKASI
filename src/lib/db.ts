import { supabase } from './supabase';
import * as firestoreAdapter from './supabase-adapter';

// Mock auth just in case
export const auth = {
  currentUser: { uid: 'admin-123', email: 'admin@damkar.go.id', displayName: 'Admin Damkar' },
  onAuthStateChanged: (cb: any) => cb({ uid: 'admin-123', email: 'admin@damkar.go.id', displayName: 'Admin Damkar' }),
  signOut: async () => {} 
};

export const db = firestoreAdapter.getFirestore();

