import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Resolve project root from this file's location.
// __dirname: <project>/src/__tests__/share
// 3 levels up: share/ -> __tests__/ -> src/ -> <project>/
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../..');

/**
 * Integration test for share viewer -- verifies privacy contract at the
 * component prop level (SHARE-02, SHARE-03).
 */
describe('ShareViewer — SHARE-02, SHARE-03', () => {
  it('ShareViewer props interface contains no raw input fields', async () => {
    const source = await readFile(
      resolve(projectRoot, 'src/app/share/[id]/ShareViewer.tsx'),
      'utf-8'
    );

    // Props interface must not contain raw input fields
    expect(source).not.toMatch(/rawInput\s*:/);
    expect(source).not.toMatch(/inputText\s*:/);
    expect(source).not.toMatch(/raw_input\s*:/);
    expect(source).not.toMatch(/originalInput\s*:/);
  });

  it('ShareViewer props interface contains the required non-sensitive fields', async () => {
    const source = await readFile(
      resolve(projectRoot, 'src/app/share/[id]/ShareViewer.tsx'),
      'utf-8'
    );

    expect(source).toContain('parameterVector');
    expect(source).toContain('versionInfo');
    expect(source).toContain('styleName');
    expect(source).toContain('createdAt');
  });

  it('share page fetches only non-sensitive data from DB', async () => {
    const source = await readFile(
      resolve(projectRoot, 'src/app/share/[id]/page.tsx'),
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
    const source = await readFile(
      resolve(projectRoot, 'src/components/results/ResultsView.tsx'),
      'utf-8'
    );

    expect(source).toContain("import { ShareButton }");
    expect(source).toContain('<ShareButton');
    expect(source).toContain('parameterVector={result.vector}');
  });

  it('ShareViewer imports a canvas renderer component (SHARE-02)', async () => {
    const source = await readFile(
      resolve(projectRoot, 'src/app/share/[id]/ShareViewer.tsx'),
      'utf-8'
    );

    // Must import at least one canvas renderer
    const hasCanvasImport =
      source.includes('GeometricCanvas') ||
      source.includes('OrganicCanvas') ||
      source.includes('ParticleCanvas') ||
      source.includes('TypographicCanvas');

    expect(hasCanvasImport).toBe(true);
  });

  it('ShareViewer dispatches canvas render on styleName (SHARE-02)', async () => {
    const source = await readFile(
      resolve(projectRoot, 'src/app/share/[id]/ShareViewer.tsx'),
      'utf-8'
    );

    // Must contain a switch or conditional that references styleName for canvas dispatch
    const hasStyleDispatch =
      source.includes("styleName") &&
      (source.includes('switch') || source.includes('styleName ===') || source.includes("case 'geometric'") || source.includes("case 'organic'"));

    expect(hasStyleDispatch).toBe(true);
  });

  it('share action and viewer copy preserve the parameter-only collector contract', async () => {
    const shareButtonSource = await readFile(
      resolve(projectRoot, 'src/components/results/ShareButton.tsx'),
      'utf-8'
    );
    const shareViewerSource = await readFile(
      resolve(projectRoot, 'src/app/share/[id]/ShareViewer.tsx'),
      'utf-8'
    );

    expect(shareButtonSource).toContain('Publish a view-only collector link.');
    expect(shareButtonSource).toContain('public proof route');
    expect(shareButtonSource).toContain('parameter-only');
    expect(shareViewerSource).toContain('parameter-only editions');
    expect(shareViewerSource).toContain('shared collector viewer');
    expect(shareViewerSource).toContain('The original input that generated this artwork is not stored or shown.');
  });
});
