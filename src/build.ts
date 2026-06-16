import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

import { ZodError } from "zod";

import { renderPostSource } from "./render.js";
import type { BlogArtifactPost } from "./schema.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const postsDir = path.join(root, "content/posts");
const outFile = path.join(root, "dist/posts.json");
const assetBaseUrl =
  process.env.BLOG_CONTENT_ASSET_BASE_URL ||
  "https://raw.githubusercontent.com/singlethreaded/blog-content/main/content/posts";

/**
 * Render a post, but never let a *draft* break the build. A draft is unfinished
 * by definition, so if it fails to parse or validate we skip it with a warning
 * instead of aborting the whole artifact (which would block every other post's
 * updates). Published posts still fail hard — a broken post meant to go live
 * should stop the build so the author notices.
 */
export async function tryRenderPost(args: {
  source: string;
  slug: string;
  assetBaseUrl: string;
}): Promise<BlogArtifactPost | null> {
  try {
    return await renderPostSource(args);
  } catch (error) {
    if (isDraftSource(args.source)) {
      console.warn(
        `Skipping draft "${args.slug}" — it does not build yet (${describeError(error)}).`,
      );
      return null;
    }
    throw new Error(
      `Failed to build published post "${args.slug}": ${describeError(error)}`,
      { cause: error },
    );
  }
}

/**
 * Detect `draft: true` straight from the raw frontmatter block, tolerant of
 * otherwise-broken YAML — so a draft whose frontmatter doesn't even parse is
 * still recognized as a draft (and skipped) rather than crashing the build.
 */
export function isDraftSource(source: string): boolean {
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return frontmatter
    ? /^[ \t]*draft:[ \t]*true[ \t]*$/im.test(frontmatter[1])
    : false;
}

function describeError(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }
  return String(error instanceof Error ? error.message : error).split("\n")[0];
}

export async function buildContent() {
  const entries = await readdir(postsDir, { withFileTypes: true });
  const posts = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
    const filePath = path.join(postsDir, entry.name, "index.mdx");
    const source = await readFile(filePath, "utf8");
    const post = await tryRenderPost({
      source,
      slug: entry.name,
      assetBaseUrl,
    });
    if (post && !post.draft) posts.push(post);
  }

  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  await mkdir(path.dirname(outFile), { recursive: true });
  await writeFile(
    outFile,
    await format(JSON.stringify(posts), { parser: "json" }),
  );
  return posts;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildContent();
}
