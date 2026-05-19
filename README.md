# @kongyo2/nicotag-api

ニコニコ動画（nicovideo.jp）の動画 ID からタグ一覧を取得する非公式クライアントです。

## 特徴

- 動画 ID（`sm` / `nm` / `so` プレフィックス）の入力からタグ配列を取得
- 4 種類の抽出器を順番に試行する多段フォールバック（cheerio → node-html-parser → 正規表現 2 種）
- リトライ（指数バックオフ + ジッター）、タイムアウト、`AbortSignal` 対応
- Zod による型安全なレスポンス検証
- ランタイム依存は `zod` / `cheerio` / `node-html-parser` / `he` のみ
- TypeScript ファースト・ESM 専用

## 要件

- Node.js >= 20

## インストール

```bash
npm install @kongyo2/nicotag-api
```

## 使い方

### タグ名一覧だけ欲しい

```ts
import { fetchVideoTags } from '@kongyo2/nicotag-api';

const result = await fetchVideoTags({ videoId: 'sm9' });

console.log(result.tagNames);
// 例: ['陰陽師', 'レッツゴー！陰陽師', 'ニコニコ動画', ...]

for (const tag of result.tags) {
  console.log(tag.name, tag.isCategory, tag.isLocked);
}
```

### 動画情報も含めて取得

```ts
import { fetchVideo } from '@kongyo2/nicotag-api';

const result = await fetchVideo({ videoId: 'sm9' });

console.log(result.video.title);           // 動画タイトル
console.log(result.video.count?.view);     // 再生数
console.log(result.tag.items.length);      // タグ数
```

### HTTP オプション（タイムアウト・リトライ・中断）

```ts
const ac = new AbortController();
setTimeout(() => ac.abort(), 5_000);

await fetchVideoTags({
  videoId: 'sm9',
  http: {
    timeoutMs: 10_000,
    signal: ac.signal,
    retry: { maxRetries: 3, initialDelayMs: 500 },
    userAgent: 'my-app/1.0',
  },
});
```

### HTML のみをパース（取得は自前で行う場合）

```ts
import { extractAndParse } from '@kongyo2/nicotag-api';

const html = await (await fetch('https://www.nicovideo.jp/watch/sm9')).text();
const { parsed, extractorUsed } = extractAndParse(html);

console.log(parsed.data.response.tag.items);
```

## 動画 ID

`sm` / `nm` / `so` で始まり、後ろが数字のもののみ受け付けます（例: `sm9`, `nm12345`, `so9876`）。
不正な ID を渡した場合は `InvalidVideoIdError` が送出されます。

## エラー

すべての例外は `NicoTagError` のサブクラスとして送出されます。

| クラス | 用途 |
| --- | --- |
| `InvalidVideoIdError` | 動画 ID が `/^(sm\|nm\|so)\d+$/` に一致しない |
| `FetchError` | HTTP エラー / ネットワーク失敗 |
| `TimeoutError` | タイムアウト |
| `AbortError` | ユーザー側からの中断 |
| `ExtractError` | 全抽出器が失敗（各試行内容は `attempts` に格納） |
| `ParseError` | JSON のパース失敗 |
| `ValidationError` | Zod スキーマ検証失敗（`issues` を含む） |

## 開発

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

ライブテスト（実際の nicovideo.jp にアクセス）:

```bash
NICOTAG_LIVE=1 npm run test:live
```

## ライセンス

[MIT](./LICENSE) © kongyo2
