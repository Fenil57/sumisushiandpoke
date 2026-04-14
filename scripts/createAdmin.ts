import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file (assuming ran from root)
dotenv.config({ path: '.env' });

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
  console.error('❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env');
  process.exit(1);
}

// 1. Initialize Firebase Admin
try {
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY || '';
  // Handle escaped newlines from .env string
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
} catch (err: any) {
  console.error('❌ Failed to initialize Firebase Admin:', err.message);
  console.error('Make sure you have FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY set in .env');
  process.exit(1);
}

const auth = getAuth();
const db = getFirestore();

async function createAdminUser() {
  let uid = '';
  try {
    console.log(`Checking if user ${adminEmail} exists...`);
    const userRecord = await auth.getUserByEmail(adminEmail!);
    uid = userRecord.uid;
    console.log(`User already exists with UID: ${uid}. Ensuring password matches .env password.`);
    // Enforce password update so the client definitely knows what it is
    await auth.updateUser(uid, { password: adminPassword });
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      console.log(`Creating new user for ${adminEmail}...`);
      const newUser = await auth.createUser({
        email: adminEmail,
        password: adminPassword,
        emailVerified: true,
      });
      uid = newUser.uid;
      console.log(`✅ Created user with UID: ${uid}`);
    } else {
      console.error('❌ Error checking/creating user:', err.message);
      process.exit(1);
    }
  }

  try {
    console.log(`Setting admin role in Firestore for UID: ${uid}...`);
    await db.collection('users').doc(uid).set({
      email: adminEmail,
      role: 'admin',
      created_at: new Date(),
    }, { merge: true });
    
    console.log('\n=============================================');
    console.log('✅ Admin account configured successfully!');
    console.log(`   Email:    ${adminEmail}`);
    console.log('   Password: (from .env ADMIN_PASSWORD)');
    console.log('   Live:     You can now log in at /admin/login');
    console.log('=============================================\n');
  } catch (err: any) {
    console.error('❌ Failed to write to Firestore:', err.message);
    process.exit(1);
  }
}

createAdminUser();
