import axios from 'axios';

export async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary');
}

import crypto from 'crypto';

export function generateImageHash(imageBuffer: Buffer): string {
  return crypto.createHash('sha256').update(imageBuffer).digest('hex');
}