import { cheerioExtractor } from './cheerio.js';
import { nodeHtmlParserExtractor } from './node-html-parser.js';
import { regexHeExtractor } from './regex-he.js';
import { regexManualExtractor } from './regex-manual.js';
import type { Extractor, ExtractorName } from './types.js';

export { cheerioExtractor, nodeHtmlParserExtractor, regexHeExtractor, regexManualExtractor };
export type { Extractor, ExtractorName } from './types.js';

export const DEFAULT_EXTRACTOR_CHAIN: readonly Extractor[] = Object.freeze([
  cheerioExtractor,
  nodeHtmlParserExtractor,
  regexHeExtractor,
  regexManualExtractor,
]);

export function getExtractor(name: ExtractorName): Extractor {
  switch (name) {
    case 'cheerio':
      return cheerioExtractor;
    case 'node-html-parser':
      return nodeHtmlParserExtractor;
    case 'regex-he':
      return regexHeExtractor;
    case 'regex-manual':
      return regexManualExtractor;
  }
}
