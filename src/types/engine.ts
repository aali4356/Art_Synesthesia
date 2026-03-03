export interface VersionInfo {
  engineVersion: string;
  analyzerVersion: string;
  normalizerVersion: string;
  rendererVersion: string;
}

export interface ParameterVector {
  complexity: number;
  warmth: number;
  symmetry: number;
  rhythm: number;
  energy: number;
  density: number;
  scaleVariation: number;
  curvature: number;
  saturation: number;
  contrast: number;
  layering: number;
  directionality: number;
  paletteSize: number;
  texture: number;
  regularity: number;
  extensions?: Record<string, number>;
}

export interface CanonResult {
  canonical: string;
  changes: string[];
  inputType: 'text' | 'json' | 'csv' | 'url';
}

export interface ParameterProvenance {
  parameter: string;
  value: number;
  contributors: Array<{
    signal: string;
    rawValue: number;
    weight: number;
    explanation: string;
  }>;
}
