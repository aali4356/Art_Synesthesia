import type { PaletteResult } from '@/lib/color/palette';
import type {
  SynestheticChromaPosture,
  SynestheticContrastPosture,
  SynestheticTemperatureBias,
} from '@/lib/color/synesthetic-mapping';

const TEMPERATURE_INDEX: Record<SynestheticTemperatureBias, number> = {
  cool: 0,
  warm: 0.5,
  hot: 1,
};

const CHROMA_INDEX: Record<SynestheticChromaPosture, number> = {
  muted: 0,
  balanced: 0.4,
  lush: 0.72,
  vivid: 1,
};

const CONTRAST_INDEX: Record<SynestheticContrastPosture, number> = {
  soft: 0,
  balanced: 0.38,
  dramatic: 0.72,
  bold: 1,
};

const HARMONY_SPREAD: Record<PaletteResult['mapping']['harmony'], number> = {
  monochromatic: 0.22,
  analogous: 0.38,
  complementary: 0.92,
  splitComplementary: 0.84,
  triadic: 0.76,
  tetradic: 1,
};

export interface RendererExpressiveness {
  temperature: number;
  chromaIntensity: number;
  contrastIntensity: number;
  harmonySpread: number;
  atmosphericRichness: number;
  directionalDrama: number;
  layeringDepth: number;
  hierarchyLift: number;
  rotationFreedom: number;
  densityLift: number;
  fontVariety: number;
  placementBiasX: number;
  placementBiasY: number;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function averageLightness(paletteColors: PaletteResult['dark']): number {
  if (paletteColors.length === 0) return 0.5;
  const total = paletteColors.reduce((sum, color) => sum + (color.oklch?.l ?? 0.5), 0);
  return total / paletteColors.length;
}

export function interpretRendererExpressiveness(
  palette: PaletteResult,
  theme: 'dark' | 'light',
): RendererExpressiveness {
  const mapping = palette.mapping ?? {
    temperatureBias: 'warm',
    chromaPosture: 'balanced',
    contrastPosture: 'balanced',
    harmony: palette.harmony,
  } as PaletteResult['mapping'];
  const themeColors = theme === 'dark' ? palette.dark : palette.light;
  const temperature = TEMPERATURE_INDEX[mapping.temperatureBias];
  const chromaIntensity = CHROMA_INDEX[mapping.chromaPosture];
  const contrastIntensity = CONTRAST_INDEX[mapping.contrastPosture];
  const harmonySpread = HARMONY_SPREAD[mapping.harmony] ?? 0.5;
  const paletteLightness = averageLightness(themeColors);
  const themeLift = theme === 'dark' ? 0.08 : 0;
  const atmosphericRichness = clamp01(
    0.18 + chromaIntensity * 0.32 + contrastIntensity * 0.24 + harmonySpread * 0.16 + themeLift,
  );
  const directionalDrama = clamp01(
    0.16 + contrastIntensity * 0.42 + temperature * 0.24 + harmonySpread * 0.18,
  );
  const layeringDepth = clamp01(
    0.2 + chromaIntensity * 0.28 + contrastIntensity * 0.18 + (1 - paletteLightness) * 0.22,
  );
  const hierarchyLift = clamp01(
    0.2 + contrastIntensity * 0.35 + chromaIntensity * 0.2 + harmonySpread * 0.18,
  );
  const rotationFreedom = clamp01(
    0.14 + contrastIntensity * 0.34 + harmonySpread * 0.24 + temperature * 0.12,
  );
  const densityLift = clamp01(
    0.08 + chromaIntensity * 0.36 + contrastIntensity * 0.28 + harmonySpread * 0.18,
  );
  const fontVariety = clamp01(
    0.1 + contrastIntensity * 0.32 + chromaIntensity * 0.18 + harmonySpread * 0.3,
  );
  const placementBiasX = clamp01(0.5 + (temperature - 0.5) * 0.36 + (harmonySpread - 0.5) * 0.18);
  const placementBiasY = clamp01(0.5 - (contrastIntensity - 0.5) * 0.26 + (paletteLightness - 0.5) * 0.14);

  return {
    temperature,
    chromaIntensity,
    contrastIntensity,
    harmonySpread,
    atmosphericRichness,
    directionalDrama,
    layeringDepth,
    hierarchyLift,
    rotationFreedom,
    densityLift,
    fontVariety,
    placementBiasX,
    placementBiasY,
  };
}
