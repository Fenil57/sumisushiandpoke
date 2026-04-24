import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: ['.env.local', '.env'] });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function smartSeed() {
  console.log('🚀 Starting Smart Seed (Preserving manual updates)...\n');
  
  const dataPath = path.resolve(process.cwd(), 'src/data/full_menu.json');
  const fileData = fs.readFileSync(dataPath, 'utf-8');
  const menuItems = JSON.parse(fileData);

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (adminEmail && adminPassword) {
    const auth = getAuth(app);
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('   ✅ Authenticated\n');
  }

  let created = 0;
  let updated = 0;
  let skippedImages = 0;

  for (const item of menuItems) {
    const docRef = doc(db, 'menu_items', item.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Item doesn't exist, create it entirely
      await setDoc(docRef, item);
      console.log(`   ➕ Created: ${item.name}`);
      created++;
    } else {
      const existingData = docSnap.data();
      const updatePayload: any = { ...item };

      // SMART LOGIC: If the image_url in Firestore is different from the original JSON, 
      // assume it was manually updated in the Admin panel and PRESERVE it.
      if (existingData.image_url && existingData.image_url !== item.image_url) {
        console.log(`   ℹ️  Preserving manual image for: ${item.name}`);
        delete updatePayload.image_url; // Don't overwrite the image
        skippedImages++;
      }

      await setDoc(docRef, updatePayload, { merge: true });
      updated++;
    }
  }

  console.log(`\n🎉 Smart Seed Complete!`);
  console.log(`   • Created: ${created}`);
  console.log(`   • Updated/Merged: ${updated}`);
  console.log(`   • Manual Images Preserved: ${skippedImages}`);
  process.exit(0);
}

smartSeed().catch(console.error);
