import * as cheerio from 'cheerio';
import type { Extractor } from './types.js';

export const cheerioExtractor: Extractor = {
  name: 'cheerio',
  extract(html: string): string {
    const $ = cheerio.load(html, { xml: false });
    const tag = $('meta[name="server-response"]').first();
    if (tag.length === 0) {
      throw new Error('meta[name="server-response"] not found via cheerio');
    }
    const content = tag.attr('content');
    if (content === undefined || content.length === 0) {
      throw new Error('content attribute of server-response meta is empty (cheerio)');
    }
    return content;
  },
};
