import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

export async function uploadFile(file: File | Buffer, filename: string, folder: string = 'uploads') {
  try {
    const extension = filename.split('.').pop();
    const safeFilename = `${folder}/${nanoid()}.${extension}`;
    
    const blob = await put(safeFilename, file, {
      access: 'public',
    });

    return blob.url;
  } catch (error) {
    console.error('Error uploading to Vercel Blob:', error);
    throw error;
  }
}

export async function uploadAvatar(file: File | Buffer, username: string) {
  return uploadFile(file, `${username}-avatar`, 'avatars');
}

export async function uploadBanner(file: File | Buffer, username: string) {
  return uploadFile(file, `${username}-banner`, 'banners');
}
