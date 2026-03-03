// Polyfill crypto.subtle for jsdom environment
// Node.js has full Web Crypto support, but jsdom doesn't expose subtle
import { webcrypto } from 'node:crypto';

// jsdom may define crypto but without subtle — we need the full Web Crypto API
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}
