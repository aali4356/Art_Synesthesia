import { describe, it, expect } from 'vitest';

/**
 * Integration test for share viewer -- verifies privacy contract at the
 * component prop level (SHARE-02, SHARE-03).
 */
describe('ShareViewer — SHARE-02, SHARE-03', () => {
  it('ShareViewer props interface contains no raw input fields', async () => {
    const fs = await import('fs/promises');
    const source = await fs.readFile(
      new URL(
        '../../../src/app/share/[id]/ShareViewer.tsx',
        import.meta.url
      ).pathname,
      'utf-8'
    );

    // Props interface must not contain raw input fields
    expect(source).not.toMatch(/rawInput\s*:/);
    expect(source).not.toMatch(/inputText\s*:/);
    expect(source).not.toMatch(/raw_input\s*:/);
    expect(source).not.toMatch(/originalInput\s*:/);
  });

  it('ShareViewer props interface contains the required non-sensitive fields', async () => {
    const fs = await import('fs/promises');
    const source = await fs.readFile(
      new URL(
        '../../../src/app/share/[id]/ShareViewer.tsx',
        import.meta.url
      ).pathname,
      'utf-8'
    );

    expect(source).toContain('parameterVector');
    expect(source).toContain('versionInfo');
    expect(source).toContain('styleName');
    expect(source).toContain('createdAt');
  });

  it('share page fetches only non-sensitive data from DB', async () => {
    const fs = await import('fs/promises');
    const source = await fs.readFile(
      new URL(
        '../../../src/app/share/[id]/page.tsx',
        import.meta.url
      ).pathname,
      'utf-8'
    );

    // Page passes only allowed props to ShareViewer
    expect(source).toContain('parameterVector={link.parameterVector}');
    expect(source).toContain('versionInfo={link.versionInfo}');
    expect(source).toContain('styleName={link.styleName}');
    // Must not pass any raw input
    expect(source).not.toMatch(/rawInput=|inputText=/);
  });

  it('ResultsView imports and renders ShareButton (SHARE-01 wired)', async () => {
    const fs = await import('fs/promises');
    const source = await fs.readFile(
      new URL(
        '../../../src/components/results/ResultsView.tsx',
        import.meta.url
      ).pathname,
      'utf-8'
    );

    expect(source).toContain("import { ShareButton }");
    expect(source).toContain('<ShareButton');
    expect(source).toContain('parameterVector={result.vector}');
  });
});
