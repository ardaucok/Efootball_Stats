import { supabase } from './supabase';

export type ImageBucket = 'player-images' | 'team-images' | 'trophy-images';

export async function uploadImage(
  bucket: ImageBucket,
  file: File,
  prefix = '',
): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) return null;
  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
}
