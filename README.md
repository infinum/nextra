# Nextra

Simple, powerful and flexible site generation framework with everything you love
from Next.js.

## Documentation

[https://nextra.site](https://nextra.site)

## Development

### Installation

The Nextra repository uses [PNPM Workspaces](https://pnpm.io/workspaces) and
[Turborepo](https://github.com/vercel/turborepo). To install dependencies, run
`pnpm install` in the project root directory.

### Build Nextra Core

```bash
cd packages/nextra
pnpm build
```

Watch mode: `pnpm dev`

### Build Nextra Theme

```bash
cd packages/nextra-theme-docs
pnpm build
```

| Command           | Description              |
| ----------------- | ------------------------ |
| pnpm dev          | Watch mode               |
| pnpm dev:layout   | Watch mode (layout only) |
| pnpm dev:tailwind | Watch mode (style only)  |

### Development

You can also debug them together with a website locally. For instance, to start
examples/docs locally, run

```bash
cd examples/docs
pnpm dev
```

Any change to example/docs will be re-rendered instantly.

If you update the core or theme packages, a rebuild is required. Or you can use
the watch mode for both nextra and the theme in separated terminals.

## Changelog after fork
- fixed issue with hidden included in mobile sidebar
- fixed issue with included items from folder with overlapping name (example: /conversations and /conversations-api)
- limited depth for displaying in TOC to 4
- search - moved logic to service worker to remove the glitch in input on first search
         - optimised search results 
