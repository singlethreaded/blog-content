import { compile, run } from "@mdx-js/mdx";
import matter from "gray-matter";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as runtime from "react/jsx-runtime";
import sanitizeHtml from "sanitize-html";

import { mdxComponents } from "./components.js";
import { type BlogArtifactPost, FrontmatterSchema } from "./schema.js";

const WORDS_PER_MINUTE = 220;
const BLOG_ALLOWED_TAGS = sanitizeHtml.defaults.allowedTags.concat([
  "aside",
  "figure",
  "figcaption",
  "img",
]);
const BLOG_ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  ...sanitizeHtml.defaults.allowedAttributes,
  a: ["href", "name", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  "*": ["data-component", "data-tone"],
};

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
  const contentHtml = sanitizeHtml(
    renderToStaticMarkup(
      React.createElement(Content, { components: mdxComponents }),
    ),
    {
      allowedTags: BLOG_ALLOWED_TAGS,
      allowedAttributes: BLOG_ALLOWED_ATTRIBUTES,
      allowedSchemes: ["http", "https", "mailto"],
      transformTags: {
        img: (_tagName, attribs) => {
          const src = rewritePostAssetSrc(attribs.src, slug, assetBaseUrl);
          return {
            tagName: "img",
            attribs: {
              ...attribs,
              ...(src ? { src } : {}),
              loading: attribs.loading || "lazy",
            },
          };
        },
      },
    },
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

function rewritePostAssetSrc(
  src: string | undefined,
  slug: string,
  assetBaseUrl: string,
): string | undefined {
  if (!src || src.startsWith("/") || src.startsWith("#") || src.startsWith("?"))
    return src;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(src)) return src;
  const assetPath = src.replace(/^\.\//, "");
  if (assetPath.startsWith("..")) return src;
  return `${assetBaseUrl.replace(/\/$/, "")}/${slug}/${assetPath}`;
}
