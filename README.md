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

## Rich Components

The MDX renderer supports:

```mdx
<Callout tone="warning" title="Watch this">
  This renders as a styled callout in the generated HTML.
</Callout>

<Metric label="Average damage" value="12.4" caption="Into T10 Sv3+" />
```
