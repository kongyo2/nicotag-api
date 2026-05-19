import { normalizeVideoId } from './video-id.js';

export const WATCH_BASE_URL = 'https://www.nicovideo.jp/watch';

export type BuildWatchUrlOptions = {
  videoId: string;
  baseUrl?: string;
};

export function buildWatchUrl(options: BuildWatchUrlOptions): string {
  const id = normalizeVideoId(options.videoId);
  const base = options.baseUrl ?? WATCH_BASE_URL;
  const url = new URL(`${base.replace(/\/+$/, '')}/${encodeURIComponent(id)}`);
  return url.toString();
}
