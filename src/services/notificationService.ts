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

// --- BAGIAN MESIN PENGIRIM KE GOOGLE SCRIPT ---
async function sendNotification(
  recipient: NotificationRecipient,
  channel: string,
  message: string,
  reportId: string
) {
  // Cari fungsi sendNotification, lalu tambahkan di bawahnya:
async function sendNotification(...) {
  // TAMBAHKAN BARIS INI:
  console.log("🔥 [DEBUG] Mencoba menghubungi Google Apps Script...");

  const gasUrl = "..."; 
  // ... sisa kode lainnya  
  // 1. URL SUDAH DIPERBAIKI (Tidak Double Lagi)
  const gasUrl ="https://script.google.com/macros/s/AKfycbxXRyb_A7rbR08LsQt0tIjAcbCROtPXr0d7yS-vH3wZXbdoxMPsNlVGhiUImsalOjm5/exec"; 

  console.log(`[Notification Service] Meneruskan laporan ke server GAS untuk ${recipient.name}...`);

  try {
    // 2. Mesin Pengirim Asli (Menghubungi Google)
    await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors', // Rahasia ampuh menembus blokiran CORS browser
      headers: {
        'Content-Type': 'text/plain', 
      },
      body: JSON.stringify({
        nomor: recipient.phoneNumber,
        pesan: message
      })
    });

    // 3. Simpan log sukses ke database
    await addDoc(collection(db, 'notification_logs'), {
      reportId,
      recipientId: recipient.id,
      recipientName: recipient.name,
      phoneNumber: recipient.phoneNumber,
      channel,
      status: 'sent',
      timestamp: Date.now(),
      messageContent: message,
      error: null
    });
    
    console.log(`[Notification Service] ✅ SUKSES: Laporan diteruskan ke GAS!`);

  } catch (err) {
    console.error('❌ GAGAL mengirim ke GAS:', err);
    // Simpan log gagal
    try {
      await addDoc(collection(db, 'notification_logs'), {
        reportId,
        recipientId: recipient.id,
        recipientName: recipient.name,
        phoneNumber: recipient.phoneNumber,
        channel,
        status: 'failed',
        timestamp: Date.now(),
        messageContent: message,
        error: String(err)
      });
    } catch (dbErr) {
      console.error('Gagal mencatat log error:', dbErr);
    }
  }
}
