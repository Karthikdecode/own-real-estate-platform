import { describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/lib/api/client';

const API = 'http://api.test/api/v1';
const REFRESH_URL = `${API}/auth/refresh`;

const SESSION = {
  user: {
    id: '8a6e0804-2bd0-4672-b79d-d97027f9071a',
    fullName: 'Asha Rao',
    email: 'asha@example.com',
    role: 'user',
  },
  accessTokenExpiresAt: '2026-11-09T10:15:00.000Z',
};

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(status: number, code: string, message: string) {
  return jsonResponse(status, { success: false, message, code, errors: [] });
}

function okResponse(data: unknown) {
  return jsonResponse(200, { success: true, message: 'OK', data });
}

describe('apiClient session refresh', () => {
  it('refreshes once for concurrent TOKEN_EXPIRED responses, then retries every request', async () => {
    let sessionRenewed = false;
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const url = String(input);
      if (url === REFRESH_URL) {
        // A real refresh takes a round trip; every first attempt fails before it completes.
        await new Promise((resolve) => setTimeout(resolve, 20));
        sessionRenewed = true;
        return okResponse(SESSION);
      }
      return sessionRenewed
        ? okResponse({ path: new URL(url).pathname })
        : errorResponse(401, 'TOKEN_EXPIRED', 'Access token expired');
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await Promise.all([
      apiClient.get('/auth/me'),
      apiClient.get('/properties/my-listings'),
      apiClient.get('/inquiries/my'),
    ]);

    expect(results).toEqual([
      { path: '/api/v1/auth/me' },
      { path: '/api/v1/properties/my-listings' },
      { path: '/api/v1/inquiries/my' },
    ]);
    const urls = fetchMock.mock.calls.map(([input]) => String(input));
    expect(urls.filter((url) => url === REFRESH_URL)).toHaveLength(1);
    expect(urls).toHaveLength(7);
    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.credentials).toBe('include');
    }
  });

  it('surfaces the refresh failure without retrying when the session cannot be renewed', async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) =>
      String(input) === REFRESH_URL
        ? errorResponse(401, 'UNAUTHENTICATED', 'Session has ended')
        : errorResponse(401, 'TOKEN_EXPIRED', 'Access token expired'),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.get('/auth/me')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      code: 'UNAUTHENTICATED',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
