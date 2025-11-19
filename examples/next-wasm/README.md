# bunny-next Example - Next.js 16 + React 19

Comprehensive example application demonstrating all features of `bunny-next`.

## Features Demonstrated

- **Local MDX** (`/local`) - Import `.mdx` files directly
- **Remote MDX** (`/remote`) - serialize() + MDXRemote for CMS content
- **Server Components** (`/server`) - Zero client JS with MDXServerComponent
- **Cached MDX** (`/cached`) - serializeWithCache() with LRU caching
- **Dynamic Blog** (`/blog`) - File-based routing with frontmatter

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- bunny-next (Rust-powered MDX)
- TypeScript

## Getting Started

From the monorepo root:

\`\`\`bash
# Install dependencies
pnpm install

# Navigate to example
cd examples/next-app

# Run development server
pnpm dev
\`\`\`

Visit http://localhost:3000

## Project Structure

\`\`\`
app/
├── layout.tsx           # Root layout
├── page.tsx             # Homepage
├── local/               # Local MDX example
├── remote/              # Remote MDX example
├── server/              # Server Component example
├── cached/              # Cached MDX example
└── blog/                # Dynamic blog
    ├── posts/*.md       # Blog post content
    └── [slug]/page.tsx  # Dynamic route

components/
├── mdx/                 # Custom MDX components
├── Navigation.tsx
├── FeatureCard.tsx
└── BlogCard.tsx

lib/
└── posts.ts             # Blog utilities
\`\`\`

## Custom Components

- **Button** - Interactive button with variants
- **Callout** - Styled callouts (info, warning, success, error)
- **Counter** - Interactive counter component

## Configuration

See `next.config.ts` for bunny-next configuration:

\`\`\`typescript
import { withMDX } from 'bunny-next/config';

export default withMDX({
  mdxOptions: {
    gfm: true,
    footnotes: true,
  }
})(nextConfig);
\`\`\`

## Performance

bunny-next delivers exceptional performance:

- Rust-powered compiler (10-100x faster)
- Zero client JS (with Server Components)
- Intelligent LRU caching
- Turbopack support

## Learn More

- [bunny-next Documentation](https://github.com/nine-gen/bunny)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT
