'use client';

import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { useMDXComponents } from '@bunny/mdx-runtime';
import type { MDXRemoteProps } from './types.js';

/**
 * Sanitize scope to prevent XSS and prototype pollution attacks.
 * Filters out functions and dangerous property names.
 */
function sanitizeScope(scope: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(scope)) {
    // Filter out functions - they can be dangerous in scope
    if (typeof value === 'function') {
      console.warn(`[bunny-next] Ignoring function in scope: ${key}`);
      continue;
    }

    // Filter out prototype pollution vectors
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      console.warn(`[bunny-next] Ignoring dangerous property: ${key}`);
      continue;
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Hydrate serialized MDX on the client
 *
 * Takes the output from serialize() and renders it with proper hydration.
 * Works in both Pages Router and App Router.
 *
 * @example
 * ```tsx
 * // In a client component or page
 * <MDXRemote
 *   compiledSource={mdxSource.compiledSource}
 *   frontmatter={mdxSource.frontmatter}
 *   scope={mdxSource.scope}
 *   components={{ Button, Card }}
 * />
 * ```
 */
export function MDXRemote<
  TScope = Record<string, unknown>,
  TFrontmatter = Record<string, any>
>({
  compiledSource,
  components,
  scope = {} as TScope,
  lazy = false,
}: MDXRemoteProps<TScope, TFrontmatter>): React.ReactElement {
  const contextComponents = useMDXComponents(components);

  const Component = React.useMemo(() => {
    try {
      // Create module scope for client-side evaluation
      // NOTE: useMDXComponents removed - component merging happens at line 34
      const sanitizedScope = sanitizeScope(scope as Record<string, unknown>);

      const moduleScope = {
        React,
        ...jsxRuntime,
        ...sanitizedScope,
      };

      const keys = Object.keys(moduleScope);
      const values = Object.values(moduleScope);

      // Build function to return the MDX component
      const functionCode = `
${compiledSource}

return MDXContent;
`;

      // Create and execute function
      const fn = new Function(...keys, functionCode);
      const MDXComponent = fn(...values);

      // Wrap component to inject context components
      return function WrappedMDXContent(props: any) {
        return React.createElement(MDXComponent, {
          ...props,
          components: contextComponents,
        });
      };
    } catch (error) {
      console.error('[bunny-next] Failed to hydrate MDX:', error);
      return function ErrorComponent() {
        return React.createElement(
          'div',
          { style: { color: 'red', padding: '1rem' } },
          'Error rendering MDX content'
        );
      };
    }
  }, [compiledSource, scope, contextComponents]);

  if (lazy) {
    return React.createElement(
      React.Suspense,
      { fallback: null },
      React.createElement(Component, null)
    );
  }

  return React.createElement(Component, null);
}
