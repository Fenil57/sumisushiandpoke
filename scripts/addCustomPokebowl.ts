import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';

// ENV_FILE lets one-off migrations target an explicit database, e.g. .env.client.
const envPath = process.env.ENV_FILE || (process.env.USE_PROD === 'true' ? '.env' : ['.env.local', '.env']);
dotenv.config({ path: envPath });

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

const CUSTOM_POKE_BOWL = {
  id: 'p8-custom-poke-bowl',
  name: 'Custom pokebowl (Omavalinta)',
  description: 'Build your own poke bowl your way — choose your base, protein, toppings and sauce. Gluten-free available on request.',
  price: 15.9,
  category: 'Poke Bowls',
  image_url: '/images/custom-pokebowl.png',
  is_available: true,
  is_featured: true,
  tags: ['Popular'],
  sort_order: 52,
  variations: [
    {
      id: 'vp8a',
      label: 'Normal Bowl',
      price: 15.9,
    },
  ],
  customization_groups: [
    {
      id: 'group-larger-dose',
      title: 'Isompi annos?',
      min_select: 1,
      max_select: 1,
      free_select_count: 0,
      default_option_ids: ['opt-no-larger'],
      options: [
        { id: 'opt-no-larger', label: 'Ei, kiitos', price: 0, is_available: true },
        { id: 'opt-yes-larger', label: 'Isompi annos, kiitos!', price: 2.0, is_available: true },
      ],
    },
    {
      id: 'group-choose-base',
      title: 'Valitse pohja',
      min_select: 1,
      max_select: 1,
      free_select_count: 0,
      default_option_ids: ['opt-rice-white'],
      options: [
        { id: 'opt-rice-white', label: 'Valkoinen riisi', price: 0, is_available: true },
        { id: 'opt-rice-sushi', label: 'Sushiriisi', price: 0, is_available: true },
        { id: 'opt-salad-mix', label: 'Sekoitettu salaatti', price: 0, is_available: true },
      ],
    },
    {
      id: 'group-choose-protein',
      title: 'Valitse proteiini',
      min_select: 0,
      max_select: 5,
      free_select_count: 2,
      options: [
        { id: 'opt-protein-grilled-salmon', label: 'Grillattu lohi', price: 2.0, is_available: true },
        { id: 'opt-protein-tuna-paste', label: 'Tonnika paste', price: 2.0, is_available: true },
        { id: 'opt-protein-raw-salmon', label: 'Raaka lohi', price: 2.0, is_available: true },
        { id: 'opt-protein-raw-tuna', label: 'Raaka tonnikala', price: 2.0, is_available: true },
        { id: 'opt-protein-shrimp', label: 'Katkarapu', price: 2.0, is_available: true },
        { id: 'opt-protein-chicken', label: 'Kananrinta', price: 2.0, is_available: true },
        { id: 'opt-protein-tofu', label: 'Tofu', price: 2.0, is_available: true },
      ],
    },
    {
      id: 'group-choose-toppings',
      title: 'Valitse lisukkeet',
      min_select: 0,
      max_select: 5,
      free_select_count: 2,
      options: [
        { id: 'opt-topping-sesame', label: 'Seesaminsiemenet', price: 0.5, is_available: true },
        { id: 'opt-topping-coconut', label: 'Kookoshiutaleet', price: 0.5, is_available: true },
        { id: 'opt-topping-nuts', label: 'Pähkinät', price: 0.5, is_available: true },
        { id: 'opt-topping-roe', label: 'Mäti', price: 0.5, is_available: true },
        { id: 'opt-topping-onion', label: 'Kevätsipuli', price: 0.5, is_available: true },
        { id: 'opt-topping-coriander', label: 'Korianteri', price: 0.5, is_available: true },
        { id: 'opt-topping-nori', label: 'Nori-merilevä', price: 0.5, is_available: true },
        { id: 'opt-topping-nachos', label: 'Nachot', price: 0.5, is_available: true },
      ],
    },
    {
      id: 'group-choose-sauce',
      title: 'Valitse kastike',
      min_select: 0,
      max_select: 4,
      free_select_count: 2,
      options: [
        { id: 'opt-sauce-eel', label: 'Ankeriaskastike', price: 1.0, is_available: true },
        { id: 'opt-sauce-mayo', label: 'Majoneesi', price: 1.0, is_available: true },
        { id: 'opt-sauce-house', label: 'Talon majoneesi', price: 1.0, is_available: true },
        { id: 'opt-sauce-teriyaki', label: 'Teriyaki', price: 1.0, is_available: true },
        { id: 'opt-sauce-spicy', label: 'Tulinen majoneesi', price: 1.0, is_available: true },
        { id: 'opt-sauce-kimchi', label: 'Kimchi kastike', price: 1.0, is_available: true },
        { id: 'opt-sauce-honey-mustard', label: 'Hunaja-sinappi', price: 1.0, is_available: true },
        { id: 'opt-sauce-garlic', label: 'Valkosipulimajoneesi', price: 1.0, is_available: true },
        { id: 'opt-sauce-wasabi', label: 'Wasabimajoneesi', price: 1.0, is_available: true },
        { id: 'opt-sauce-vegan', label: 'Vegaanimajoneesi', price: 1.0, is_available: true },
        { id: 'opt-sauce-olive', label: 'Ekstra-neitsytoliiviöljy', price: 1.0, is_available: true },
      ],
    },
    {
      id: 'group-choose-greens',
      title: 'Valitse vihreät',
      min_select: 0,
      max_select: 6,
      free_select_count: 4,
      options: [
        { id: 'opt-green-cabbage', label: 'Punakaali', price: 1.0, is_available: true },
        { id: 'opt-green-cherry-tomato', label: 'Kirsikkatomaatti', price: 1.0, is_available: true },
        { id: 'opt-green-salad', label: 'Salaatti', price: 1.0, is_available: true },
        { id: 'opt-green-wakame', label: 'Merileväsalaatti', price: 1.0, is_available: true },
        { id: 'opt-green-edamame', label: 'Soijapavut', price: 1.0, is_available: true },
        { id: 'opt-green-avocado', label: 'Avokado', price: 1.0, is_available: true },
        { id: 'opt-green-carrot', label: 'Porkkana', price: 1.0, is_available: true },
        { id: 'opt-green-red-onion', label: 'Punasipuli', price: 1.0, is_available: true },
        { id: 'opt-green-corn', label: 'Maissi', price: 1.0, is_available: true },
        { id: 'opt-green-cucumber', label: 'Kurkku', price: 1.0, is_available: true },
        { id: 'opt-green-mango', label: 'Mango', price: 1.0, is_available: true },
        { id: 'opt-green-jalapeno', label: 'Jalapeno', price: 1.0, is_available: true },
        { id: 'opt-green-egg', label: 'Kananmuna', price: 1.0, is_available: true },
        { id: 'opt-green-pineapple', label: 'Ananas', price: 1.0, is_available: true },
        { id: 'opt-green-paprika', label: 'Paprika', price: 1.0, is_available: true },
        { id: 'opt-green-guacamole', label: 'Guacamole', price: 1.0, is_available: true },
        { id: 'opt-green-radish', label: 'Retiisi', price: 1.0, is_available: true },
        { id: 'opt-green-beetroot', label: 'Etikkapunajuuri', price: 1.0, is_available: true },
        { id: 'opt-green-ginger', label: 'Pikkelöity inkivääri', price: 1.0, is_available: true },
      ],
    },
  ],
};

