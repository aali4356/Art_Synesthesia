import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../..');

async function readProjectFile(relativePath: string) {
  return readFile(resolve(projectRoot, relativePath), 'utf-8');
}

describe('product family coherence', () => {
  it('aligns results actions with collector continuity cues', async () => {
    const [resultsViewSource, exportSource, shareSource, galleryModalSource] = await Promise.all([
      readProjectFile('src/components/results/ResultsView.tsx'),
      readProjectFile('src/components/results/ExportControls.tsx'),
      readProjectFile('src/components/results/ShareButton.tsx'),
      readProjectFile('src/components/gallery/GallerySaveModal.tsx'),
    ]);

    expect(resultsViewSource).toContain('Collect, export, or share this edition.');
    expect(resultsViewSource).toContain('public actions remain privacy-safe');
    expect(exportSource).toContain('Download this collector edition.');
    expect(exportSource).toContain('Truth in export: this route currently ships 4096×4096 downloads only');
    expect(shareSource).toContain('Publish a view-only collector link.');
    expect(shareSource).toContain('parameter-only');
    expect(galleryModalSource).toContain('public gallery edition');
    expect(galleryModalSource).toContain('optional public-facing hint for the gallery edition');
  });

  it('keeps compare, gallery, and share routes in the same collector/editorial family', async () => {
    const [compareSource, galleryViewerSource, shareViewerSource] = await Promise.all([
      readProjectFile('src/app/compare/CompareMode.tsx'),
      readProjectFile('src/app/gallery/[id]/GalleryViewer.tsx'),
      readProjectFile('src/app/share/[id]/ShareViewer.tsx'),
    ]);

    expect(compareSource).toContain('Two proof-safe inputs, one collector stage, shared style control.');
    expect(compareSource).toContain('results, share, gallery, and export');
    expect(compareSource).toContain('two collector editions');

    expect(galleryViewerSource).toContain('results-to-route action family');
    expect(galleryViewerSource).toContain('same collector/viewer framing as results and share links');
    expect(galleryViewerSource).toContain('optional contributor-approved hint');

    expect(shareViewerSource).toContain('same results-to-route action family');
    expect(shareViewerSource).toContain('shared collector viewer exposes stored rendering parameters');
    expect(shareViewerSource).toContain('The original input that generated this artwork is not stored or shown.');
  });

  it('preserves privacy and runtime truth boundaries in continuity copy', async () => {
    const [shareButtonSource, galleryViewerSource, exportSource] = await Promise.all([
      readProjectFile('src/components/results/ShareButton.tsx'),
      readProjectFile('src/app/gallery/[id]/GalleryViewer.tsx'),
      readProjectFile('src/components/results/ExportControls.tsx'),
    ]);

    expect(shareButtonSource).toContain('never the raw source');
    expect(galleryViewerSource).toContain('The original input is not stored.');
    expect(galleryViewerSource).toContain('optional contributor-approved hint');
    expect(exportSource).toContain('currently supported format options for this style');
    expect(exportSource).toContain('4096×4096 downloads only');
  });
});
