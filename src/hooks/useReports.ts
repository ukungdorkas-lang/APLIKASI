import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { EmergencyReport, OperationType } from '../types';

export function useReports() {
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'operational_reports'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(q, (snapshot: any) => {
      const mappedData = snapshot.docs.map((docSnap: any) => {
        const doc = docSnap.data();
        return {
          id: docSnap.id,
          ...doc,
          createdAt: doc.created_at,
          resolvedAt: doc.resolved_at,
          reporterName: doc.reporter_name,
          phoneNumber: doc.phone_number,
          mediaUrl: doc.media_url,
          reportNumber: doc.report_number,
          officerNotes: doc.officer_notes,
          newsGenerated: doc.news_generated
        } as EmergencyReport;
      });
      setReports(mappedData);
      setLoading(false);
    }, (err: any) => {
      console.error("useReports snapshot error:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const submitReport = async (reportData: Partial<EmergencyReport>) => {
    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
      const randomStr = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const reportNumber = `DMK-${dateStr}-${randomStr}`;

      const insertData = {
        reporter_name: reportData.reporterName,
        phone_number: reportData.phoneNumber,
        type: reportData.type,
        level: reportData.level,
        description: reportData.description,
        location: reportData.location,
        media_url: reportData.mediaUrl,
        media: reportData.media,
        status: 'Menunggu Penanganan',
        report_number: reportNumber,
        created_at: Date.now(),
        news_generated: false
      };

      const docRef = await addDoc(collection(db, 'operational_reports'), insertData);
      
      const newReport = {
        id: docRef.id,
        ...insertData,
        createdAt: insertData.created_at,
        reporterName: insertData.reporter_name,
        phoneNumber: insertData.phone_number,
        mediaUrl: insertData.media_url,
        reportNumber: insertData.report_number,
        newsGenerated: insertData.news_generated
      };
      
      return newReport as EmergencyReport;
    } catch (error) {
      console.error("Create Error:", error);
      throw error;
    }
  };

  const updateStatus = async (reportId: string, status: EmergencyReport['status'], officerNotes?: string, documentation?: EmergencyReport['documentation']) => {
    try {
      const updateData: any = { status };
      if (officerNotes !== undefined) updateData.officer_notes = officerNotes;
      if (documentation !== undefined) updateData.documentation = documentation;
      if (status === 'Selesai Ditangani') updateData.resolved_at = Date.now();

      await updateDoc(doc(db, 'operational_reports', reportId), updateData);
    } catch (error) {
       console.error("Update Error:", error);
    }
  };

  return { reports, loading, submitReport, updateStatus };
}
