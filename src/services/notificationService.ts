import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { EmergencyReport, NotificationRecipient, OperationType } from '../types';
import { handleFirestoreError } from '../lib/errorHandler';

/**
 * Service to handle automatic notifications when a new report is received.
 */
export async function processNotifications(report: EmergencyReport) {
  try {
    // 1. Fetch active recipients who care about this category
    const recipientsQuery = query(
      collection(db, 'notification_recipients'),
      where('isActive', '==', true)
    );
    
    let snapshot;
    try {
      snapshot = await getDocs(recipientsQuery);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'notification_recipients', auth);
      // Gracefully exit; non-admin users (such as public submitters) are not permitted to list recipients
      return;
    }
    
    const allRecipients = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NotificationRecipient));
    
    // Filter by category (IncidentType)
    const targetedRecipients = allRecipients.filter(r => r.categories.includes(report.type));

    const message = `🚨 LAPORAN DARURAT MASUK\n\n` +
      `Jenis: ${report.type}\n` +
      `Lokasi: ${report.location.address || 'Malinau'}\n` +
      `Pelapor: ${report.reporterName}\n` +
      `Waktu: ${new Date(report.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WITA\n` +
      `Level: ${report.level.toUpperCase()}\n` +
      `Deskripsi: ${report.description}\n\n` +
      `Silakan buka dashboard untuk detail lengkap.`;

    const notificationPromises = targetedRecipients.flatMap(recipient => {
      return recipient.channels.map(async (channel) => {
        return sendNotification(recipient, channel, message, report.id);
      });
    });

    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error processing notifications:', error);
  }
}

async function sendNotification(
  recipient: NotificationRecipient,
  channel: string,
  message: string,
  reportId: string
) {
  // Mocking the real API call
  console.log(`[Notification Service] Sending via ${channel} to ${recipient.name} (${recipient.phoneNumber}): ${message}`);
  
  // Simulate success/fail
  const success = Math.random() > 0.05; // 95% success rate simulation

  try {
    await addDoc(collection(db, 'notification_logs'), {
      reportId,
      recipientId: recipient.id,
      recipientName: recipient.name,
      phoneNumber: recipient.phoneNumber,
      channel,
      status: success ? 'sent' : 'failed',
      timestamp: Date.now(),
      messageContent: message,
      error: success ? null : 'Gateway Timeout (Simulated)'
    });
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.CREATE, 'notification_logs', auth);
    } catch (formattedErr) {
      console.error('Logged notification database write error:', formattedErr);
    }
  }
}
