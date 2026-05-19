import type { ZodIssue } from 'zod';

export type NicoTagErrorOptions = {
  cause?: unknown;
  url?: string;
  videoId?: string;
  attempt?: number;
};

export class NicoTagError extends Error {
  override readonly name: string = 'NicoTagError';
  readonly url?: string;
  readonly videoId?: string;
  readonly attempt?: number;
  constructor(message: string, options: NicoTagErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    if (options.url !== undefined) this.url = options.url;
    if (options.videoId !== undefined) this.videoId = options.videoId;
    if (options.attempt !== undefined) this.attempt = options.attempt;
  }
}

export class InvalidVideoIdError extends NicoTagError {
  override readonly name = 'InvalidVideoIdError';
}

export class FetchError extends NicoTagError {
  override readonly name = 'FetchError';
  readonly status?: number;
  readonly statusText?: string;
  constructor(
    message: string,
    options: NicoTagErrorOptions & { status?: number; statusText?: string } = {},
  ) {
    super(message, options);
    if (options.status !== undefined) this.status = options.status;
    if (options.statusText !== undefined) this.statusText = options.statusText;
  }
}

export class TimeoutError extends NicoTagError {
  override readonly name = 'TimeoutError';
}

export class AbortError extends NicoTagError {
  override readonly name = 'AbortError';
}

export class ExtractError extends NicoTagError {
  override readonly name = 'ExtractError';
  readonly attempts: ReadonlyArray<ExtractorAttempt>;
  constructor(
    message: string,
    attempts: ReadonlyArray<ExtractorAttempt>,
    options: NicoTagErrorOptions = {},
  ) {
    super(message, options);
    this.attempts = attempts;
  }
}

export type ExtractorAttempt = {
  readonly extractor: string;
  readonly error: string;
};

export class ParseError extends NicoTagError {
  override readonly name = 'ParseError';
  readonly snippet?: string;
  constructor(message: string, options: NicoTagErrorOptions & { snippet?: string } = {}) {
    super(message, options);
    if (options.snippet !== undefined) this.snippet = options.snippet;
  }
}

export class ValidationError extends NicoTagError {
  override readonly name = 'ValidationError';
  readonly issues: ReadonlyArray<ZodIssue>;
  constructor(message: string, issues: ReadonlyArray<ZodIssue>, options: NicoTagErrorOptions = {}) {
    super(message, options);
    this.issues = issues;
  }
}

export function describeError(error: unknown): string {
  if (error instanceof Error) {
    const causeMsg = error.cause instanceof Error ? `: ${error.cause.message}` : '';
    return `${error.name}: ${error.message}${causeMsg}`;
  }
  return String(error);
}
