import { healthStatusSchema } from '@real-estate/contracts';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { ApiError } from '@/lib/api/api-error';
import { request } from '@/lib/api/http';

const BASE_URL = 'http://api.test/api/v1';

const HEALTH = {
  status: 'ok',
  uptimeSeconds: 42,
  timestamp: '2026-11-09T10:00:00.000Z',
  checks: { database: { status: 'up', latencyMs: 3 } },
};

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

/** A fetch that only settles when its signal aborts, like a request to an unresponsive server. */
function hangUntilAborted(_input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const signal = init?.signal;
    signal?.addEventListener('abort', () => {
      reject(signal.reason);
    });
  });
}

let fetchMock: Mock<typeof fetch>;

function lastFetchCall() {
  const call = fetchMock.mock.calls.at(-1);
  if (!call) throw new Error('fetch was not called');
  const [input, init] = call;
  return { url: new URL(String(input)), init, headers: new Headers(init?.headers) };
}

beforeEach(() => {
  fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal('fetch', fetchMock);
});

describe('request', () => {
  it('returns the data of a success envelope, validated by the schema', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, message: 'OK', data: HEALTH }));

    await expect(request(BASE_URL, '/health', { schema: healthStatusSchema })).resolves.toEqual(
      HEALTH,
    );
    const { url, headers } = lastFetchCall();
    expect(url.href).toBe('http://api.test/api/v1/health');
    expect(headers.get('accept')).toBe('application/json');
  });

  it('rejects a success payload that breaks the contract as INVALID_RESPONSE', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(200, { success: true, message: 'OK', data: { status: 'ok' } }),
    );

    await expect(
      request(BASE_URL, '/health', { schema: healthStatusSchema }),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE', status: 200 });
  });

  it('turns an error envelope into an ApiError with code, details and request id', async () => {
    const details = [
      { path: 'body.email', message: 'Enter a valid email address', code: 'invalid_format' },
    ];
    fetchMock.mockResolvedValue(
      jsonResponse(400, {
        success: false,
        message: 'Request validation failed',
        code: 'VALIDATION_ERROR',
        errors: details,
        requestId: 'req-42',
      }),
    );

    const error: unknown = await request(BASE_URL, '/auth/login', { method: 'POST' }).catch(
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details,
      requestId: 'req-42',
    });
  });

  it('reports a non-JSON error body as INVALID_RESPONSE, keeping the status and request id', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>Bad gateway</html>', {
        status: 502,
        headers: { 'Content-Type': 'text/html', 'X-Request-Id': 'req-7' },
      }),
    );

    await expect(request(BASE_URL, '/health')).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
      status: 502,
      requestId: 'req-7',
    });
  });

  it('resolves 204 No Content to undefined', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(request(BASE_URL, '/auth/logout', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('maps a network failure to NETWORK_ERROR', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    await expect(request(BASE_URL, '/health')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'NETWORK_ERROR',
      status: 0,
    });
  });

  it('maps an elapsed timeout to TIMEOUT', async () => {
    fetchMock.mockImplementation(hangUntilAborted);

    await expect(request(BASE_URL, '/health', { timeoutMs: 20 })).rejects.toMatchObject({
      name: 'ApiError',
      code: 'TIMEOUT',
    });
  });

  it('lets a caller abort propagate as a cancellation instead of an ApiError', async () => {
    fetchMock.mockImplementation(hangUntilAborted);
    const controller = new AbortController();

    const pending = request(BASE_URL, '/health', { signal: controller.signal });
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('serialises the query: arrays as comma-separated lists, empty values omitted', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true, message: 'OK', data: [] }));

    await request(BASE_URL, '/properties', {
      query: {
        listingType: 'rent',
        city: 'Pune',
        propertyType: ['apartment', 'villa'],
        bedrooms: [2, 3],
        minPrice: undefined,
        maxPrice: null,
        q: '',
        cursor: undefined,
      },
    });

    const { url } = lastFetchCall();
    expect(url.pathname).toBe('/api/v1/properties');
    expect([...url.searchParams]).toEqual([
      ['listingType', 'rent'],
      ['city', 'Pune'],
      ['propertyType', 'apartment,villa'],
      ['bedrooms', '2,3'],
    ]);
  });

  it('sends plain objects as JSON with a JSON content type', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const body = { email: 'owner@example.com', password: 'correct horse' };

    await request(BASE_URL, '/auth/login', { method: 'POST', body });

    const { init, headers } = lastFetchCall();
    expect(init?.body).toBe(JSON.stringify(body));
    expect(headers.get('content-type')).toBe('application/json');
  });

  it('passes FormData through untouched, leaving Content-Type to the runtime', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(201, { success: true, message: 'Uploaded', data: [] }),
    );
    const form = new FormData();
    form.append('images', new Blob(['image-bytes'], { type: 'image/png' }), 'front.png');

    await request(BASE_URL, '/properties/p-1/images', { method: 'POST', body: form });

    const { init, headers } = lastFetchCall();
    expect(init?.body).toBe(form);
    expect(headers.has('content-type')).toBe(false);
  });
});
