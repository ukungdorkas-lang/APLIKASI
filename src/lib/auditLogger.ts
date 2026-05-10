import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

export type AuditAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'REPORT_UPDATE' 
  | 'NEWS_GENERATED' 
  | 'USER_CREATED' 
  | 'SETTING_CHANGED';

export async function logAudit(action: AuditAction, details: string) {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      action,
      details,
      userId: auth.currentUser?.uid,
      userEmail: auth.currentUser?.email,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log audit activity:', error);
  }
}
