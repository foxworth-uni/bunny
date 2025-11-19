/**
 * bunny-next-wasm - Fast Next.js MDX integration powered by WebAssembly
 *
 * SERVER-ONLY entry point
 *
 * This module exports server-only functions like serialize() and evaluate().
 * For client components like MDXRemote, import from 'bunny-next-wasm/client'.
 *
 * @example Server Component
 * ```tsx
 * import { serialize } from 'bunny-next-wasm';
 * import { MDXClient } from 'bunny-next-wasm/client';
 *
 * export default async function Page() {
 *   const mdxSource = await serialize(content);
 *   return <MDXClient {...mdxSource} />;
 * }
 * ```
 */

// Server-only API
export { serialize } from './serialize.js';
export { evaluate } from './evaluate.js';

// Caching (server-only)
export {
  serializeWithCache,
  configureMDXCache,
  clearMDXCache,
  mdxCache,
} from './cache.js';

// Types
export type {
  SerializeOptions,
  SerializeResult,
  EvaluateOptions,
  EvaluateResult,
  MDXRemoteProps,
  MDXContentProps,
  CompileOptions,
} from './types.js';

