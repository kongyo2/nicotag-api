import { describe, expect, it } from 'vitest';
import { WATCH_BASE_URL, buildWatchUrl } from '../src/url.js';
import { InvalidVideoIdError } from '../src/errors.js';

describe('buildWatchUrl', () => {
  it('builds URL for a valid video id', () => {
    expect(buildWatchUrl({ videoId: 'sm9' })).toBe(`${WATCH_BASE_URL}/sm9`);
    expect(buildWatchUrl({ videoId: 'nm12345' })).toBe(`${WATCH_BASE_URL}/nm12345`);
    expect(buildWatchUrl({ videoId: 'so9876' })).toBe(`${WATCH_BASE_URL}/so9876`);
  });

  it('uses custom baseUrl', () => {
    expect(buildWatchUrl({ videoId: 'sm9', baseUrl: 'http://localhost:1234/w' })).toBe(
      'http://localhost:1234/w/sm9',
    );
  });

  it('trims trailing slashes on baseUrl', () => {
    expect(buildWatchUrl({ videoId: 'sm9', baseUrl: 'http://localhost:1234/w///' })).toBe(
      'http://localhost:1234/w/sm9',
    );
  });

  it('rejects invalid video ids', () => {
    expect(() => buildWatchUrl({ videoId: 'bad' })).toThrowError(InvalidVideoIdError);
    expect(() => buildWatchUrl({ videoId: 'SM9' })).toThrowError(InvalidVideoIdError);
    expect(() => buildWatchUrl({ videoId: '' })).toThrowError(InvalidVideoIdError);
  });
});
