import { describe, expect, it } from 'vitest';
import { fetchVideoTags } from '../src/watch.js';

const live = process.env['NICOTAG_LIVE'] === '1';
const describeLive = live ? describe : describe.skip;

describeLive('live nicovideo watch page', () => {
  it('fetches tags for sm9', async () => {
    const r = await fetchVideoTags({ videoId: 'sm9' });
    expect(r.videoId).toBe('sm9');
    expect(r.tags.length).toBeGreaterThan(0);
    expect(r.tagNames.length).toBe(r.tags.length);
    expect(r.tags[0]?.name.length ?? 0).toBeGreaterThan(0);
  });

  it('returns the same tags via the four extractors independently', async () => {
    const { default: fs } = await import('node:fs/promises');
    const { fetchTextWithRetry } = await import('../src/fetcher.js');
    const { extractAndParse } = await import('../src/watch.js');
    const { DEFAULT_EXTRACTOR_CHAIN } = await import('../src/extractors/index.js');

    const { text } = await fetchTextWithRetry('https://www.nicovideo.jp/watch/sm9');
    await fs.mkdir('.tmp', { recursive: true });
    await fs.writeFile('.tmp/live-watch-snapshot.html', text);

    const namesByExtractor = DEFAULT_EXTRACTOR_CHAIN.map((ext) => {
      const r = extractAndParse(text, [ext]);
      return {
        name: ext.name,
        tagNames: r.parsed.data.response.tag.items.map((t) => t.name),
      };
    });
    const first = namesByExtractor[0]?.tagNames ?? [];
    expect(first.length).toBeGreaterThan(0);
    for (const c of namesByExtractor) expect(c.tagNames).toEqual(first);
  });
});
