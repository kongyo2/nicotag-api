import { parse } from 'node-html-parser';
import { decodeHtmlEntitiesManual } from './manual-decode.js';
import type { Extractor } from './types.js';

export const nodeHtmlParserExtractor: Extractor = {
  name: 'node-html-parser',
  extract(html: string): string {
    const root = parse(html, { lowerCaseTagName: false, comment: false });
    const tag =
      root.querySelector('meta[name="server-response"]') ??
      root.querySelector("meta[name='server-response']");
    if (!tag) {
      throw new Error('meta[name="server-response"] not found via node-html-parser');
    }
    const raw = tag.getAttribute('content');
    if (raw === undefined || raw === null || raw.length === 0) {
      throw new Error('content attribute is empty (node-html-parser)');
    }
    return decodeHtmlEntitiesManual(raw);
  },
};
