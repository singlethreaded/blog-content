import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { format } from "prettier";

import { renderPostSource } from "./render.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const postsDir = path.join(root, "content/posts");
const outFile = path.join(root, "dist/posts.json");
const assetBaseUrl =
  process.env.BLOG_CONTENT_ASSET_BASE_URL ||
  "https://raw.githubusercontent.com/singlethreaded/blog-content/main/content/posts";

export async function buildContent() {
  const entries = await readdir(postsDir, { withFileTypes: true });
  const posts = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith("_")) continue;
    const filePath = path.join(postsDir, entry.name, "index.mdx");
    const source = await readFile(filePath, "utf8");
    const post = await renderPostSource({
      source,
      slug: entry.name,
      assetBaseUrl,
    });
    if (!post.draft) posts.push(post);
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
