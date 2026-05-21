async function sendNotification(
  recipient: NotificationRecipient,
  channel: string,
  message: string,
  reportId: string
) {
  // 1. HARDCODE URL GOOGLE APPS SCRIPT ANDA DI SINI
  const gasUrl = "https://script.google.com/macros/s/https://script.google.com/macros/s/AKfycbxXRyb_A7rbR08LsQt0tIjAcbCROtPXr0d7yS-vH3wZXbdoxMPsNlVGhiUImsalOjm5/exec"; 

  console.log(`[Notification Service] Meneruskan laporan ke server GAS...`);

  try {
    // 2. Mesin Pengirim Asli (Menghubungi Google)
    await fetch(gasUrl, {
      method: 'POST',
      mode: 'no-cors', // Rahasia ampuh menembus blokiran browser
      headers: {
        'Content-Type': 'text/plain', // Gunakan text/plain agar tidak ditolak Google
      },
      body: JSON.stringify({
        nomor: recipient.phoneNumber,
        pesan: message
      })
    });

    // 3. Simpan log sukses ke database Damkar
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
