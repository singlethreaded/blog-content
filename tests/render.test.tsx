import { describe, expect, it } from "vitest";

import { buildContent, tryRenderPost } from "../src/build.js";
import { renderPostSource } from "../src/render.js";

const assetBaseUrl = "https://cdn.example.com/posts";

const validFrontmatter = `---
title: Rich content test
date: 2026-06-08
summary: Exercises the rich component renderer.
category: Product
tags:
  - product
featured: true
draft: false
---
`;

describe("blog content renderer", () => {
  it("renders MDX rich components into artifact HTML", async () => {
    const post = await renderPostSource({
      slug: "rich-content",
      assetBaseUrl: "https://cdn.example.com/posts",
      source: `${validFrontmatter}
<Callout tone="warning" title="Check the math">
  Use the capped result for durability claims.
</Callout>

<Metric label="Average damage" value="12.4" caption="Into T10 Sv3+" />
`,
    });

    expect(post).toMatchObject({
      slug: "rich-content",
      permalink: "/blog/rich-content",
      title: "Rich content test",
      featured: true,
    });
    expect(post.contentHtml).toContain('data-component="callout"');
    expect(post.contentHtml).toContain('data-tone="warning"');
    expect(post.contentHtml).toContain('data-component="metric"');
    expect(post.metadata.wordCount).toBeGreaterThan(0);
  });

  it("sanitizes raw HTML before writing the artifact", async () => {
    const post = await renderPostSource({
      slug: "sanitize-html",
      assetBaseUrl: "https://cdn.example.com/posts",
      source: `${validFrontmatter}
<a href="javascript:alert(1)">bad link</a>
<script>alert(1)</script>
<Callout tone="note" title="Still allowed">Safe body.</Callout>
`,
    });

    expect(post.contentHtml).not.toContain("javascript:");
    expect(post.contentHtml).not.toContain("<script");
    expect(post.contentHtml).toContain('data-component="callout"');
  });

  it("preserves Markdown images with routable asset URLs", async () => {
    const post = await renderPostSource({
      slug: "image-post",
      assetBaseUrl: "https://cdn.example.com/posts",
      source: `${validFrontmatter}
![Damage curve](./diagram.png)
`,
    });

    expect(post.contentHtml).toContain(
      '<img src="https://cdn.example.com/posts/image-post/diagram.png" alt="Damage curve" loading="lazy" />',
    );
  });

  it("rejects missing hero alt text", async () => {
    await expect(
      renderPostSource({
        slug: "bad-hero",
        assetBaseUrl: "https://cdn.example.com/posts",
        source: `---
title: Bad hero
date: 2026-06-08
summary: Missing alt.
category: Product
tags:
  - product
heroImage: ./hero.png
draft: false
---

Body.
`,
      }),
    ).rejects.toThrow();
  });

  it("skips a draft whose frontmatter fails validation, without throwing", async () => {
    // category is invalid and heroAlt is missing — but it's a draft, so the
    // build must not crash; it just drops the post from the artifact.
    const post = await tryRenderPost({
      slug: "broken-draft",
      assetBaseUrl,
      source: `---
title: Work in progress
date: 2026-06-15
summary: Not ready yet.
category: rankings
tags:
  - wip
draft: true
---

Body.
`,
    });

    expect(post).toBeNull();
  });

  it("skips a draft whose frontmatter is unparseable YAML, without throwing", async () => {
    // The summary line is invalid YAML (unquoted "? ... :"), so gray-matter
    // can't parse it — yet `draft: true` is still detected from the raw block.
    const post = await tryRenderPost({
      slug: "unparseable-draft",
      assetBaseUrl,
      source: `---
title: Work in progress
summary: Is it better than a grenade? First up: Aeldari.
category: Tactics
tags:
  - wip
draft: true
---

Body.
`,
    });

    expect(post).toBeNull();
  });

  it("still fails the build for a published post with broken frontmatter", async () => {
    await expect(
      tryRenderPost({
        slug: "broken-published",
        assetBaseUrl,
        source: `---
title: Should have been caught
date: 2026-06-15
summary: Going live but invalid.
category: rankings
tags:
  - oops
draft: false
---

Body.
`,
      }),
    ).rejects.toThrow();
  });

  it("builds the committed artifact without drafts", async () => {
    const posts = await buildContent();
    const slugs = posts.map((post) => post.slug);
    // Drafts are excluded from the published artifact...
    expect(slugs).not.toContain("draft-example");
    // ...while published posts are included (lookup, not index, so the
    // assertion is order-independent as more posts are published).
    expect(slugs).toContain("welcome");
    expect(slugs).toContain("2026-06-15-rule-coverage-progress");
    const welcome = posts.find((post) => post.slug === "welcome");
    expect(welcome?.contentHtml).toContain(
      "Welcome to the dynamic blog pipeline.",
    );
  });
});
