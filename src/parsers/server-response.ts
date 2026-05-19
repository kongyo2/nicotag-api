import { ZodError } from 'zod';
import { ParseError, ValidationError } from '../errors.js';
import { ServerResponseSchema, type ServerResponse } from '../types.js';

export function parseServerResponseJson(jsonText: string): ServerResponse {
  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch (error) {
    const snippet = jsonText.length > 200 ? `${jsonText.slice(0, 200)}…` : jsonText;
    throw new ParseError('Failed to JSON.parse server-response content', {
      cause: error,
      snippet,
    });
  }
  try {
    return ServerResponseSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('server-response payload failed schema validation', error.issues, {
        cause: error,
      });
    }
    throw error;
  }
}
