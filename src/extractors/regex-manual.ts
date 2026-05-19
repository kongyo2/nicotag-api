import { decodeHtmlEntitiesManual } from './manual-decode.js';
import type { Extractor } from './types.js';

const META_RE_NAME_FIRST =
  /<meta\s+name=["']server-response["']\s+content=(?:"([^"]*)"|'([^']*)')/i;
const META_RE_CONTENT_FIRST =
  /<meta\s+content=(?:"([^"]*)"|'([^']*)')\s+name=["']server-response["']/i;

export const regexManualExtractor: Extractor = {
  name: 'regex-manual',
  extract(html: string): string {
    const m1 = META_RE_NAME_FIRST.exec(html);
    const captured = m1
      ? (m1[1] ?? m1[2])
      : (() => {
          const m2 = META_RE_CONTENT_FIRST.exec(html);
          return m2 ? (m2[1] ?? m2[2]) : undefined;
        })();
    if (captured === undefined || captured.length === 0) {
      throw new Error('meta[name="server-response"] not found via regex-manual');
    }
    return decodeHtmlEntitiesManual(captured);
  },
};
