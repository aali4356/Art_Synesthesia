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
    const [resultsViewSource, exportSource, shareSource, galleryModalSource, continuitySource, headerSource] = await Promise.all([
      readProjectFile('src/components/results/ResultsView.tsx'),
      readProjectFile('src/components/results/ExportControls.tsx'),
      readProjectFile('src/components/results/ShareButton.tsx'),
      readProjectFile('src/components/gallery/GallerySaveModal.tsx'),
      readProjectFile('src/components/continuity/RecentLocalWorkPanel.tsx'),
      readProjectFile('src/components/layout/Header.tsx'),
    ]);

    expect(resultsViewSource).toContain('Collect, export, or share this edition.');
    expect(resultsViewSource).toContain('public actions remain privacy-safe');
    expect(resultsViewSource).toContain('Keep a browser-local continuity copy.');
    expect(resultsViewSource).toContain('private same-browser recall');
    expect(exportSource).toContain('Download this collector edition.');
    expect(exportSource).toContain('Truth in export: this route currently ships 4096×4096 downloads only');
    expect(shareSource).toContain('Publish a public, view-only collector link.');
    expect(shareSource).toContain('public parameter-only proof route');
    expect(shareSource).toContain('Anyone with this URL can open the public proof route.');
    expect(galleryModalSource).toContain('Save a public gallery edition');
    expect(galleryModalSource).toContain('Recent local work stays browser-local');
    expect(galleryModalSource).toContain('public opt-in gallery save');
    expect(continuitySource).toContain('Private-first browser-local continuity for this device only.');
    expect(continuitySource).toContain('Share links are public parameter-only routes, and Gallery saves are public opt-in editions.');
    expect(headerSource).toContain('Browser-local continuity');
    expect(headerSource).toContain('Recent local work stays private to this browser on Home. Compare and Gallery are public route surfaces, not browser-local recall.');
    expect(headerSource).toContain('Route discovery stays public and shareable here, while recent local work remains a browser-local privacy boundary on the homepage only.');
    expect(headerSource).toContain("label: 'Home / Recent local work'");
  });

  it('keeps compare, gallery, and share routes in the same collector/editorial family', async () => {
    const [compareSource, galleryViewerSource, shareViewerSource, galleryCardSource, globalsSource] = await Promise.all([
      readProjectFile('src/app/compare/CompareMode.tsx'),
      readProjectFile('src/app/gallery/[id]/GalleryViewer.tsx'),
      readProjectFile('src/app/share/[id]/ShareViewer.tsx'),
      readProjectFile('src/components/gallery/GalleryCard.tsx'),
      readProjectFile('src/app/globals.css'),
    ]);

    expect(compareSource).toContain('Two proof-safe inputs, one collector route, shared style control.');
    expect(compareSource).toContain('Home, Gallery, results, share, and export');
    expect(compareSource).toContain('two collector editions');

    expect(galleryViewerSource).toContain('results-to-route action family');
    expect(galleryViewerSource).toContain('same collector/viewer framing as results and share links');
    expect(galleryViewerSource).toContain('optional contributor-approved hint');

    expect(shareViewerSource).toContain('same results-to-route action family');
    expect(shareViewerSource).toContain('shared collector viewer exposes stored rendering parameters');
    expect(shareViewerSource).toContain('The original input that generated this artwork is not stored or shown.');

    expect(galleryCardSource).toContain('Collector edition');
    expect(galleryCardSource).toContain('Reveal optional hint');
    expect(galleryCardSource).toContain('Public archive card with route-safe detail access, lightweight reactions, and no raw input exposure.');
    expect(globalsSource).toContain('.gallery-collector-card');
    expect(globalsSource).toContain('.gallery-collector-card__detail-link');
  });

  it('preserves privacy and runtime truth boundaries in continuity copy', async () => {
    const [shareButtonSource, galleryViewerSource, exportSource, continuitySource] = await Promise.all([
      readProjectFile('src/components/results/ShareButton.tsx'),
      readProjectFile('src/app/gallery/[id]/GalleryViewer.tsx'),
      readProjectFile('src/components/results/ExportControls.tsx'),
      readProjectFile('src/components/continuity/RecentLocalWorkPanel.tsx'),
    ]);

    expect(shareButtonSource).toContain('never the raw source');
    expect(galleryViewerSource).toContain('The original input is not stored.');
    expect(galleryViewerSource).toContain('optional contributor-approved hint');
    expect(exportSource).toContain('currently supported format options for this style');
    expect(exportSource).toContain('4096×4096 downloads only');
    expect(continuitySource).toContain('private recall point here');
    expect(continuitySource).toContain('The original raw source was not stored or published.');
  });

  it('keeps DB-backed detail routes truthfully branded when local proof mode cannot serve them', async () => {
    const [sharePageSource, galleryPageSource, scaffoldSource] = await Promise.all([
      readProjectFile('src/app/share/[id]/page.tsx'),
      readProjectFile('src/app/gallery/[id]/page.tsx'),
      readProjectFile('src/components/viewers/BrandedViewerScaffold.tsx'),
    ]);

    expect(sharePageSource).toContain('Share viewer unavailable');
    expect(sharePageSource).toContain('current local proof mode');
    expect(sharePageSource).toContain('working database backend');

    expect(galleryPageSource).toContain('Gallery viewer unavailable');
    expect(galleryPageSource).toContain('current local proof mode');
    expect(galleryPageSource).toContain('working database backend');

    expect(scaffoldSource).toContain('Unavailable state');
    expect(scaffoldSource).toContain('Truthful diagnostics stay visible so missing DB-backed routes never fail silently.');
  });
});
