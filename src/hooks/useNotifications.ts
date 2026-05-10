import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { NotificationRecipient, NotificationLog, OperationType } from '../types';
import { handleFirestoreError } from '../lib/errorHandler';

export function useNotifications() {
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qRecipients = query(collection(db, 'notification_recipients'), orderBy('createdAt', 'desc'));
    const unsubRecipients = onSnapshot(qRecipients, (snapshot) => {
      setRecipients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationRecipient)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notification_recipients', auth);
    });

    const qLogs = query(collection(db, 'notification_logs'), orderBy('timestamp', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NotificationLog)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notification_logs', auth);
    });

    return () => {
      unsubRecipients();
      unsubLogs();
    };
  }, []);

  const addRecipient = async (recipient: Omit<NotificationRecipient, 'id' | 'createdAt'>) => {
    const path = 'notification_recipients';
    try {
      await addDoc(collection(db, path), {
        ...recipient,
        createdAt: Date.now(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, auth);
    }
  };

  const updateRecipient = async (id: string, updates: Partial<NotificationRecipient>) => {
    const path = 'notification_recipients';
    try {
      const docRef = doc(db, path, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path, auth);
    }
  };

  const deleteRecipient = async (id: string) => {
    const path = 'notification_recipients';
    try {
      const docRef = doc(db, path, id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path, auth);
    }
  };

  return { recipients, logs, loading, addRecipient, updateRecipient, deleteRecipient };
}
