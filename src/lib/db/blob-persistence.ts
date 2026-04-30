import { put, list } from '@vercel/blob';

/**
 * This is a fallback persistence layer that saves JSON data to Vercel Blob.
 * Use this only if Postgres is not available.
 */

export async function saveToBlob(key: string, data: any) {
  try {
    const json = JSON.stringify(data);
    const blob = await put(`db/${key}.json`, json, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
    });
    return blob;
  } catch (error) {
    console.error('Blob save failed:', error);
    return null;
  }
}

export async function loadFromBlob(key: string) {
  try {
    const response = await fetch(`https://${process.env.BLOB_HOSTNAME || 'public.blob.vercel-storage.com'}/db/${key}.json`, {
      cache: 'no-store'
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
}
