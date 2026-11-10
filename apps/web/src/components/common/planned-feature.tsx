import { useId } from 'react';
import { ROADMAP_PHASES, type RoadmapPhase } from '@/config/roadmap';

const listFormat = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

interface PlannedFeatureProps {
  phases: readonly [RoadmapPhase, ...RoadmapPhase[]];
  /** What the finished page will do, in user-facing terms. */
  capabilities: readonly string[];
}

function describePhases(phases: readonly RoadmapPhase[]): string {
  const numbers = listFormat.format(phases.map(String));
  const names = listFormat.format(phases.map((phase) => ROADMAP_PHASES[phase]));
  return `Planned for roadmap ${phases.length === 1 ? 'phase' : 'phases'} ${numbers}: ${names}`;
}

/** Honest placeholder for a page whose feature has not been built yet. */
export function PlannedFeature({ phases, capabilities }: PlannedFeatureProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="rounded-xl border border-dashed border-brand-600/50 bg-brand-50/60 p-6"
    >
      <h2 id={headingId} className="text-base font-semibold text-brand-800">
        {describePhases(phases)}
      </h2>
      <p className="mt-1 text-sm text-slate-600">This page will:</p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-slate-700">
        {capabilities.map((capability) => (
          <li key={capability}>{capability}</li>
        ))}
      </ul>
    </section>
  );
}
