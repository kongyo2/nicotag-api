import { z } from 'zod';
import { InvalidVideoIdError } from './errors.js';

const VIDEO_ID_RE = /^(sm|nm|so)\d+$/;

export const VideoIdSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(VIDEO_ID_RE, 'video id must match /^(sm|nm|so)\\d+$/');

export type VideoId = z.infer<typeof VideoIdSchema>;

export function isValidVideoId(input: string): input is VideoId {
  return VIDEO_ID_RE.test(input);
}

export function assertVideoId(input: string): asserts input is VideoId {
  if (!VIDEO_ID_RE.test(input)) {
    throw new InvalidVideoIdError(
      `invalid niconico video id: ${JSON.stringify(input)} (expected /^(sm|nm|so)\\d+$/)`,
      { videoId: input },
    );
  }
}

export function normalizeVideoId(input: string): VideoId {
  const trimmed = input.trim();
  assertVideoId(trimmed);
  return trimmed;
}
