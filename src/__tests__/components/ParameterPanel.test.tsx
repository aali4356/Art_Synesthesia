import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ParameterPanel } from '@/components/results/ParameterPanel';
import type { ParameterVector, ParameterProvenance, VersionInfo } from '@/types/engine';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock canvas getContext (proxy-based pattern from project)
function createMockContext(): CanvasRenderingContext2D {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop) {
      if (typeof prop === 'string') {
        return (..._args: unknown[]) => undefined;
      }
      return undefined;
    },
    set() {
      return true;
    },
  };
  return new Proxy({} as Record<string, unknown>, handler) as unknown as CanvasRenderingContext2D;
}

const originalGetContext = HTMLCanvasElement.prototype.getContext;

beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (HTMLCanvasElement.prototype as any).getContext = vi.fn(() => createMockContext());
  // Default to desktop viewport (>=768)
  Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true, configurable: true });
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  cleanup();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockVector: ParameterVector = {
  complexity: 0.65,
  density: 0.42,
  layering: 0.78,
  regularity: 0.55,
  symmetry: 0.33,
  curvature: 0.81,
  scaleVariation: 0.47,
  texture: 0.62,
  warmth: 0.71,
  energy: 0.89,
  rhythm: 0.36,
  directionality: 0.54,
  saturation: 0.73,
  contrast: 0.68,
  paletteSize: 0.45,
};

const mockProvenance: ParameterProvenance[] = [
  {
    parameter: 'complexity',
    value: 0.65,
    contributors: [
      { signal: 'vocabRichness', rawValue: 0.72, weight: 0.4, explanation: 'High vocabulary diversity' },
      { signal: 'sentenceVariation', rawValue: 0.58, weight: 0.6, explanation: 'Moderate sentence variation' },
    ],
  },
];

const mockSummaries: Record<string, string> = {
  complexity: 'High vocabulary diversity drives moderate complexity',
};

const mockVersion: VersionInfo = {
  engineVersion: '0.1.0',
  analyzerVersion: '0.2.0',
  normalizerVersion: '0.3.0',
  rendererVersion: '0.2.0',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ParameterPanel', () => {
  it('renders all 15 parameter bars in expanded state', () => {
    render(
      <ParameterPanel
        vector={mockVector}
        provenance={mockProvenance}
        summaries={mockSummaries}
        version={mockVersion}
      />
    );

    const allParams = [
      'complexity', 'density', 'layering', 'regularity',
      'symmetry', 'curvature', 'scale variation', 'texture',
      'warmth', 'energy', 'rhythm', 'directionality',
      'saturation', 'contrast', 'palette size',
    ];
    for (const param of allParams) {
      expect(screen.getByText(param)).toBeDefined();
    }
  });

  it('renders 4 group labels: Composition, Form, Expression, Color', () => {
    render(
      <ParameterPanel
        vector={mockVector}
        provenance={mockProvenance}
        summaries={mockSummaries}
        version={mockVersion}
      />
    );

    expect(screen.getByText('Composition')).toBeDefined();
    expect(screen.getByText('Form')).toBeDefined();
    expect(screen.getByText('Expression')).toBeDefined();
    expect(screen.getByText('Color')).toBeDefined();
  });

  it('displays numeric value for each parameter bar', () => {
    render(
      <ParameterPanel
        vector={mockVector}
        provenance={mockProvenance}
        summaries={mockSummaries}
        version={mockVersion}
      />
    );

    // Check a few representative values
    expect(screen.getByText('0.65')).toBeDefined(); // complexity
    expect(screen.getByText('0.42')).toBeDefined(); // density
    expect(screen.getByText('0.89')).toBeDefined(); // energy
    expect(screen.getByText('0.45')).toBeDefined(); // paletteSize
  });

  it('shows version string in footer', () => {
    render(
      <ParameterPanel
        vector={mockVector}
        provenance={mockProvenance}
        summaries={mockSummaries}
        version={mockVersion}
      />
    );

    expect(
      screen.getByText('engine:0.1.0 analyzer:0.2.0 normalizer:0.3.0 renderer:0.2.0')
    ).toBeDefined();
  });

  it('has panel collapse toggle with aria-expanded', () => {
    render(
      <ParameterPanel
        vector={mockVector}
        provenance={mockProvenance}
        summaries={mockSummaries}
        version={mockVersion}
      />
    );

    const toggle = screen.getByLabelText('Toggle parameter panel');
    expect(toggle).toBeDefined();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('collapsed state hides parameter groups on mobile (hidden class)', () => {
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true, configurable: true });

    render(
      <ParameterPanel
        vector={mockVector}
        provenance={mockProvenance}
        summaries={mockSummaries}
        version={mockVersion}
      />
    );

    // On mobile, panel should default to collapsed
    const toggle = screen.getByLabelText('Toggle parameter panel');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    // The panel body container should have 'hidden' class
    const panelBody = document.querySelector('[data-panel-body]');
    expect(panelBody).toBeDefined();
    expect(panelBody?.className).toContain('hidden');
  });

  it('Show details button controls provenance, not panel collapse', () => {
    render(
      <ParameterPanel
        vector={mockVector}
        provenance={mockProvenance}
        summaries={mockSummaries}
        version={mockVersion}
      />
    );

    // Click "Show details"
    const showDetailsBtn = screen.getByText('Show details');
    fireEvent.click(showDetailsBtn);

    // After clicking, button text should change to "Hide details"
    expect(screen.getByText('Hide details')).toBeDefined();

    // Panel body should still be visible (not collapsed)
    const panelBody = document.querySelector('[data-panel-body]');
    expect(panelBody).toBeDefined();
    expect(panelBody?.className).not.toContain('hidden');

    // The panel toggle should still show expanded
    const panelToggle = screen.getByLabelText('Toggle parameter panel');
    expect(panelToggle.getAttribute('aria-expanded')).toBe('true');
  });
});
