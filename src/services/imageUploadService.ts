import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../lib/firebase';

function sanitizeFileBaseName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function makeUploadId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getImageExtension(file: File): string {
  const extensionByType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };

  if (extensionByType[file.type]) {
    return extensionByType[file.type];
  }

  return file.name.includes('.')
    ? file.name.split('.').pop()?.toLowerCase() || 'jpg'
    : 'jpg';
}

export async function uploadMenuItemImage(
  file: File,
  itemId: string,
  category: string,
): Promise<string> {
  const extension = getImageExtension(file);
  const safeCategory = sanitizeFileBaseName(category) || 'uncategorized';
  const safeItemId = sanitizeFileBaseName(itemId) || 'menu-item';
  const filePath = `menu-items/${safeCategory}/${safeItemId}/${Date.now()}-${makeUploadId()}.${extension}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/jpeg',
  });

  return getDownloadURL(storageRef);
}
