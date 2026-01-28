import axios from 'axios';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import {join} from 'node:path';

export interface ApiInfo {
  certSha256: string;
  apiUrl: string;
}


export async function loadApiUrl(): Promise<ApiInfo> {
  const accessFileUrl = '/opt/outline/access.txt';

  const { data } = await axios.get<string>(accessFileUrl, {
    responseType: 'text',
    timeout: 5000,
  });

  const apiInfo = parseApiInfo(data);

  saveApiUrlToEnv(apiInfo.apiUrl);

  process.env.API_URL = apiInfo.apiUrl;

  return apiInfo;
}


function parseApiInfo(content: string): ApiInfo {
  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error('Invalid access file format: expected 2 lines');
  }

  const [certSha256, apiUrl] = lines;

  if (!isValidSha256(certSha256)) {
    throw new Error('Invalid cert sha256 format');
  }

  if (!isValidUrl(apiUrl)) {
    throw new Error('Invalid API URL format');
  }

  return {
    certSha256,
    apiUrl,
  };
}


function saveApiUrlToEnv(apiUrl: string): void {
  const envPath = join(process.cwd(), '.env');
  const entry = `API_URL=${apiUrl}`;

  
  if (!existsSync(envPath)) {
    writeFileSync(envPath, entry + '\n', 'utf-8');
    return;
  }

  const content = readFileSync(envPath, 'utf-8');

  
  if (/^API_URL=/m.test(content)) {
    const updated = content.replace(
      /^API_URL=.*$/m,
      entry
    );
    writeFileSync(updated, envPath, 'utf-8');
  } else {
    
    writeFileSync(
      content.trimEnd() + '\n' + entry + '\n',
      envPath,
      'utf-8'
    );
  }
}


function isValidSha256(value: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(value);
}


function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
