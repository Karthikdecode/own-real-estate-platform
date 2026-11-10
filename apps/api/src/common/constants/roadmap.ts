/** Delivery roadmap. Skeleton endpoints answer 501 naming the phase that implements them. */
export const ROADMAP_PHASES = {
  authentication: { number: 1, name: 'Authentication' },
  userManagement: { number: 2, name: 'User management' },
  propertyManagement: { number: 3, name: 'Property management' },
  propertyImageUploads: { number: 4, name: 'Property image uploads' },
  searchAndFiltering: { number: 5, name: 'Search and filtering' },
  paginationAndIndexing: { number: 6, name: 'Pagination and indexing' },
  similarProperties: { number: 7, name: 'Similar properties' },
  leadInquiryModule: { number: 8, name: 'Lead/inquiry module' },
  seoOptimization: { number: 9, name: 'SEO optimization' },
  performanceTesting: { number: 10, name: 'Performance testing' },
  productionDeployment: { number: 11, name: 'Production deployment' },
} as const;

export type RoadmapPhase = (typeof ROADMAP_PHASES)[keyof typeof ROADMAP_PHASES];
