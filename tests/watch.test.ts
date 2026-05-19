import { describe, expect, it, vi } from 'vitest';
import { extractAndParse, fetchVideo, fetchVideoTags } from '../src/watch.js';
import { ExtractError, InvalidVideoIdError, NicoTagError } from '../src/errors.js';
import { SAMPLE_TAGS, buildFixtureHtml } from './fixtures/build-fixture.js';

describe('extractAndParse', () => {
  it('returns parsed response and used extractor on success', () => {
    const html = buildFixtureHtml({
      videoId: 'sm9',
      title: 'テスト',
      tags: SAMPLE_TAGS,
    });
    const r = extractAndParse(html);
    expect(r.extractorUsed).toBe('cheerio');
    expect(r.parsed.data.response.tag.items.length).toBe(SAMPLE_TAGS.length);
    expect(r.attempts.length).toBe(0);
  });

  it('throws when extractors array is empty', () => {
    expect(() => extractAndParse('<html></html>', [])).toThrowError(NicoTagError);
  });

  it('throws ExtractError when all extractors fail', () => {
    expect(() => extractAndParse('<html><body>no meta</body></html>')).toThrowError(ExtractError);
  });
});

describe('fetchVideo / fetchVideoTags', () => {
  function makeFetchImpl(body: string): typeof fetch {
    return vi.fn().mockResolvedValue(
      new Response(body, {
        status: 200,
        statusText: 'OK',
      }),
    ) as unknown as typeof fetch;
  }

  it('returns tag array and tag names via fetchVideoTags', async () => {
    const html = buildFixtureHtml({
      videoId: 'sm9',
      title: 'テスト動画',
      tags: SAMPLE_TAGS,
    });
    const r = await fetchVideoTags({
      videoId: 'sm9',
      http: { fetchImpl: makeFetchImpl(html), retry: { maxRetries: 0 } },
    });
    expect(r.videoId).toBe('sm9');
    expect(r.tagNames).toEqual(SAMPLE_TAGS.map((t) => t.name));
    expect(r.tags[0]?.isLocked).toBe(SAMPLE_TAGS[0]?.isLocked);
    expect(r.extractorUsed).toBe('cheerio');
  });

  it('returns full video and tag sections via fetchVideo', async () => {
    const html = buildFixtureHtml({
      videoId: 'nm12345',
      title: 'もう一つの動画',
      tags: SAMPLE_TAGS,
    });
    const r = await fetchVideo({
      videoId: 'nm12345',
      http: { fetchImpl: makeFetchImpl(html), retry: { maxRetries: 0 } },
    });
    expect(r.video.id).toBe('nm12345');
    expect(r.video.title).toBe('もう一つの動画');
    expect(r.tag.items.length).toBe(SAMPLE_TAGS.length);
    expect(r.serverResponse.meta.status).toBe(200);
  });

  it('rejects invalid video id before issuing a fetch', async () => {
    const fetchImpl = vi.fn();
    await expect(
      fetchVideoTags({
        videoId: 'bad',
        http: { fetchImpl: fetchImpl as unknown as typeof fetch },
      }),
    ).rejects.toBeInstanceOf(InvalidVideoIdError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('hits the watch URL derived from the video id', async () => {
    const html = buildFixtureHtml({
      videoId: 'sm9',
      title: 't',
      tags: SAMPLE_TAGS,
    });
    const seenUrls: string[] = [];
    const fetchImpl = vi.fn().mockImplementation((url: string) => {
      seenUrls.push(url);
      return Promise.resolve(new Response(html, { status: 200 }));
    });
    await fetchVideoTags({
      videoId: 'sm9',
      http: { fetchImpl: fetchImpl as unknown as typeof fetch, retry: { maxRetries: 0 } },
    });
    expect(seenUrls[0]).toBe('https://www.nicovideo.jp/watch/sm9');
  });
});
