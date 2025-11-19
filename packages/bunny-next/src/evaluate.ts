import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { useMDXComponents } from '@bunny/mdx-runtime';
import { compile } from '@bunny/mdx-node';
import type { EvaluateOptions, EvaluateResult } from './types.js';

/**
 * Evaluate MDX immediately on the server
 *
 * This compiles and evaluates MDX in one step, returning a React component.
 * Useful for Server Components or when you need immediate rendering.
 *
 * @example
 * ```tsx
 * // In Server Component
 * const { default: MDXContent } = await evaluate(source, {
 *   components: { Button }
 * });
 * return <MDXContent />;
 * ```
 */
export async function evaluate<TFrontmatter = Record<string, any>>(
  source: string,
  options?: EvaluateOptions
): Promise<EvaluateResult<TFrontmatter>> {
  const { scope = {}, mdxOptions = {} } = options || {};

  try {
    // Compile MDX using Rust compiler
    const result = compile(source, {
      gfm: mdxOptions.gfm ?? true,
      footnotes: mdxOptions.footnotes ?? true,
      math: mdxOptions.math ?? false,
    });

    // Create module scope
    const moduleScope = {
      React,
      ...jsxRuntime,
      useMDXComponents,
      ...scope,
    };

    // Evaluate compiled code in controlled scope
    const keys = Object.keys(moduleScope);
    const values = Object.values(moduleScope);

    // Build the function code with proper module exports
    const functionCode = `
${result.code}

// Return all exports
return {
  default: MDXContent,
  ${result.frontmatter ? 'frontmatter,' : ''}
  ${result.namedExports.map((name: string) => `${name},`).join('\n  ')}
};
`;

    // Create and execute function
    const fn = new Function(...keys, functionCode);
    const exports = fn(...values);

    // Add frontmatter from compile result if available
    if (result.frontmatter && !exports.frontmatter) {
      try {
        exports.frontmatter = JSON.parse(result.frontmatter.data);
      } catch (error) {
        console.warn('[bunny-next] Failed to parse frontmatter:', error);
      }
    }

    return exports as EvaluateResult<TFrontmatter>;
  } catch (error) {
    const err = error as Error;
    throw new Error(`[bunny-next] Failed to evaluate MDX: ${err.message}`, {
      cause: error,
    });
  }
}
