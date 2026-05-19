export {
  fetchVideoTags,
  fetchVideo,
  extractAndParse,
  type FetchVideoOptions,
  type FetchTagsResult,
  type FetchVideoResult,
  type ParseHtmlResult,
} from './watch.js';

export { buildWatchUrl, WATCH_BASE_URL, type BuildWatchUrlOptions } from './url.js';

export {
  VideoIdSchema,
  isValidVideoId,
  assertVideoId,
  normalizeVideoId,
  type VideoId,
} from './video-id.js';

export {
  fetchTextWithRetry,
  DEFAULT_USER_AGENT,
  type HttpFetchOptions,
  type RetryOptions,
  type FetchTextResult,
} from './fetcher.js';

export {
  TagItemSchema,
  TagSectionSchema,
  VideoCountSchema,
  VideoSectionSchema,
  ServerResponseSchema,
  type TagItem,
  type TagSection,
  type VideoSection,
  type ServerResponse,
} from './types.js';

export {
  NicoTagError,
  InvalidVideoIdError,
  FetchError,
  TimeoutError,
  AbortError,
  ExtractError,
  ParseError,
  ValidationError,
  describeError,
  type ExtractorAttempt,
  type NicoTagErrorOptions,
} from './errors.js';

export {
  cheerioExtractor,
  nodeHtmlParserExtractor,
  regexHeExtractor,
  regexManualExtractor,
  DEFAULT_EXTRACTOR_CHAIN,
  getExtractor,
  type Extractor,
  type ExtractorName,
} from './extractors/index.js';

export { parseServerResponseJson } from './parsers/server-response.js';

export { decodeHtmlEntitiesManual } from './extractors/manual-decode.js';
