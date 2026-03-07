import { CompareMode } from './CompareMode';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare — Synesthesia Machine',
  description: 'Compare two inputs side by side to see how they differ in artwork and parameters.',
};

/**
 * /compare — Server Component shell.
 * Renders the CompareMode client component.
 */
export default function ComparePage() {
  return <CompareMode />;
}
