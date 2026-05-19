import { describe, expect, it } from 'vitest';
import {
  AbortError,
  ExtractError,
  FetchError,
  InvalidVideoIdError,
  NicoTagError,
  ParseError,
  TimeoutError,
  ValidationError,
  describeError,
} from '../src/errors.js';

describe('errors', () => {
  it('NicoTagError carries url/videoId/attempt fields', () => {
    const err = new NicoTagError('boom', { url: 'https://x', videoId: 'sm9', attempt: 2 });
    expect(err.name).toBe('NicoTagError');
    expect(err.url).toBe('https://x');
    expect(err.videoId).toBe('sm9');
    expect(err.attempt).toBe(2);
  });

  it('subclasses set their own name', () => {
    expect(new InvalidVideoIdError('').name).toBe('InvalidVideoIdError');
    expect(new FetchError('').name).toBe('FetchError');
    expect(new TimeoutError('').name).toBe('TimeoutError');
    expect(new AbortError('').name).toBe('AbortError');
    expect(new ExtractError('', []).name).toBe('ExtractError');
    expect(new ParseError('').name).toBe('ParseError');
    expect(new ValidationError('', []).name).toBe('ValidationError');
  });

  it('FetchError captures status/statusText', () => {
    const err = new FetchError('http', { status: 503, statusText: 'Service Unavailable' });
    expect(err.status).toBe(503);
    expect(err.statusText).toBe('Service Unavailable');
  });

  it('ExtractError carries attempts list', () => {
    const err = new ExtractError('failed', [
      { extractor: 'cheerio', error: 'meta not found' },
      { extractor: 'regex-he', error: 'meta not found' },
    ]);
    expect(err.attempts.length).toBe(2);
    expect(err.attempts[0]?.extractor).toBe('cheerio');
  });

  it('ParseError carries snippet', () => {
    const err = new ParseError('bad json', { snippet: 'not json' });
    expect(err.snippet).toBe('not json');
  });

  it('ValidationError carries issues', () => {
    const err = new ValidationError('schema', [
      { code: 'invalid_type', expected: 'string', received: 'number', path: ['x'], message: 'm' },
    ] as never);
    expect(err.issues.length).toBe(1);
  });

  it('describeError stringifies Error and non-Error values', () => {
    expect(describeError(new Error('boom'))).toMatch(/Error: boom/);
    expect(describeError('plain')).toBe('plain');
    const root = new Error('root');
    const wrapped = new Error('top', { cause: root });
    expect(describeError(wrapped)).toMatch(/: root$/);
  });
});
