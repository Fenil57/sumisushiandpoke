/**
 * Seed script: Populate Firestore with the Full Extracted PDF Menu items.
 * 
 * Usage: npm run seed:full OR npx tsx scripts/seedFullMenu.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
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

async function seed() {
  console.log('🌱 Starting Full Menu seed...\n');
  
  // Read Data
  const dataPath = path.resolve(process.cwd(), 'src/data/full_menu.json');
  const fileData = fs.readFileSync(dataPath, 'utf-8');
  const menuItems = JSON.parse(fileData);

  console.log(`   Firebase project: ${firebaseConfig.projectId}`);
  console.log(`   Items to seed: ${menuItems.length}\n`);

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (adminEmail && adminPassword) {
    console.log(`   Authenticating as ${adminEmail}...`);
    const auth = getAuth(app);
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('   ✅ Authenticated\n');
  } else {
    console.log('   ⚠️  No ADMIN_EMAIL/ADMIN_PASSWORD in .env — writing without auth');
  }

  // Clear existing items
  const existing = await getDocs(collection(db, 'menu_items'));
  if (existing.size > 0) {
    console.log(`   🧹 Found ${existing.size} existing items. Clearing them out...`);
    let deletedCount = 0;
    for (const docSnapshot of existing.docs) {
      await deleteDoc(doc(db, 'menu_items', docSnapshot.id));
      deletedCount++;
    }
    console.log(`   ✅ Cleared ${deletedCount} old items.\n`);
  }

  let count = 0;
  for (const item of menuItems) {
    await setDoc(doc(db, 'menu_items', item.id), item);
    count++;
    console.log(`   ✅ [${count}/${menuItems.length}] ${item.category} → ${item.name} (€${item.price.toFixed(2)})`);
  }

  console.log(`\n🎉 Successfully fully seeded ${count} menu items from PDF extraction!`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
