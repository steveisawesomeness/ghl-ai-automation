import * as dotenv from 'dotenv';

dotenv.config();

export interface GHLHeaders {
  'token-id': string;
  'channel': string;
  'source': string;
  'version': string;
  'origin': string;
  'referer': string;
  'accept': string;
  'content-type': string;
}

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

export function getToken(): string {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const token = process.env.GHL_TOKEN_ID;
  if (!token) {
    throw new Error('GHL_TOKEN_ID not set in .env');
  }

  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString('utf-8')
    );
    tokenExpiry = (payload.exp * 1000) - (5 * 60 * 1000);
    cachedToken = token;
  } catch {
    tokenExpiry = Date.now() + (50 * 60 * 1000);
    cachedToken = token;
  }

  return cachedToken;
}

export function getHeaders(contentType = true): GHLHeaders {
  const origin = process.env.GHL_ORIGIN || 'https://client-app-automation-workflows.leadconnectorhq.com';
  return {
    'token-id': getToken(),
    'channel': process.env.GHL_CHANNEL || 'APP',
    'source': process.env.GHL_SOURCE || 'WEB_USER',
    'version': process.env.GHL_VERSION || '2021-04-15',
    'origin': origin,
    'referer': origin + '/',
    'accept': 'application/json, text/plain, */*',
    'content-type': contentType ? 'application/json' : 'text/plain',
  };
}

export function clearTokenCache(): void {
  cachedToken = null;
  tokenExpiry = null;
}

export function getLocationId(): string {
  const id = process.env.GHL_LOCATION_ID;
  if (!id) throw new Error('GHL_LOCATION_ID not set in .env');
  return id;
}
