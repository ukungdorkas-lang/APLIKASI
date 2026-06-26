import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

const appletConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(appletConfig);
const db = getFirestore(app, appletConfig.firestoreDatabaseId || "(default)");

async function fix() {
  const collections = ['reports', 'gallery', 'education'];
  
  for (const colName of collections) {
    const querySnapshot = await getDocs(collection(db, colName));
    let updated = 0;
    for (const docSnap of querySnapshot.docs) {
      const data = docSnap.data();
      if (!data.created_at && data.createdAt) {
        await updateDoc(docSnap.ref, { created_at: data.createdAt });
        updated++;
      } else if (!data.created_at && !data.createdAt) {
        await updateDoc(docSnap.ref, { created_at: Date.now(), createdAt: Date.now() });
        updated++;
      } else if (!data.createdAt && data.created_at) {
        await updateDoc(docSnap.ref, { createdAt: data.created_at });
        updated++;
      }
    }
    console.log(`Updated ${updated} items in ${colName}.`);
  }
  process.exit(0);
}

fix().catch(console.error);
