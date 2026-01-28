import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface ApiInfo {
  certSha256: string;
  apiUrl: string;
}


export function loadApiUrl(): ApiInfo {
  const filePath = join(process.cwd(), 'access.txt');

  if (!existsSync(filePath)) {
    throw new Error(`Access file not found at ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf-8');

  const lines = content
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('Invalid access.txt format: expected at least 2 lines');
  }

  const [certSha256, apiUrl] = lines;

  if (!/^[a-fA-F0-9]{64}$/.test(certSha256)) {
    throw new Error('Invalid cert SHA256 in access.txt');
  }

  try {
    new URL(apiUrl);
  } catch {
    throw new Error('Invalid API URL in access.txt');
  }

  // Сохраняем в process.env.API_URL для удобства
  process.env.API_URL = apiUrl;

  return { certSha256, apiUrl };
}
