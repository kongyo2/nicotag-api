import { AbortError, FetchError, TimeoutError, describeError } from './errors.js';

export const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

export type RetryOptions = {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
};

export type HttpFetchOptions = {
  userAgent?: string;
  acceptLanguage?: string;
  headers?: Readonly<Record<string, string>>;
  timeoutMs?: number;
  signal?: AbortSignal | undefined;
  retry?: RetryOptions;
  fetchImpl?: typeof fetch;
  redirect?: 'follow' | 'error' | 'manual';
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
};

const DEFAULT_RETRY: Required<RetryOptions> = {
  maxRetries: 4,
  initialDelayMs: 300,
  maxDelayMs: 5_000,
  jitterRatio: 0.3,
};

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

export type FetchTextResult = {
  text: string;
  url: string;
  status: number;
  attempts: number;
};

export async function fetchTextWithRetry(
  url: string,
  options: HttpFetchOptions = {},
): Promise<FetchTextResult> {
  const retry = { ...DEFAULT_RETRY, ...options.retry };
  const timeoutMs = options.timeoutMs ?? 15_000;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  const acceptLanguage = options.acceptLanguage ?? 'ja,en;q=0.9';
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;

  if (options.signal?.aborted) {
    throw new AbortError('Fetch aborted before start', { url });
  }

  const headers: Record<string, string> = {
    'User-Agent': userAgent,
    'Accept-Language': acceptLanguage,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    ...options.headers,
  };

  let lastError: unknown;
  for (let attempt = 0; attempt <= retry.maxRetries; attempt += 1) {
    if (options.signal?.aborted) {
      throw new AbortError('Fetch aborted', { url, attempt });
    }

    const timeoutCtl = new AbortController();
    const userSignal = options.signal;
    const onUserAbort = (): void => {
      timeoutCtl.abort(new AbortError('User aborted', { url, attempt }));
    };
    if (userSignal) userSignal.addEventListener('abort', onUserAbort, { once: true });
    const timer = setTimeout(() => {
      timeoutCtl.abort(new TimeoutError(`Fetch timed out after ${timeoutMs}ms`, { url, attempt }));
    }, timeoutMs);

    try {
      const response = await fetchImpl(url, {
        method: 'GET',
        headers,
        signal: timeoutCtl.signal,
        redirect: options.redirect ?? 'follow',
      });
      if (response.ok) {
        const text = await response.text();
        return { text, url: response.url || url, status: response.status, attempts: attempt + 1 };
      }
      const retryable = RETRYABLE_STATUS.has(response.status);
      const err = new FetchError(`HTTP ${response.status} ${response.statusText} for ${url}`, {
        url,
        attempt,
        status: response.status,
        statusText: response.statusText,
      });
      if (!retryable || attempt === retry.maxRetries) {
        throw err;
      }
      lastError = err;
    } catch (error) {
      if (error instanceof FetchError && !RETRYABLE_STATUS.has(error.status ?? 0)) {
        throw error;
      }
      if (isAbortFromUser(error, userSignal)) {
        throw error instanceof AbortError
          ? error
          : new AbortError('Fetch aborted', { url, attempt, cause: error });
      }
      if (isTimeoutAbort(error, timeoutCtl)) {
        lastError = new TimeoutError(`Fetch timed out after ${timeoutMs}ms`, {
          url,
          attempt,
          cause: error,
        });
      } else if (error instanceof FetchError) {
        lastError = error;
      } else {
        lastError = new FetchError(`Network error: ${describeError(error)}`, {
          url,
          attempt,
          cause: error,
        });
      }
      if (attempt === retry.maxRetries) {
        throw lastError;
      }
    } finally {
      clearTimeout(timer);
      if (userSignal) userSignal.removeEventListener('abort', onUserAbort);
    }

    const delay = computeBackoff(attempt, retry);
    await sleep(delay, options.signal);
  }

  throw lastError instanceof Error
    ? lastError
    : new FetchError('Unknown fetch failure', { url, cause: lastError });
}

function computeBackoff(attempt: number, retry: Required<RetryOptions>): number {
  const exp = retry.initialDelayMs * 2 ** attempt;
  const capped = Math.min(exp, retry.maxDelayMs);
  const jitter = capped * retry.jitterRatio * (Math.random() * 2 - 1);
  return Math.max(0, Math.floor(capped + jitter));
}

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new AbortError('Sleep aborted'));
      return;
    }
    const timer = setTimeout(() => {
      if (signal) signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      reject(new AbortError('Sleep aborted'));
    };
    if (signal) signal.addEventListener('abort', onAbort, { once: true });
  });
}

function isAbortFromUser(error: unknown, userSignal: AbortSignal | undefined): boolean {
  if (!userSignal?.aborted) return false;
  if (error instanceof AbortError) return true;
  return error instanceof DOMException && error.name === 'AbortError';
}

function isTimeoutAbort(error: unknown, timeoutCtl: AbortController): boolean {
  if (!timeoutCtl.signal.aborted) return false;
  if (error instanceof TimeoutError) return true;
  return error instanceof DOMException && error.name === 'AbortError';
}
