export interface NavItem {
  readonly label: string;
  readonly href: string;
}

export interface NavGroup {
  readonly title: string;
  readonly items: readonly NavItem[];
}

export interface SiteConfig {
  readonly name: string;
  readonly description: string;
  /** Open Graph locale of the content. */
  readonly locale: string;
  /** Theme colour for browser UI; matches the brand-700 token in globals.css. */
  readonly themeColor: string;
  readonly mainNav: readonly NavItem[];
  readonly listPropertyLink: NavItem;
  readonly loginLink: NavItem;
  readonly footerNav: readonly NavGroup[];
}

export const siteConfig: SiteConfig = {
  name: 'Real Estate Platform',
  description:
    'Buy, rent or list flats, houses, villas and plots across India. Search by city, budget and configuration and deal directly with owners.',
  locale: 'en_IN',
  themeColor: '#0f766e',
  mainNav: [
    { label: 'Properties', href: '/properties' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ],
  listPropertyLink: { label: 'List your property', href: '/my-properties/create' },
  loginLink: { label: 'Login', href: '/login' },
  footerNav: [
    {
      title: 'Explore',
      items: [
        { label: 'Properties', href: '/properties' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'For owners',
      items: [
        { label: 'List your property', href: '/my-properties/create' },
        { label: 'My properties', href: '/my-properties' },
        { label: 'Login', href: '/login' },
      ],
    },
  ],
};
