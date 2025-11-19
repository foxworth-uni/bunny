/**
 * Next.js instrumentation hook
 *
 * This file initializes the WASM module at startup, enabling
 * synchronous compilation in Server Components.
 */
import { initialize } from '@bunny/mdx-wasm';

export async function register() {
  await initialize();
}

