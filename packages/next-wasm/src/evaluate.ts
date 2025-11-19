import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { compileSync } from '@bunny/mdx-wasm';
import type { EvaluateOptions, EvaluateResult } from './types.js';

/**
 * Evaluate MDX content and return a React component
 *
 * This compiles MDX and evaluates it to create a React component.
 * Use this when you need to render MDX directly in Server Components.
 *
 * @example
 * ```tsx
 * const { default: Content } = await evaluate(mdxSource, {
 *   components: { Button },
 *   scope: { count: 42 }
 * });
 * return <Content />;
 * ```
 */
export async function evaluate<TFrontmatter = Record<string, any>>(
  source: string,
  options?: EvaluateOptions
): Promise<EvaluateResult<TFrontmatter>> {
  const {
    scope = {},
    mdxOptions = {},
    components = {},
  } = options || {};

  try {
    // Compile MDX using WASM compiler
    const result = compileSync(source, {
      gfm: mdxOptions.gfm ?? true,
      footnotes: mdxOptions.footnotes ?? true,
      math: mdxOptions.math ?? false,
    });

    // Create module scope for evaluation
    const moduleScope = {
      React,
      ...jsxRuntime,
      ...scope,
      ...components,
    };

    const keys = Object.keys(moduleScope);
    const values = Object.values(moduleScope);

    // Build function to return the MDX component
    const functionCode = `
${result.code}

return MDXContent;
`;

    // Create and execute function
    const fn = new Function(...keys, functionCode);
    const MDXComponent = fn(...values);

    // Parse frontmatter if available
    let frontmatter: TFrontmatter | undefined;
    if (result.frontmatter) {
      frontmatter = result.frontmatter as TFrontmatter;
    }

    return {
      default: MDXComponent as React.ComponentType,
      frontmatter,
    };
  } catch (error) {
    const err = error as Error;
    throw new Error(`[bunny-next-wasm] Failed to evaluate MDX: ${err.message}`, {
      cause: error,
    });
  }
}

