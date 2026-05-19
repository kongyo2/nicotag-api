import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EXTRACTOR_CHAIN,
  cheerioExtractor,
  nodeHtmlParserExtractor,
  regexHeExtractor,
  regexManualExtractor,
} from '../src/extractors/index.js';
import { decodeHtmlEntitiesManual } from '../src/extractors/manual-decode.js';
import {
  SAMPLE_TAGS,
  buildFixtureHtml,
  buildServerResponseJson,
} from './fixtures/build-fixture.js';

describe('extractors', () => {
  const baseOpts = {
    videoId: 'sm9',
    title: '新・豪血寺一族 -煩悩解放 - レッツゴー！陰陽師',
    tags: SAMPLE_TAGS,
  } as const;
  const expectedJson = buildServerResponseJson(baseOpts);
  const htmlNameFirst = buildFixtureHtml(baseOpts, 'name-first');
  const htmlContentFirst = buildFixtureHtml(baseOpts, 'content-first');

  for (const ext of DEFAULT_EXTRACTOR_CHAIN) {
    it(`${ext.name}: extracts identical JSON for name-first meta`, () => {
      const out = ext.extract(htmlNameFirst);
      expect(out).toBe(expectedJson);
      const parsed = JSON.parse(out) as { meta: { status: number } };
      expect(parsed.meta.status).toBe(200);
    });

    it(`${ext.name}: extracts identical JSON for content-first meta`, () => {
      const out = ext.extract(htmlContentFirst);
      expect(out).toBe(expectedJson);
    });

    it(`${ext.name}: throws when meta is absent`, () => {
      expect(() => ext.extract(`<html><body>no meta here</body></html>`)).toThrowError();
    });
  }

  it('all four extractors emit byte-identical results', () => {
    const a = cheerioExtractor.extract(htmlNameFirst);
    const b = nodeHtmlParserExtractor.extract(htmlNameFirst);
    const c = regexHeExtractor.extract(htmlNameFirst);
    const d = regexManualExtractor.extract(htmlNameFirst);
    expect(a).toBe(b);
    expect(b).toBe(c);
    expect(c).toBe(d);
  });

  describe('manual entity decoder', () => {
    it('decodes named entities', () => {
      expect(decodeHtmlEntitiesManual('&amp;&lt;&gt;&quot;&apos;&nbsp;')).toBe(`&<>"' `);
    });
    it('decodes decimal entities', () => {
      expect(decodeHtmlEntitiesManual('&#65;&#12354;&#128512;')).toBe('Aあ😀');
    });
    it('decodes hex entities (lower and upper)', () => {
      expect(decodeHtmlEntitiesManual('&#x41;&#X42;&#x1F600;')).toBe('AB😀');
    });
    it('leaves unknown entities unchanged', () => {
      expect(decodeHtmlEntitiesManual('&unknown;')).toBe('&unknown;');
    });
    it('leaves invalid numeric entities unchanged', () => {
      expect(decodeHtmlEntitiesManual('&#xZZZZ;')).toBe('&#xZZZZ;');
    });
  });
});
