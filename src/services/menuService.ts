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
import i18n from 'i18next';

export function translateCustomizationText(text: string, lang?: string): string {
  const currentLang = (lang || i18n.language || 'fi').slice(0, 2).toLowerCase();
  const key = `order.customization.items.${text}`;
  return i18n.exists(key, { lng: currentLang })
    ? i18n.t(key, { lng: currentLang })
    : text;
}

export function translateItemName(name: string, lang?: string): string {
  const currentLang = (lang || i18n.language || 'fi').slice(0, 2).toLowerCase();
  const key = `order.items.${name}`;
  return i18n.exists(key, { lng: currentLang })
    ? i18n.t(key, { lng: currentLang })
    : name;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  variations?: MenuItemVariation[];
  customization_groups?: MenuCustomizationGroup[];
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

export interface MenuCustomizationOption {
  id: string;
  label: string;
  price: number;
  is_available?: boolean;
}

export interface MenuCustomizationGroup {
  id: string;
  title: string;
  min_select?: number;
  max_select: number;
  free_select_count?: number;
  default_option_ids?: string[];
  options: MenuCustomizationOption[];
}

export interface MenuCustomizationSelection {
  group_id: string;
  option_ids: string[];
}

export const DEFAULT_FOOD_IMAGE = '/images/default-food.svg';

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

export function getMenuCustomizationGroups(item: MenuItem): MenuCustomizationGroup[] {
  return (item.customization_groups || [])
    .filter((group) => group.id && group.title && Array.isArray(group.options))
    .map((group) => ({
      ...group,
      min_select: Math.max(0, Number(group.min_select) || 0),
      max_select: Math.max(1, Number(group.max_select) || 1),
      free_select_count: Math.max(0, Number(group.free_select_count) || 0),
      options: group.options
        .filter((option) => option.id && option.label && option.is_available !== false)
        .map((option) => ({
          ...option,
          price:
            typeof option.price === 'number' && !Number.isNaN(option.price)
              ? option.price
              : 0,
        })),
    }))
    .filter((group) => group.options.length > 0);
}

export function hasMenuCustomizations(item: MenuItem): boolean {
  return getMenuCustomizationGroups(item).length > 0;
}

export function calculateCustomizationPrice(
  item: MenuItem,
  selections: MenuCustomizationSelection[] = [],
): number {
  const groups = getMenuCustomizationGroups(item);

  return selections.reduce((total, selection) => {
    const group = groups.find((entry) => entry.id === selection.group_id);
    if (!group) return total;

    const freeCount = group.free_select_count || 0;
    const selectedOptions = selection.option_ids
      .map((optionId) => group.options.find((option) => option.id === optionId))
      .filter(Boolean) as MenuCustomizationOption[];

    return (
      total +
      selectedOptions.reduce(
        (groupTotal, option, index) =>
          groupTotal + (index < freeCount ? 0 : option.price || 0),
        0,
      )
    );
  }, 0);
}

export function formatCustomizationSummary(
  item: MenuItem,
  selections: MenuCustomizationSelection[] = [],
  lang?: string,
): string[] {
  const groups = getMenuCustomizationGroups(item);
  const currentLang = lang || i18n.language || 'fi';

  return selections
    .map((selection) => {
      const group = groups.find((entry) => entry.id === selection.group_id);
      if (!group) return null;

      const labels = selection.option_ids
        .map((optionId) => group.options.find((option) => option.id === optionId)?.label)
        .filter(Boolean);

      const translatedTitle = translateCustomizationText(group.title, currentLang);
      const translatedLabels = labels.map((l) => translateCustomizationText(l, currentLang));

      return translatedLabels.length > 0 ? `${translatedTitle}: ${translatedLabels.join(', ')}` : null;
    })
    .filter(Boolean) as string[];
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
