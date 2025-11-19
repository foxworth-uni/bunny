import { withMDX } from 'bunny-next/config';
import type { NextConfig } from 'next';

/**
 * Next.js 16 configuration with bunny-next MDX support
 *
 * The withMDX() wrapper configures both webpack and Turbopack to handle
 * .mdx files using the Bunny MDX Rust compiler for blazing fast builds.
 */
const nextConfig: NextConfig = {
  // Enable React compiler for automatic memoization (Next.js 16)
  experimental: {
    reactCompiler: true,
  },
};

// Export config with MDX support
// This enables importing .mdx files directly in your components
export default withMDX({
  mdxOptions: {
    gfm: true,        // GitHub Flavored Markdown (tables, task lists, etc.)
    footnotes: true,  // Footnote syntax support
    math: false,      // Math expressions (set to true if needed)
  },
})(nextConfig);
