import { compile, run } from "@mdx-js/mdx";
import matter from "gray-matter";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as runtime from "react/jsx-runtime";

import { mdxComponents } from "./components.js";
import { type BlogArtifactPost, FrontmatterSchema } from "./schema.js";

const WORDS_PER_MINUTE = 220;

export async function renderPostSource({
  source,
  slug,
  assetBaseUrl,
}: {
  source: string;
  slug: string;
  assetBaseUrl: string;
}): Promise<BlogArtifactPost> {
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error(`Invalid slug "${slug}". Use lowercase kebab-case.`);
  }

  const parsed = matter(source);
  const frontmatter = FrontmatterSchema.parse(parsed.data);
  const compiled = String(
    await compile(parsed.content, {
      outputFormat: "function-body",
      development: false,
    }),
  );
  const mod = await run(compiled, { ...runtime, baseUrl: import.meta.url });
  const Content = mod.default;
  const contentHtml = renderToStaticMarkup(
    React.createElement(Content, { components: mdxComponents }),
  );
  const wordCount = parsed.content.trim().split(/\s+/).filter(Boolean).length;

  return {
    ...frontmatter,
    slug,
    permalink: `/blog/${slug}`,
    heroImage: frontmatter.heroImage
      ? {
          src: `${assetBaseUrl.replace(/\/$/, "")}/${slug}/${frontmatter.heroImage.replace(/^\.\//, "")}`,
        }
      : undefined,
    contentHtml,
    metadata: {
      readingTime: Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE)),
      wordCount,
    },
  };
}
