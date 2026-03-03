import { Shell } from '@/components/layout/Shell';

export default function Home() {
  return (
    <Shell>
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
        {/* Placeholder for showcase artwork (future phases) */}
        <div className="w-full max-w-lg aspect-square bg-muted rounded-lg" />

        {/* Gallery-placard style tagline */}
        <p className="text-lg font-light tracking-wide text-muted">
          Turn anything into art.
        </p>

        {/* Placeholder for input zone (Phase 3) */}
        <div className="w-full max-w-md">
          <div className="h-12 bg-muted rounded-md" />
        </div>
      </div>
    </Shell>
  );
}
