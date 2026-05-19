import { describe, expect, it } from 'vitest';
import { VideoIdSchema, assertVideoId, isValidVideoId, normalizeVideoId } from '../src/video-id.js';
import { InvalidVideoIdError } from '../src/errors.js';

describe('video id', () => {
  describe('isValidVideoId', () => {
    it('accepts sm/nm/so prefixed numeric ids', () => {
      expect(isValidVideoId('sm9')).toBe(true);
      expect(isValidVideoId('sm12345')).toBe(true);
      expect(isValidVideoId('nm1234')).toBe(true);
      expect(isValidVideoId('so9876543')).toBe(true);
    });

    it('rejects malformed ids', () => {
      expect(isValidVideoId('SM9')).toBe(false);
      expect(isValidVideoId('sm')).toBe(false);
      expect(isValidVideoId('sm9a')).toBe(false);
      expect(isValidVideoId('abc123')).toBe(false);
      expect(isValidVideoId('')).toBe(false);
      expect(isValidVideoId(' sm9 ')).toBe(false);
    });
  });

  describe('assertVideoId', () => {
    it('does not throw on valid id', () => {
      expect(() => {
        assertVideoId('sm9');
      }).not.toThrow();
    });

    it('throws InvalidVideoIdError on invalid id', () => {
      expect(() => {
        assertVideoId('bad');
      }).toThrowError(InvalidVideoIdError);
    });
  });

  describe('normalizeVideoId', () => {
    it('trims surrounding whitespace then validates', () => {
      expect(normalizeVideoId('  sm9 ')).toBe('sm9');
    });

    it('throws for invalid after trim', () => {
      expect(() => normalizeVideoId('  bad ')).toThrowError(InvalidVideoIdError);
    });
  });

  describe('VideoIdSchema', () => {
    it('parses valid ids', () => {
      expect(VideoIdSchema.parse('sm9')).toBe('sm9');
    });

    it('rejects invalid ids via Zod', () => {
      expect(() => VideoIdSchema.parse('bad')).toThrowError();
    });
  });
});
