import { z } from "zod";

/** Shared, isomorphic validation primitives. */

export const objectIdSchema = z
  .string()
  .regex(/^[a-f0-9]{24}$/i, "Invalid identifier");

export const hexIdSchema = z
  .string()
  .regex(/^[a-f0-9]{24}$/i, "Invalid identifier");

export const emailSchema = z
  .string()
  .trim()
  .min(3, "Email is required")
  .max(160, "Email is too long")
  .email("Enter a valid email address");

export const urlSchema = z
  .string()
  .trim()
  .max(500, "URL is too long")
  .refine(
    (value) => value === "" || /^https?:\/\//i.test(value),
    "Must start with http:// or https://",
  );

export const nonEmptyString = (label: string, max = 300) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

export const isoMonthSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use the YYYY-MM format");

export const imageAssetSchema = z.object({
  url: z.string().trim().min(1, "Image URL is required").max(1000),
  publicId: z.string().trim().max(300).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  blurDataUrl: z.string().trim().max(2000).optional(),
  alt: z.string().trim().max(300).optional(),
});

export const stringListSchema = z
  .array(z.string().trim().min(1).max(80))
  .max(40, "Too many entries");

export const booleanish = z.union([z.boolean(), z.literal("true"), z.literal("false")]);
