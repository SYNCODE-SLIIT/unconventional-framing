import { z } from "zod";

const image = z.union([
  z.string().regex(/^\/frames\/[\w.\-]+$/),
  z
    .string()
    .max(8_000_000)
    .regex(/^data:image\/(jpeg|png|webp);base64,/)
]);

const video = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => /^(https?:\/\/|\/api\/videos\/[a-f\d]{24}$)/i.test(value), "Use a full link starting with http:// or https://");

export const frameCreateSchema = z.object({
  movie: z.string().trim().min(1).max(160),
  frameImage: image,
  video: video.nullable().optional(),
  timecode: z.string().trim().min(1).max(40),
  director: z.string().trim().min(1).max(160),
  dop: z.string().trim().min(1).max(160),
  notes: z.string().trim().max(2000).optional()
});

export const frameUpdateSchema = frameCreateSchema.partial();
