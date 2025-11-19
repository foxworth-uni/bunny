import { compileSync } from '@bunny/mdx-wasm';
import type { SerializeOptions, SerializeResult } from './types.js';

/**
 * Serialize MDX content from remote sources (CMS, API, database)
 *
 * This compiles MDX to an intermediate format that can be sent to client
 * and hydrated. Designed for use in getStaticProps, getServerSideProps,
 * or Server Components.
 *
 * Uses sync WASM compilation - ensure WASM is initialized via instrumentation.ts
 *
 * @example
 * ```tsx
 * // In getStaticProps or Server Component
 * const mdxSource = await serialize(content, {
 *   scope: { count: 42 },
 *   mdxOptions: { gfm: true }
 * });
 * ```
 */
export async function serialize<
  TScope = Record<string, unknown>,
  TFrontmatter = Record<string, any>
>(
  source: string,
  options?: SerializeOptions<TScope>
): Promise<SerializeResult<TScope, TFrontmatter>> {
  const {
    scope,
    mdxOptions = {},
    parseFrontmatter = true,
  } = options || {};

  try {
    // Compile MDX using WASM compiler (sync)
    const result = compileSync(source, {
      gfm: mdxOptions.gfm ?? true,
      footnotes: mdxOptions.footnotes ?? true,
      math: mdxOptions.math ?? false,
    });

    // Parse frontmatter if available
    let frontmatter: TFrontmatter | undefined;
    if (parseFrontmatter && result.frontmatter) {
      frontmatter = result.frontmatter as TFrontmatter;
    }

    return {
      compiledSource: result.code,
      frontmatter,
      scope,
      images: result.images,
    };
  } catch (error) {
    const err = error as Error;
    throw new Error(`[bunny-next-wasm] Failed to serialize MDX: ${err.message}`, {
      cause: error,
    });
  }
}