async function addCustomBowl() {
  console.log('🌱 Adding Custom Poke Bowl item safely to Firestore...\n');
  console.log(`   Firebase project: ${firebaseConfig.projectId}`);

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    console.log(`   Authenticating as ${adminEmail}...`);
    const auth = getAuth(app);
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('   ✅ Authenticated\n');
  } else {
    console.log('   ⚠️  No ADMIN_EMAIL/ADMIN_PASSWORD in environment — attempting write without auth');
  }

  const docRef = doc(db, 'menu_items', CUSTOM_POKE_BOWL.id);
  const existing = await getDoc(docRef);
  const payload: Partial<typeof CUSTOM_POKE_BOWL> = { ...CUSTOM_POKE_BOWL };

  if (existing.exists()) {
    const existingData = existing.data();
    if (existingData.image_url && existingData.image_url !== CUSTOM_POKE_BOWL.image_url) {
      delete payload.image_url;
      console.log('   Existing custom bowl image preserved');
    }
    console.log('   Existing custom bowl found - merging updated fields');
  } else {
    console.log('   Custom bowl not found - creating one new menu item');
  }

  await setDoc(docRef, payload, { merge: true });
  console.log(`\n🎉 Successfully added/updated "${CUSTOM_POKE_BOWL.name}" in Firestore!`);
  process.exit(0);
}

addCustomBowl().catch((err) => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
