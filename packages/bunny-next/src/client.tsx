'use client';

/**
 * bunny-next/client - Client-only exports
 *
 * This module contains components that must run on the client side.
 * Import from this module when you need to hydrate MDX content.
 *
 * @example
 * ```tsx
 * import { serialize } from 'bunny-next';
 * import { MDXRemote } from 'bunny-next/client';
 *
 * export default async function Page() {
 *   const mdxSource = await serialize(content);
 *   return <MDXRemote {...mdxSource} components={{ Button }} />;
 * }
 * ```
 */

export { MDXRemote } from './mdx-remote.js';
export type { MDXRemoteProps } from './types.js';
