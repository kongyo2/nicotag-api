export type ExtractorName = 'cheerio' | 'node-html-parser' | 'regex-he' | 'regex-manual';

export type Extractor = {
  readonly name: ExtractorName;
  extract(html: string): string;
};
