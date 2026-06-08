import { z } from "zod";

export const BLOG_CATEGORIES = [
  "Tactics",
  "Product",
  "Math",
  "Rules",
  "Meta",
] as const;

const dateField = z.union([z.string(), z.date()]).transform((value, ctx) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    ctx.addIssue({ code: "custom", message: "Invalid date" });
    return z.NEVER;
  }
  return parsed.toISOString();
});

const relativeAsset = z
  .string()
  .refine(
    (value) =>
      !value.startsWith("/") &&
      !value.startsWith("#") &&
      !value.startsWith("?") &&
      !value.startsWith("..") &&
      !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(value),
    "Use a relative asset path next to the post",
  );

export const FrontmatterSchema = z
  .object({
    title: z.string().min(1).max(120),
    subtitle: z.string().min(1).max(160).optional(),
    date: dateField,
    updated: dateField.optional(),
    summary: z.string().min(1).max(260),
    category: z.enum(BLOG_CATEGORIES),
    tags: z.array(z.string().min(1)).min(1),
    heroImage: relativeAsset.optional(),
    heroAlt: z.string().min(1).max(180).optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  })
  .refine((post) => !post.heroImage || Boolean(post.heroAlt), {
    message: "heroAlt is required when heroImage is set",
    path: ["heroAlt"],
  });

export type Frontmatter = z.infer<typeof FrontmatterSchema>;

export interface BlogArtifactPost extends Omit<Frontmatter, "heroImage"> {
  slug: string;
  permalink: string;
  heroImage?: {
    src: string;
  };
  contentHtml: string;
  metadata: {
    readingTime: number;
    wordCount: number;
  };
}
