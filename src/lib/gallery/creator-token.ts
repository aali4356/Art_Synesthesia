/**
 * Creator token — a random UUID stored in localStorage.
 *
 * Used to identify the creator of a gallery item without user accounts (GAL-08).
 * Not an IP address; consistent with PRIV-01 (no user tracking).
 *
 * Limitation: clearing browser storage removes ownership. This is accepted
 * behavior for a no-auth portfolio project.
 */

const STORAGE_KEY = 'synesthesia-creator-token';

/**
 * Returns the creator token from localStorage, creating one if absent.
 * Returns empty string in server-side rendering context.
 */
export function getOrCreateCreatorToken(): string {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem(STORAGE_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}

/**
 * Returns the current token without creating a new one.
 * Used to check if a token exists before attempting delete.
 */
export function getCreatorToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}
