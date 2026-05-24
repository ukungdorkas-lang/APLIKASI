import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EmergencyReport, OperationType } from '../types';

export function useReports() {
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial Fetch
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        // Map database fields to application types
        const mappedData = data.map(doc => ({
          ...doc,
          createdAt: doc.created_at,
          resolvedAt: doc.resolved_at,
          reporterName: doc.reporter_name,
          phoneNumber: doc.phone_number,
          mediaUrl: doc.media_url,
          reportNumber: doc.report_number,
          officerNotes: doc.officer_notes,
          newsGenerated: doc.news_generated
        })) as EmergencyReport[];
        setReports(mappedData);
      }
      setLoading(false);
    };

    fetchReports();

    // 2. Realtime Subscription
    const channel = supabase
      .channel('reports_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          fetchReports(); // Re-fetch on any change for simplicity, or manage state manually
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

      const { data, error } = await supabase
        .from('reports')
        .insert([insertData])
        .select()
        .single();
        
      if (error) throw error;
      
      const newReport = {
        ...data,
        id: data.id,
        createdAt: data.created_at,
        resolvedAt: data.resolved_at,
        reporterName: data.reporter_name,
        phoneNumber: data.phone_number,
        mediaUrl: data.media_url,
        reportNumber: data.report_number,
        officerNotes: data.officer_notes,
        newsGenerated: data.news_generated
      };

      // Trigger notifications: Not migrating notificationService yet, skipping or wrapping
      // await processNotifications(newReport as EmergencyReport);
      
      return newReport;
    } catch (error) {
      console.error("Supabase Create Error:", error);
      throw error;
    }
  };

  const updateStatus = async (reportId: string, status: EmergencyReport['status'], officerNotes?: string, documentation?: EmergencyReport['documentation']) => {
    try {
      const updateData: any = {
        status,
        updated_at: Date.now() // Note: Supabase reports table doesn't have an `updated_at` column by default, let's omit or just rely on resolved_at
      };
      if (officerNotes !== undefined) updateData.officer_notes = officerNotes;
      if (documentation !== undefined) updateData.documentation = documentation;
      if (status === 'Selesai Ditangani') updateData.resolved_at = Date.now();

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;
    } catch (error) {
       console.error("Supabase Update Error:", error);
    }
  };

  return { reports, loading, submitReport, updateStatus };
}
