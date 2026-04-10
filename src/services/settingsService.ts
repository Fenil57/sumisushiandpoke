import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SiteSettings {
  restaurantName: string;
  restaurantKanji: string;
  subtitle: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  deliveryFee: number;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
  privacyPolicyUrl: string;
  termsUrl: string;
  weekdayHours: string;
  weekdayBuffetHours: string;
  weekdayBuffetPrice: number;
  saturdayHours: string;
  saturdayBuffetHours: string;
  saturdayBuffetPrice: number;
  sundayHours: string;
  sundayBuffetHours: string;
  sundayBuffetPrice: number;
}

const SETTINGS_DOC = 'settings/general';

export const DEFAULT_SETTINGS: SiteSettings = {
  restaurantName: 'SUMI SUSHI AND POKE',
  restaurantKanji: '\u70ad',
  subtitle: 'Experience the true taste of Sumi, delivered to your door.',
  contactEmail: 'contact@sumisushi.fi',
  contactPhone: '+358 44 247 9393',
  address: 'Kuskinkatu 3\n20780 Kaarina, Finland',
  deliveryFee: 3,
  instagramUrl: '',
  facebookUrl: '',
  twitterUrl: '',
  privacyPolicyUrl: '',
  termsUrl: '',
  weekdayHours: '10:00 - 22:00',
  weekdayBuffetHours: '10:00 - 15:00',
  weekdayBuffetPrice: 12.9,
  saturdayHours: '11:00 - 22:00',
  saturdayBuffetHours: '11:00 - 15:00',
  saturdayBuffetPrice: 14.9,
  sundayHours: '11:00 - 21:00',
  sundayBuffetHours: '11:00 - 15:00',
  sundayBuffetPrice: 14.9,
};

export async function getSettings(): Promise<SiteSettings> {
  try {
    const ref = doc(db, SETTINGS_DOC);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      const settings = {
        ...DEFAULT_SETTINGS,
        ...snapshot.data(),
      } as SiteSettings;

      // Preserve the new delivery rule when older projects still have the previous default saved.
      if (settings.deliveryFee === 3.9) {
        settings.deliveryFee = DEFAULT_SETTINGS.deliveryFee;
      }

      return settings;
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSettings(
  settings: Partial<SiteSettings>,
): Promise<void> {
  const ref = doc(db, SETTINGS_DOC);
  await setDoc(ref, settings, { merge: true });
}
