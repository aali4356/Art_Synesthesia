import { describe, it, expect } from 'vitest';
import { analysisKey, renderKey } from '@/lib/cache/keys';
import type { VersionInfo } from '@/types/engine';

const version: VersionInfo = {
  engineVersion: '0.1.0',
  analyzerVersion: '0.1.0',
  normalizerVersion: '0.1.0',
  rendererVersion: '0.1.0',
};

describe('Cache key generation', () => {
  describe('analysisKey', () => {
    it('includes inputHash, analyzerVersion, normalizerVersion', () => {
      const key = analysisKey('abc123', version);
      expect(key).toContain('abc123');
      expect(key).toContain('0.1.0');
      expect(key).toBe('analysis:abc123:0.1.0:0.1.0');
    });

    it('same parameters produce same key', () => {
      const key1 = analysisKey('hash1', version);
      const key2 = analysisKey('hash1', version);
      expect(key1).toBe(key2);
    });

    it('different hash produces different key', () => {
      const key1 = analysisKey('hash1', version);
      const key2 = analysisKey('hash2', version);
      expect(key1).not.toBe(key2);
    });

    it('different analyzer version produces different key', () => {
      const v2 = { ...version, analyzerVersion: '0.2.0' };
      const key1 = analysisKey('hash1', version);
      const key2 = analysisKey('hash1', v2);
      expect(key1).not.toBe(key2);
    });
  });

  describe('renderKey', () => {
    it('includes all components', () => {
      const key = renderKey('abc123', version, 'geometric', 800);
      expect(key).toBe(
        'render:abc123:0.1.0:0.1.0:0.1.0:geometric:800'
      );
    });

    it('same parameters produce same key', () => {
      const key1 = renderKey('hash1', version, 'geometric', 800);
      const key2 = renderKey('hash1', version, 'geometric', 800);
      expect(key1).toBe(key2);
    });

    it('different style produces different key', () => {
      const key1 = renderKey('hash1', version, 'geometric', 800);
      const key2 = renderKey('hash1', version, 'organic', 800);
      expect(key1).not.toBe(key2);
    });

    it('different resolution produces different key', () => {
      const key1 = renderKey('hash1', version, 'geometric', 800);
      const key2 = renderKey('hash1', version, 'geometric', 4096);
      expect(key1).not.toBe(key2);
    });

    it('different renderer version produces different key', () => {
      const v2 = { ...version, rendererVersion: '0.2.0' };
      const key1 = renderKey('hash1', version, 'geometric', 800);
      const key2 = renderKey('hash1', v2, 'geometric', 800);
      expect(key1).not.toBe(key2);
    });
  });
});
