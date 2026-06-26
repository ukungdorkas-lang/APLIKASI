import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const appletConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(appletConfig);
const db = getFirestore(app, appletConfig.firestoreDatabaseId || "(default)");

async function checkReports() {
  const querySnapshot = await getDocs(collection(db, 'reports'));
  console.log(`Total reports: ${querySnapshot.size}`);
  for (const docSnap of querySnapshot.docs) {
    const data = docSnap.data();
    console.log(`Report ID: ${docSnap.id}, createdAt: ${data.createdAt}, created_at: ${data.created_at}, date: ${data.date}`);
  }
  process.exit(0);
}

checkReports().catch(console.error);
