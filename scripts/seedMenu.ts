/**
 * Seed script: Populate Firestore with menu items.
 * 
 * Usage: npx tsx scripts/seedMenu.ts
 * 
 * Requires a .env file with Firebase config (non-VITE_ prefixed versions):
 *   FIREBASE_API_KEY, FIREBASE_PROJECT_ID, etc.
 *   
 * For simplicity, this script uses the Firebase client SDK with the same
 * credentials. In production, you'd use the Admin SDK with a service account.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';

dotenv.config();

// Read config from env (without VITE_ prefix for server-side)
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

/**
 * Menu items derived from Instagram data + structured for the ordering system.
 * Prices are placeholders — update them in the admin panel or re-run this script.
 * Image URLs use Unsplash since Instagram CDN links expire quickly.
 */
const menuItems = [
  // === SUSHI ===
  {
    id: 'salmon-rolls',
    name: 'Salmon Rolls',
    description: 'Fresh salmon wrapped in seasoned sushi rice and nori, sliced into bite-sized pieces.',
    price: 12.00,
    category: 'Sushi',
    image_url: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: ['Popular'],
    sort_order: 1,
  },
  {
    id: 'salmon-nigiri',
    name: 'Lohi Nigiri',
    description: 'Premium sliced salmon draped over hand-pressed seasoned rice.',
    price: 11.50,
    category: 'Sushi',
    image_url: 'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 2,
  },
  {
    id: 'flamed-salmon-nigiri',
    name: 'Flamed Salmon Nigiri',
    description: 'Torched salmon nigiri with a smoky, caramelized finish. Served with wasabi.',
    price: 13.00,
    category: 'Sushi',
    image_url: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: ['Chef\'s Choice'],
    sort_order: 3,
  },
  {
    id: 'tuna-nigiri',
    name: 'Tonikala Nigiri',
    description: 'Fresh tuna sliced over seasoned sushi rice, served with pickled ginger.',
    price: 12.50,
    category: 'Sushi',
    image_url: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 4,
  },
  {
    id: 'tuna-rolls',
    name: 'Tuna Rolls',
    description: 'Seasoned tuna rolled with rice and nori, topped with sesame seeds.',
    price: 12.00,
    category: 'Sushi',
    image_url: 'https://images.unsplash.com/photo-1558985250-27a406d64cb3?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 5,
  },
  {
    id: 'california-salmon-rolls',
    name: 'California Salmon Rolls',
    description: 'Inside-out roll with salmon, avocado, cucumber, and tobiko.',
    price: 13.50,
    category: 'Sushi',
    image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: ['Popular'],
    sort_order: 6,
  },
  {
    id: 'dragon-roll',
    name: 'Dragon Roll',
    description: 'Shrimp tempura inside, topped with avocado and eel sauce.',
    price: 15.00,
    category: 'Sushi',
    image_url: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: ['Signature'],
    sort_order: 7,
  },
  {
    id: 'mix-spice-roll',
    name: 'Mix Spice Roll',
    description: 'A blend of fresh fish and spicy mayo, rolled with crispy tempura flakes.',
    price: 14.00,
    category: 'Sushi',
    image_url: 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: ['Spicy'],
    sort_order: 8,
  },
  {
    id: 'masago-rolls',
    name: 'Masago Rolls',
    description: 'Delicate sushi rolls coated in masago (capelin roe) for a burst of ocean flavor.',
    price: 12.50,
    category: 'Sushi',
    image_url: 'https://images.unsplash.com/photo-1562802378-063ec186a863?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 9,
  },
  {
    id: 'hosomaki-salmon',
    name: 'Hosomaki Lohi',
    description: 'Traditional thin rolls with salmon and sushi rice wrapped in crisp nori.',
    price: 10.00,
    category: 'Sushi',
    image_url: 'https://images.unsplash.com/photo-1589187151053-5ec8818e661b?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 10,
  },

  // === WOKS ===
  {
    id: 'beef-devil',
    name: 'Naudanliha Devil',
    description: 'Tender strips of beef stir-fried in a fiery devil sauce with bell peppers and onions.',
    price: 14.50,
    category: 'Woks',
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: ['Spicy'],
    sort_order: 1,
  },
  {
    id: 'chicken-devil',
    name: 'Kana Devil',
    description: 'Juicy chicken pieces tossed in a bold, spicy devil sauce with vegetables.',
    price: 13.50,
    category: 'Woks',
    image_url: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: ['Spicy', 'Popular'],
    sort_order: 2,
  },
  {
    id: 'shrimp-curry',
    name: 'Katkarapu Curry',
    description: 'Succulent prawns in a rich, aromatic curry sauce with jasmine rice.',
    price: 15.00,
    category: 'Woks',
    image_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 3,
  },
  {
    id: 'beef-curry',
    name: 'Nauta Curry',
    description: 'Slow-cooked beef in a hearty Japanese-style curry sauce served with steamed rice.',
    price: 14.50,
    category: 'Woks',
    image_url: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 4,
  },
  {
    id: 'fried-rice',
    name: 'Paistettu Riisi',
    description: 'Wok-fried rice with egg, vegetables, and your choice of protein.',
    price: 11.00,
    category: 'Woks',
    image_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 5,
  },
  {
    id: 'fried-noodles',
    name: 'Paistettua Nuudeli',
    description: 'Stir-fried egg noodles with seasonal vegetables and savory sauce.',
    price: 11.50,
    category: 'Woks',
    image_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 6,
  },

  // === FINGER FOODS ===
  {
    id: 'fried-chicken',
    name: 'Paistettu Kana',
    description: 'Crispy Japanese-style fried chicken wings, golden and perfectly seasoned.',
    price: 8.50,
    category: 'Finger Foods',
    image_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: ['Popular'],
    sort_order: 1,
  },
  {
    id: 'tempura-shrimp',
    name: 'Tempura Katkarapu',
    description: 'Light and crispy battered shrimp, served with dipping sauce.',
    price: 9.00,
    category: 'Finger Foods',
    image_url: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 2,
  },
  {
    id: 'gyoza',
    name: 'Gyoza (6kpl)',
    description: 'Pan-fried pork and cabbage dumplings with a crispy bottom, served with dipping sauce.',
    price: 8.00,
    category: 'Finger Foods',
    image_url: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 3,
  },
  {
    id: 'spring-rolls',
    name: 'Kevätkääryle',
    description: 'Crispy spring rolls filled with vegetables and glass noodles, served with sweet chili.',
    price: 7.00,
    category: 'Finger Foods',
    image_url: 'https://images.unsplash.com/photo-1548507200-cf59a5a6bfc2?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 4,
  },
  {
    id: 'fried-salmon',
    name: 'Paistettu Lohi',
    description: 'Crispy pan-fried salmon bites with a golden crust, served with tartar sauce.',
    price: 10.00,
    category: 'Finger Foods',
    image_url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 5,
  },

  // === DRINKS ===
  {
    id: 'ramune-soda',
    name: 'Ramune Soda',
    description: 'Classic Japanese marble soda in original flavor.',
    price: 3.50,
    category: 'Drinks',
    image_url: 'https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 1,
  },
  {
    id: 'green-tea',
    name: 'Vihreä Tee',
    description: 'Traditional Japanese green tea, served hot.',
    price: 3.00,
    category: 'Drinks',
    image_url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 2,
  },
  {
    id: 'cola',
    name: 'Coca-Cola',
    description: 'Ice-cold Coca-Cola (0.33L).',
    price: 3.00,
    category: 'Drinks',
    image_url: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 3,
  },
  {
    id: 'water',
    name: 'Vesi',
    description: 'Still mineral water (0.5L).',
    price: 2.50,
    category: 'Drinks',
    image_url: 'https://images.unsplash.com/photo-1560023907-5f339617ea55?auto=format&fit=crop&w=800&q=80',
    is_available: true,
    tags: [],
    sort_order: 4,
  },
];


