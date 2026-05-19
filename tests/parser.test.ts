import { describe, expect, it } from 'vitest';
import { parseServerResponseJson } from '../src/parsers/server-response.js';
import { ParseError, ValidationError } from '../src/errors.js';
import { SAMPLE_TAGS, buildServerResponseJson } from './fixtures/build-fixture.js';

describe('parseServerResponseJson', () => {
  it('parses a valid server-response payload', () => {
    const json = buildServerResponseJson({
      videoId: 'sm9',
      title: 'テスト',
      tags: SAMPLE_TAGS,
    });
    const parsed = parseServerResponseJson(json);
    expect(parsed.meta.status).toBe(200);
    expect(parsed.data.response.video.id).toBe('sm9');
    expect(parsed.data.response.tag.items.length).toBe(SAMPLE_TAGS.length);
    expect(parsed.data.response.tag.items[0]?.name).toBe('陰陽師');
  });

  it('throws ParseError on invalid JSON', () => {
    expect(() => parseServerResponseJson('not json')).toThrowError(ParseError);
  });

  it('throws ValidationError on missing required fields', () => {
    const bad = JSON.stringify({ meta: { status: 200 }, data: { response: {} } });
    expect(() => parseServerResponseJson(bad)).toThrowError(ValidationError);
  });

  it('preserves extra fields via passthrough', () => {
    const json = buildServerResponseJson({
      videoId: 'sm9',
      title: 'テスト',
      tags: SAMPLE_TAGS,
    });
    const parsed = parseServerResponseJson(json) as unknown as {
      data: { response: { video: Record<string, unknown> } };
    };
    expect(parsed.data.response.video['duration']).toBe(319);
  });
});
