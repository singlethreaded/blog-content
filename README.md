# Fatecaster Blog Content

This repository publishes the dynamic blog artifact consumed by
`fatecaster.io/blog`.

Author posts under `content/posts/<slug>/index.mdx`. The folder name is the URL
slug. Run:

```bash
npm install
npm run build
npm test
```

Commit the resulting `dist/posts.json` with the content change. The website
fetches that artifact from GitHub with a short cache, so merged content appears
without a Fatecaster production deploy.

## Frontmatter

```mdx
---
title: Example title
subtitle: Optional supporting headline
date: 2026-06-08
updated: 2026-06-09
summary: Short link-preview description.
category: Product
tags:
  - product
featured: false
draft: false
---

Body copy.
```

Valid categories are `Tactics`, `Product`, `Math`, `Rules`, and `Meta`.

`draft: true` posts are validated but excluded from `dist/posts.json`.

## Hero Images

If a post uses `heroImage`, place the image next to the post and reference it
with a relative path:

```mdx
heroImage: ./hero.jpg
heroAlt: A short description of the image
```

Use a 1200x630 image when possible. Larger files with the same roughly 1.91:1
aspect ratio, such as 1600x840 or 2400x1260, are also fine. Prefer compressed
JPEG for photos or screenshots, and PNG only when transparency or crisp UI text
matters. Try to keep the file under 500 KB.

## Rich Components

The MDX renderer supports:

```mdx
<Callout tone="warning" title="Watch this">
  This renders as a styled callout in the generated HTML.
</Callout>

<Metric label="Average damage" value="12.4" caption="Into T10 Sv3+" />
```
