import express, { type RequestHandler } from 'express';

/**
 * Serves locally stored uploads. Files get Cross-Origin-Resource-Policy: cross-origin because
 * helmet's default (same-origin) would block <img> loads from the web app on another port.
 */
export function createUploadsStaticMiddleware(uploadsDir: string): RequestHandler {
  return express.static(uploadsDir, {
    index: false,
    redirect: false,
    dotfiles: 'deny',
    immutable: true,
    maxAge: '30d',
    setHeaders: (res) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });
}
