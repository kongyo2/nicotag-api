import { DEFAULT_EXTRACTOR_CHAIN, type Extractor, type ExtractorName } from './extractors/index.js';
import { ExtractError, type ExtractorAttempt, NicoTagError, describeError } from './errors.js';
import { fetchTextWithRetry, type HttpFetchOptions } from './fetcher.js';
import { parseServerResponseJson } from './parsers/server-response.js';
import type { ServerResponse, TagItem, TagSection, VideoSection } from './types.js';
import { buildWatchUrl } from './url.js';
import { normalizeVideoId } from './video-id.js';

export type FetchVideoOptions = {
  videoId: string;
  baseUrl?: string;
  extractors?: readonly Extractor[];
  http?: HttpFetchOptions;
};

export type FetchTagsResult = {
  readonly url: string;
  readonly fetchedAt: string;
  readonly videoId: string;
  readonly tags: ReadonlyArray<TagItem>;
  readonly tagNames: ReadonlyArray<string>;
  readonly extractorUsed: ExtractorName;
  readonly fetchAttempts: number;
  readonly extractorAttempts: ReadonlyArray<ExtractorAttempt>;
};

export type FetchVideoResult = {
  readonly url: string;
  readonly fetchedAt: string;
  readonly videoId: string;
  readonly video: VideoSection;
  readonly tag: TagSection;
  readonly serverResponse: ServerResponse;
  readonly extractorUsed: ExtractorName;
  readonly fetchAttempts: number;
  readonly extractorAttempts: ReadonlyArray<ExtractorAttempt>;
};

export async function fetchVideoTags(options: FetchVideoOptions): Promise<FetchTagsResult> {
  const result = await fetchVideo(options);
  return {
    url: result.url,
    fetchedAt: result.fetchedAt,
    videoId: result.videoId,
    tags: result.tag.items,
    tagNames: result.tag.items.map((item) => item.name),
    extractorUsed: result.extractorUsed,
    fetchAttempts: result.fetchAttempts,
    extractorAttempts: result.extractorAttempts,
  };
}

export async function fetchVideo(options: FetchVideoOptions): Promise<FetchVideoResult> {
  const videoId = normalizeVideoId(options.videoId);
  const url = buildWatchUrl({
    videoId,
    ...(options.baseUrl !== undefined ? { baseUrl: options.baseUrl } : {}),
  });
  const {
    text,
    attempts: fetchAttempts,
    url: finalUrl,
  } = await fetchTextWithRetry(url, options.http ?? {});
  const parsed = extractAndParse(text, options.extractors ?? DEFAULT_EXTRACTOR_CHAIN);
  return {
    url: finalUrl,
    fetchedAt: new Date().toISOString(),
    videoId,
    video: parsed.parsed.data.response.video,
    tag: parsed.parsed.data.response.tag,
    serverResponse: parsed.parsed,
    extractorUsed: parsed.extractorUsed,
    fetchAttempts,
    extractorAttempts: parsed.attempts,
  };
}

export type ParseHtmlResult = {
  readonly parsed: ServerResponse;
  readonly extractorUsed: ExtractorName;
  readonly attempts: ReadonlyArray<ExtractorAttempt>;
};

export function extractAndParse(
  html: string,
  extractors: readonly Extractor[] = DEFAULT_EXTRACTOR_CHAIN,
): ParseHtmlResult {
  if (extractors.length === 0) {
    throw new NicoTagError('No extractors configured');
  }
  const attempts: ExtractorAttempt[] = [];
  let lastError: unknown;
  for (const extractor of extractors) {
    try {
      const jsonText = extractor.extract(html);
      const parsed = parseServerResponseJson(jsonText);
      return { parsed, extractorUsed: extractor.name, attempts };
    } catch (error) {
      attempts.push({ extractor: extractor.name, error: describeError(error) });
      lastError = error;
    }
  }
  throw new ExtractError(
    `All ${extractors.length} extractors failed to parse server-response from HTML`,
    attempts,
    { cause: lastError },
  );
}
