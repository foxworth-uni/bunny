import * as React from 'react';
import { evaluate } from './evaluate.js';
import type { MDXServerComponentProps } from './types.js';

/**
 * Server Component for rendering MDX
 *
 * Compiles and renders MDX entirely on the server.
 * No client-side JavaScript needed for the MDX content itself.
 *
 * This is optimized for React Server Components and supports streaming.
 *
 * @example
 * ```tsx
 * // In app/page.tsx (Server Component)
 * <MDXServerComponent
 *   source={mdxContent}
 *   components={{ Button }}
 * />
 * ```
 */
export async function MDXServerComponent<TScope = Record<string, unknown>>({
  source,
  components,
  scope,
  mdxOptions,
}: MDXServerComponentProps<TScope>): Promise<React.ReactElement> {
  const { default: Content } = await evaluate(source, {
    components,
    scope: scope as Record<string, unknown>,
    mdxOptions,
  });

  return <Content />;
}

/**
 * Evaluate MDX optimized for React Server Components
 *
 * Returns a Server Component directly without serialization overhead.
 * Use this in Server Components for maximum performance.
 *
 * @example
 * ```tsx
 * const Content = await evaluateRSC(mdxSource, {
 *   components: { Button }
 * });
 * return <Content />;
 * ```
 */
export async function evaluateRSC<TFrontmatter = Record<string, any>>(
  source: string,
  options?: {
    scope?: Record<string, unknown>;
    mdxOptions?: {
      gfm?: boolean;
      footnotes?: boolean;
      math?: boolean;
    };
  }
): Promise<React.ComponentType> {
  const { default: Content } = await evaluate<TFrontmatter>(source, options);
  return Content;
}

// Re-export evaluate and serialize for convenience
export { evaluate } from './evaluate.js';
export { serialize } from './serialize.js';
export type { EvaluateResult, SerializeResult } from './types.js';
