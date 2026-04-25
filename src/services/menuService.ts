import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  variations?: MenuItemVariation[];
  category: string;
  image_url: string;
  is_available: boolean;
  is_featured?: boolean;
  tags?: string[];
  sort_order?: number;
}

export interface MenuItemVariation {
  id: string;
  label: string;
  price: number;
}

const COLLECTION = 'menu_items';

/**
 * Sort menu items by category then sort_order (client-side).
 * Avoids needing a Firestore composite index.
 */
function sortItems(items: MenuItem[]): MenuItem[] {
  const categoryOrder = [
    'Finger Foods & Appetizers',
    'Hosomaki (Small Rolls)',
    'Makit (Large Rolls)',
    'Sushi Assortments',
    'Nigiri & Gunkan',
    'Poke Bowls',
    'Woks',
    'Rice & Noodles',
    'Kids Meals',
    'Drinks',
    'Sushi',
    'Finger Foods',
  ];
  return items.sort((a, b) => {
    const catA = categoryOrder.indexOf(a.category);
    const catB = categoryOrder.indexOf(b.category);
    if (catA !== catB) return (catA === -1 ? 999 : catA) - (catB === -1 ? 999 : catB);
    return (a.sort_order || 0) - (b.sort_order || 0);
  });
}

export function getMenuItemVariations(item: MenuItem): MenuItemVariation[] {
  const savedVariations = (item.variations || []).filter(
    (variation) =>
      variation.id &&
      variation.label &&
      typeof variation.price === 'number' &&
      !Number.isNaN(variation.price),
  );

  if (savedVariations.length > 0) return savedVariations;

  return [
    {
      id: 'regular',
      label: 'Regular',
      price: item.price || 0,
    },
  ];
}

export function getDefaultMenuItemVariation(item: MenuItem): MenuItemVariation {
  return getMenuItemVariations(item)[0];
}

export function getMenuItemPriceRange(item: MenuItem): string {
  const prices = getMenuItemVariations(item).map((variation) => variation.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `€${min.toFixed(2)}` : `€${min.toFixed(2)} – €${max.toFixed(2)}`;
}

/**
 * Fetch all available menu items, sorted by category then sort_order.
 */
export async function getMenuItems(): Promise<MenuItem[]> {
  const q = query(
    collection(db, COLLECTION),
    where('is_available', '==', true)
  );
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem));
  return sortItems(items);
}

/**
 * Fetch menu items filtered by category.
 */
export async function getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
  const q = query(
    collection(db, COLLECTION),
    where('is_available', '==', true),
    where('category', '==', category)
  );
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem));
  return items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

/**
 * Fetch ALL menu items (including unavailable) — admin use.
 */
export async function getAllMenuItems(): Promise<MenuItem[]> {
  const snapshot = await getDocs(collection(db, COLLECTION));
  const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as MenuItem));
  return sortItems(items);
}

/**
 * Add or update a menu item (admin).
 */
export async function upsertMenuItem(item: MenuItem): Promise<void> {
  const ref = doc(db, COLLECTION, item.id);
  await setDoc(ref, item, { merge: true });
}

/**
 * Toggle availability of a menu item (admin).
 */
export async function toggleMenuItemAvailability(
  itemId: string,
  isAvailable: boolean
): Promise<void> {
  const ref = doc(db, COLLECTION, itemId);
  await updateDoc(ref, { is_available: isAvailable });
}

/**
 * Delete a menu item (admin).
 */
export async function deleteMenuItem(itemId: string): Promise<void> {
  const ref = doc(db, COLLECTION, itemId);
  await deleteDoc(ref);
}
