'use client';

import type { PaletteResult } from '@/lib/color/palette';

interface PlaceholderCanvasProps {
  palette: PaletteResult;
  theme: 'dark' | 'light';
}

export function PlaceholderCanvas({ palette, theme }: PlaceholderCanvasProps) {
  const colors = theme === 'dark' ? palette.dark : palette.light;

  // Create a grid-based abstract composition using palette colors
  // Grid size adapts to palette count for visual balance
  const gridSize = colors.length <= 4 ? 2 : colors.length <= 6 ? 3 : 4;

  // Generate cells that fill the grid, cycling through palette colors
  const cells = Array.from({ length: gridSize * gridSize }, (_, i) => {
    const color = colors[i % colors.length];
    // Vary border radius for visual interest
    const radiusVariants = ['rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl'];
    const radius = radiusVariants[i % radiusVariants.length];
    // Vary opacity slightly for depth
    const opacity = 0.7 + (i % 3) * 0.1;

    return (
      <div
        key={i}
        className={`${radius} transition-colors duration-500`}
        style={{
          backgroundColor: color.hex,
          opacity,
        }}
      />
    );
  });

  return (
    <div className="w-full aspect-square rounded-lg overflow-hidden bg-[var(--muted)]">
      <div
        className="w-full h-full grid gap-2 p-3"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {cells}
      </div>
    </div>
  );
}
