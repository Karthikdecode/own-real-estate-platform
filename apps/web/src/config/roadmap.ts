/** Delivery phases of the project; placeholders and docs reference features by these numbers. */
export const ROADMAP_PHASES = {
  1: 'Authentication',
  2: 'User management',
  3: 'Property management',
  4: 'Property image uploads',
  5: 'Search and filtering',
  6: 'Pagination and indexing',
  7: 'Similar properties',
  8: 'Lead/inquiry module',
  9: 'SEO optimization',
  10: 'Performance testing',
  11: 'Production deployment',
} as const;

export type RoadmapPhase = keyof typeof ROADMAP_PHASES;
