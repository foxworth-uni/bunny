'use client';

/**
 * bunny-next-wasm/client - Client-only exports
 *
 * This module contains components that must run on the client side.
 * Import from this module when you need to hydrate MDX content.
 *
 * @example
 * ```tsx
 * import { serialize } from 'bunny-next-wasm';
 * import { MDXRemote } from 'bunny-next-wasm/client';
 *
 * export default async function Page() {
 *   const mdxSource = await serialize(content);
 *   return <MDXRemote {...mdxSource} components={{ Button }} />;
 * }
 * ```
 */

export { MDXRemote } from './mdx-remote.js';
export type { MDXRemoteProps } from './types.js';

