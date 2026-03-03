import { describe, it, expect } from 'vitest';

describe('Project setup', () => {
  it('TypeScript is configured', () => {
    const value: string = 'hello';
    expect(value).toBe('hello');
  });

  it('crypto.subtle is available', async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode('test');
    const hash = await crypto.subtle.digest('SHA-256', data);
    // Use Uint8Array which works across both ArrayBuffer and Buffer
    const bytes = new Uint8Array(hash);
    expect(bytes.length).toBe(32);
  });
});
