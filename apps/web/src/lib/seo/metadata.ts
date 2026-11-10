import type { Metadata } from 'next';
import { publicEnv } from '@/config/env';
import { siteConfig } from '@/config/site';

export interface SocialImage {
  /** Absolute URL, or a path resolved against metadataBase. */
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface PageMetadataInput {
  title: string;
  description: string;
  /** Site-relative path of the page; it becomes the canonical and Open Graph URL. */
  path: `/${string}`;
  /** Keeps the page out of search indexes. */
  noIndex?: boolean;
  images?: readonly SocialImage[];
}

/** Site-wide defaults, exported by the root layout and refined by each page. */
export const siteMetadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: { card: 'summary', title: siteConfig.name, description: siteConfig.description },
  robots: { index: true, follow: true },
};

/**
 * Page metadata with a canonical URL, Open Graph and Twitter cards. Next.js merges metadata
 * shallowly, so every nested object is rebuilt in full here rather than relying on the layout's.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  noIndex = false,
  images = [],
}: PageMetadataInput): Metadata {
  const socialImages = images.map((image) => ({ ...image }));
  const hasImages = socialImages.length > 0;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      url: path,
      title,
      description,
      ...(hasImages ? { images: socialImages } : {}),
    },
    twitter: {
      card: hasImages ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(hasImages ? { images: socialImages } : {}),
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}
