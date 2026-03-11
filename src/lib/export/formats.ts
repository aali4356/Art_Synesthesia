import type { StyleName } from '@/lib/render/types';

export type ExportFormat = 'png' | 'svg';

export function isSvgExportSupported(style: StyleName): boolean {
  return style === 'geometric' || style === 'typographic';
}

export function getSupportedExportFormats(style: StyleName): ExportFormat[] {
  return isSvgExportSupported(style) ? ['png', 'svg'] : ['png'];
}
