function htmlEscape(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;');
}

export type FixtureTag = {
  name: string;
  isCategory: boolean;
  isCategoryCandidate: boolean;
  isNicodicArticleExists: boolean;
  isLocked: boolean;
};

export type FixtureBuildOptions = {
  videoId: string;
  title: string;
  tags: ReadonlyArray<FixtureTag>;
  description?: string;
  viewCount?: number;
};

export function buildServerResponseJson(opts: FixtureBuildOptions): string {
  const body = {
    meta: { status: 200, code: 'OK' },
    data: {
      response: {
        video: {
          id: opts.videoId,
          title: opts.title,
          description: opts.description ?? '',
          registeredAt: '2026-05-01T12:00:00+09:00',
          duration: 319,
          count: {
            view: opts.viewCount ?? 123456,
            comment: 7890,
            mylist: 4321,
            like: 9876,
          },
          thumbnail: {
            url: 'https://nicovideo.cdn.nimg.jp/thumbnails/0/0',
            middleUrl: 'https://nicovideo.cdn.nimg.jp/thumbnails/0/0.M',
            largeUrl: 'https://nicovideo.cdn.nimg.jp/thumbnails/0/0.L',
          },
        },
        tag: {
          items: opts.tags,
          hasR18Tag: false,
          isPublishedNicoscript: false,
        },
      },
    },
  };
  return JSON.stringify(body);
}

export function buildFixtureHtml(
  opts: FixtureBuildOptions,
  attributeOrder: 'name-first' | 'content-first' = 'name-first',
): string {
  const json = buildServerResponseJson(opts);
  const escaped = htmlEscape(json);
  const meta =
    attributeOrder === 'name-first'
      ? `<meta name="server-response" content="${escaped}">`
      : `<meta content="${escaped}" name="server-response">`;
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>watch fixture: ${opts.title}</title>
${meta}
</head>
<body>
<div id="app">noop</div>
</body>
</html>`;
}

export const SAMPLE_TAGS: ReadonlyArray<FixtureTag> = Object.freeze([
  {
    name: '陰陽師',
    isCategory: false,
    isCategoryCandidate: false,
    isNicodicArticleExists: false,
    isLocked: true,
  },
  {
    name: 'レッツゴー！陰陽師',
    isCategory: false,
    isCategoryCandidate: false,
    isNicodicArticleExists: true,
    isLocked: true,
  },
  {
    name: 'ニコニコ動画',
    isCategory: true,
    isCategoryCandidate: false,
    isNicodicArticleExists: true,
    isLocked: true,
  },
]);
