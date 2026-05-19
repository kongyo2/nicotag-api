import { describe, expect, it, vi } from 'vitest';
import { fetchTextWithRetry } from '../src/fetcher.js';
import { AbortError, FetchError, TimeoutError } from '../src/errors.js';

function makeResponse(
  body: string,
  init: { status?: number; statusText?: string; url?: string } = {},
): Response {
  const r = new Response(body, {
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
  });
  if (init.url !== undefined) Object.defineProperty(r, 'url', { value: init.url });
  return r;
}

describe('fetchTextWithRetry', () => {
  it('returns body on first 200 response', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(makeResponse('hello', { url: 'https://x/final' }));
    const r = await fetchTextWithRetry('https://x', { fetchImpl: fetchImpl as typeof fetch });
    expect(r.text).toBe('hello');
    expect(r.attempts).toBe(1);
    expect(r.url).toBe('https://x/final');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable 5xx then succeeds', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(makeResponse('', { status: 503, statusText: 'Service Unavailable' }))
      .mockResolvedValueOnce(makeResponse('ok'));
    const sleep = vi.fn().mockResolvedValue(undefined);
    const r = await fetchTextWithRetry('https://x', {
      fetchImpl: fetchImpl as typeof fetch,
      retry: { maxRetries: 2, initialDelayMs: 1, maxDelayMs: 1, jitterRatio: 0 },
      sleep,
    });
    expect(r.text).toBe('ok');
    expect(r.attempts).toBe(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('throws FetchError immediately on non-retryable status', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(makeResponse('nope', { status: 404, statusText: 'Not Found' }));
    await expect(
      fetchTextWithRetry('https://x', {
        fetchImpl: fetchImpl as typeof fetch,
        retry: { maxRetries: 3 },
      }),
    ).rejects.toBeInstanceOf(FetchError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('throws FetchError after exhausting retries on 503', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(makeResponse('', { status: 503, statusText: 'Service Unavailable' }));
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(
      fetchTextWithRetry('https://x', {
        fetchImpl: fetchImpl as typeof fetch,
        retry: { maxRetries: 2, initialDelayMs: 1, maxDelayMs: 1, jitterRatio: 0 },
        sleep,
      }),
    ).rejects.toBeInstanceOf(FetchError);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('throws TimeoutError when the underlying fetch aborts due to timeout', async () => {
    const fetchImpl = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('aborted', 'AbortError'));
        });
      });
    });
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(
      fetchTextWithRetry('https://x', {
        fetchImpl: fetchImpl as typeof fetch,
        timeoutMs: 5,
        retry: { maxRetries: 1, initialDelayMs: 1, maxDelayMs: 1, jitterRatio: 0 },
        sleep,
      }),
    ).rejects.toBeInstanceOf(TimeoutError);
  });

  it('throws AbortError if user signal is already aborted', async () => {
    const ac = new AbortController();
    ac.abort();
    const fetchImpl = vi.fn();
    await expect(
      fetchTextWithRetry('https://x', {
        fetchImpl: fetchImpl as typeof fetch,
        signal: ac.signal,
      }),
    ).rejects.toBeInstanceOf(AbortError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('passes through User-Agent and Accept-Language headers', async () => {
    const seenHeaders: Record<string, string> = {};
    const fetchImpl = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      const h = init?.headers as Record<string, string>;
      for (const [k, v] of Object.entries(h)) seenHeaders[k] = v;
      return Promise.resolve(makeResponse('ok'));
    });
    await fetchTextWithRetry('https://x', {
      fetchImpl: fetchImpl as typeof fetch,
      userAgent: 'my-app/1.0',
      acceptLanguage: 'ja',
    });
    expect(seenHeaders['User-Agent']).toBe('my-app/1.0');
    expect(seenHeaders['Accept-Language']).toBe('ja');
  });
});
