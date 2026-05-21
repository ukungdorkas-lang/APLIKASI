import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, Timestamp, getDocs, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { EmergencyReport, OperationType } from '../types';
import { handleFirestoreError } from '../lib/errorHandler';
import { processNotifications } from '../services/notificationService';

export function useReports() {
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmergencyReport));
      setReports(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reports', auth);
    });

    return () => unsubscribe();
  }, []);

  const submitReport = async (reportData: Partial<EmergencyReport>) => {
    const path = 'reports';
    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
      const randomStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const reportNumber = `DMK-${dateStr}-${randomStr}`;

      const finalData = {
        ...reportData,
        status: 'Menunggu Penanganan' as const,
        reportNumber,
        createdAt: Date.now(),
        newsGenerated: false
      };

      // 1. Simpan ke Firestore HANYA SEKALI
      const docRef = await addDoc(collection(db, path), finalData);
      
      // 2. Log Debug
      console.log("🚀 [DEBUG] Data tersimpan di Firestore, memicu notifikasi...");
      
      // 3. Trigger notifications HANYA SEKALI
      await processNotifications({ id: docRef.id, ...finalData } as EmergencyReport); 
      
      return { id: docRef.id, ...finalData };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path, auth);
      throw error;
    }
  };

  const updateStatus = async (reportId: string, status: EmergencyReport['status'], officerNotes?: string, documentation?: EmergencyReport['documentation']) => {
    const path = `reports`;
    try {
      const updateData: any = {
        status,
        updatedAt: Date.now()
      };
      if (officerNotes !== undefined) updateData.officerNotes = officerNotes;
      if (documentation !== undefined) updateData.documentation = documentation;
      if (status === 'Selesai Ditangani') updateData.resolvedAt = Date.now();

      await updateDoc(doc(db, path, reportId), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path, auth);
    }
  };

  return { reports, loading, submitReport, updateStatus };
}