async function seed() {
  console.log('🌱 Starting menu seed...\n');
  console.log(`   Firebase project: ${firebaseConfig.projectId}`);
  console.log(`   Items to seed: ${menuItems.length}\n`);

  // Optional: authenticate as admin to satisfy security rules
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (adminEmail && adminPassword) {
    console.log(`   Authenticating as ${adminEmail}...`);
    const auth = getAuth(app);
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('   ✅ Authenticated\n');
  } else {
    console.log('   ⚠️  No ADMIN_EMAIL/ADMIN_PASSWORD in .env — writing without auth');
    console.log('   (This works if security rules allow it, or during initial setup)\n');
  }

  // Check existing items first
  const existing = await getDocs(collection(db, 'menu_items'));
  if (existing.size > 0) {
    console.log(`   ⚠️  Found ${existing.size} existing menu items. They will be overwritten.\n`);
  }

  let count = 0;
  for (const item of menuItems) {
    await setDoc(doc(db, 'menu_items', item.id), item);
    count++;
    console.log(`   ✅ [${count}/${menuItems.length}] ${item.category} → ${item.name} (€${item.price.toFixed(2)})`);
  }

  console.log(`\n🎉 Successfully seeded ${count} menu items!`);
  console.log('\n   Categories:');
  const categories = [...new Set(menuItems.map(i => i.category))];
  for (const cat of categories) {
    const catItems = menuItems.filter(i => i.category === cat);
    console.log(`     • ${cat}: ${catItems.length} items`);
  }
  
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
