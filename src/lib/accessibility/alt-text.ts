import type { ParameterVector } from '@/types/engine';
import type { StyleName } from '@/lib/render/types';

function describeLevel(value: number): string {
  if (value < 0.33) return 'low';
  if (value < 0.66) return 'moderate';
  return 'high';
}

function describeTemperature(warmth: number): string {
  return warmth >= 0.5 ? 'warm' : 'cool';
}

function describeStructure(vector: ParameterVector): string {
  const parts: string[] = [];

  const complexity = describeLevel(vector.complexity);
  const density = describeLevel(vector.density);
  const symmetry = describeLevel(vector.symmetry);

  parts.push(`${complexity} complexity`);
  parts.push(`${density} density`);

  if (symmetry === 'high') {
    parts.push('strong symmetry');
  } else if (symmetry === 'low') {
    parts.push('asymmetric structure');
  } else {
    parts.push('balanced structure');
  }

  return parts.join(', ');
}

function describeMotion(vector: ParameterVector): string {
  const energy = describeLevel(vector.energy);
  const rhythm = describeLevel(vector.rhythm);
  const directionality = describeLevel(vector.directionality);

  return `${energy} energy, ${rhythm} rhythm, ${directionality} directional emphasis`;
}

function describeColor(vector: ParameterVector): string {
  const temperature = describeTemperature(vector.warmth);
  const saturation = describeLevel(vector.saturation);
  const contrast = describeLevel(vector.contrast);
  const palette = describeLevel(vector.paletteSize);

  return `${temperature} palette with ${saturation} saturation, ${contrast} contrast, and ${palette} palette variety`;
}

function styleLead(style: StyleName): string {
  switch (style) {
    case 'geometric':
      return 'Generated geometric artwork';
    case 'organic':
      return 'Generated organic artwork';
    case 'particle':
      return 'Generated particle artwork';
    case 'typographic':
      return 'Generated typographic artwork';
  }
}

export function generateArtworkAltText(vector: ParameterVector, style: StyleName): string {
  return `${styleLead(style)} with ${describeStructure(vector)}, ${describeMotion(vector)}, and a ${describeColor(vector)}.`;
}
