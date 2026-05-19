import { z } from 'zod';

export const TagItemSchema = z
  .object({
    name: z.string().min(1),
    isCategory: z.boolean(),
    isCategoryCandidate: z.boolean().optional(),
    isNicodicArticleExists: z.boolean().optional(),
    isLocked: z.boolean(),
  })
  .passthrough();

export type TagItem = z.infer<typeof TagItemSchema>;

export const TagSectionSchema = z
  .object({
    items: z.array(TagItemSchema),
    edit: z.unknown().optional(),
    hasR18Tag: z.boolean().optional(),
    isPublishedNicoscript: z.boolean().optional(),
    viewer: z.unknown().optional(),
  })
  .passthrough();

export type TagSection = z.infer<typeof TagSectionSchema>;

export const VideoCountSchema = z
  .object({
    view: z.number().int().nonnegative().nullable().optional(),
    comment: z.number().int().nonnegative().nullable().optional(),
    mylist: z.number().int().nonnegative().nullable().optional(),
    like: z.number().int().nonnegative().nullable().optional(),
  })
  .partial()
  .passthrough();

export const VideoSectionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    description: z.string().nullable().optional(),
    registeredAt: z.string().nullable().optional(),
    duration: z.number().int().nonnegative().nullable().optional(),
    count: VideoCountSchema.optional(),
    thumbnail: z
      .object({
        url: z.string().nullable().optional(),
        middleUrl: z.string().nullable().optional(),
        largeUrl: z.string().nullable().optional(),
      })
      .partial()
      .passthrough()
      .optional(),
  })
  .passthrough();

export type VideoSection = z.infer<typeof VideoSectionSchema>;

export type ServerResponseMeta = {
  status: number;
  code?: string;
  [key: string]: unknown;
};

export type ServerResponseInnerResponse = {
  tag: TagSection;
  video: VideoSection;
  [key: string]: unknown;
};

export type ServerResponseData = {
  response: ServerResponseInnerResponse;
  [key: string]: unknown;
};

export type ServerResponse = {
  meta: ServerResponseMeta;
  data: ServerResponseData;
  [key: string]: unknown;
};

export const ServerResponseSchema: z.ZodType<ServerResponse> = z
  .object({
    meta: z
      .object({
        status: z.number().int(),
        code: z.string().optional(),
      })
      .passthrough(),
    data: z
      .object({
        response: z
          .object({
            tag: TagSectionSchema,
            video: VideoSectionSchema,
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough() as z.ZodType<ServerResponse>;
