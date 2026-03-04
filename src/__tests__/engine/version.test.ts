import { describe, it, expect } from 'vitest';
import { CURRENT_VERSION, getVersionString } from '@/lib/engine/version';

describe('Engine versioning', () => {
  it('CURRENT_VERSION has all four version fields', () => {
    expect(CURRENT_VERSION.engineVersion).toBeDefined();
    expect(CURRENT_VERSION.analyzerVersion).toBeDefined();
    expect(CURRENT_VERSION.normalizerVersion).toBeDefined();
    expect(CURRENT_VERSION.rendererVersion).toBeDefined();
  });

  it('version fields are semver strings', () => {
    const semverRegex = /^\d+\.\d+\.\d+$/;
    expect(CURRENT_VERSION.engineVersion).toMatch(semverRegex);
    expect(CURRENT_VERSION.analyzerVersion).toMatch(semverRegex);
    expect(CURRENT_VERSION.normalizerVersion).toMatch(semverRegex);
    expect(CURRENT_VERSION.rendererVersion).toMatch(semverRegex);
  });

  it('rendererVersion reflects multi-style renderer integration (0.3.0)', () => {
    expect(CURRENT_VERSION.rendererVersion).toBe('0.3.0');
  });

  it('getVersionString returns formatted version string', () => {
    const str = getVersionString();
    expect(str).toContain('engine:');
    expect(str).toContain('analyzer:');
    expect(str).toContain('normalizer:');
    expect(str).toContain('renderer:');
  });

  it('getVersionString accepts custom version', () => {
    const custom = {
      engineVersion: '2.0.0',
      analyzerVersion: '1.5.0',
      normalizerVersion: '1.3.0',
      rendererVersion: '1.1.0',
    };
    const str = getVersionString(custom);
    expect(str).toBe(
      'engine:2.0.0 analyzer:1.5.0 normalizer:1.3.0 renderer:1.1.0'
    );
  });
});
