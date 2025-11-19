/**
 * @bunny/mdx-wasm - WASM bindings for bunny-mdx compiler
 *
 * Optimized for bundler targets (webpack, Turbopack, etc.)
 * Provides both async and sync compilation APIs.
 */

import init, { compile as wasmCompile, CompileOptions as WasmOptions } from '../wasm/bunny_wasm.js';

// Singleton pattern for WASM initialization
let initialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the WASM module
 *
 * This must be called before using compileSync(). For compile(), it's called automatically.
 * Safe to call multiple times - returns the same promise.
 *
 * @example
 * ```typescript
 * import { initialize } from '@bunny/mdx-wasm';
 *
 * // In Next.js instrumentation.ts
 * export async function register() {
 *   await initialize();
 * }
 * ```
 */
export async function initialize(): Promise<void> {
  if (initialized) {
    return;
  }

  if (!initPromise) {
    initPromise = init();
  }

  await initPromise;
  initialized = true;
}

/**
 * Compilation options
 */
export interface CompileOptions {
  /** Enable GitHub Flavored Markdown (tables, strikethrough, task lists, autolinks) */
  gfm?: boolean;
  /** Enable footnotes with backrefs */
  footnotes?: boolean;
  /** Enable math support (inline $...$ and block $$...$$) */
  math?: boolean;
  /** JSX runtime import path (default: "react/jsx-runtime") */
  jsxRuntime?: string;
  /** Enable default plugins (heading IDs, image optimization) */
  defaultPlugins?: boolean;
  /** File path for error reporting */
  filepath?: string;
}

/**
 * Frontmatter data
 */
export interface Frontmatter {
  /** Parsed frontmatter data */
  [key: string]: unknown;
}

/**
 * Compilation result
 */
export interface CompileResult {
  /** Generated JSX code */
  code: string;
  /** Parsed frontmatter (if any) */
  frontmatter?: Frontmatter;
  /** Frontmatter format */
  frontmatterFormat?: 'yaml' | 'toml';
  /** Collected image URLs */
  images: string[];
  /** Named exports found in ESM blocks */
  namedExports: string[];
  /** Re-exports found in ESM blocks */
  reexports: string[];
  /** Imports found in ESM blocks */
  imports: string[];
  /** Default export name */
  defaultExport?: string;
}

/**
 * Compilation error
 */
export interface CompileError extends Error {
  /** File path where error occurred */
  file?: string;
  /** Line number (1-indexed) */
  line?: number;
  /** Column number (1-indexed) */
  column?: number;
  /** Source code context */
  context?: string;
  /** Suggestion to fix the error */
  suggestion?: string;
}

/**
 * Compile MDX source to JSX (async)
 *
 * Auto-initializes WASM if needed. Use this for client-side or when you need async.
 *
 * @param source - MDX source code
 * @param options - Compilation options
 * @returns Compiled JSX and metadata
 *
 * @example
 * ```typescript
 * import { compile } from '@bunny/mdx-wasm';
 *
 * const result = await compile('# Hello **world**!', {
 *   gfm: true,
 *   math: true
 * });
 * ```
 */
export async function compile(
  source: string,
  options: CompileOptions = {}
): Promise<CompileResult> {
  // Auto-initialize if not already done
  await initialize();

  return compileSync(source, options);
}

/**
 * Synchronously compile MDX (only works after initialize() is called)
 *
 * Use this in Server Components after WASM is pre-initialized via instrumentation.ts.
 * Throws if WASM module is not initialized.
 *
 * @param source - MDX source code
 * @param options - Compilation options
 * @returns Compiled JSX and metadata
 *
 * @throws Error if WASM module is not initialized
 *
 * @example
 * ```typescript
 * import { compileSync } from '@bunny/mdx-wasm';
 *
 * // After initialize() is called in instrumentation.ts
 * const result = compileSync('# Hello **world**!', { gfm: true });
 * ```
 */
export function compileSync(
  source: string,
  options: CompileOptions = {}
): CompileResult {
  if (!initialized) {
    throw new Error(
      'WASM module not initialized. Call initialize() first (e.g., in Next.js instrumentation.ts) or use compile() instead.'
    );
  }

  // Convert options to WASM-compatible format
  const wasmOpts = Object.keys(options).length === 0 ? null : {
    gfm: options.gfm,
    footnotes: options.footnotes,
    math: options.math,
    jsx_runtime: options.jsxRuntime,
    default_plugins: options.defaultPlugins,
    filepath: options.filepath,
  };

  try {
    const result = wasmCompile(source, wasmOpts as any);

    return {
      code: result.code,
      frontmatter: result.frontmatter ? JSON.parse(result.frontmatter) : undefined,
      frontmatterFormat: result.frontmatter_format as 'yaml' | 'toml' | undefined,
      images: result.images,
      namedExports: result.named_exports,
      reexports: result.reexports,
      imports: result.imports,
      defaultExport: result.default_export,
    };
  } catch (error: any) {
    // Enhance error with better formatting
    const compileError = error as CompileError;
    if (compileError.line || compileError.column) {
      const location = `${compileError.file || 'unknown'}:${compileError.line}:${compileError.column}`;
      compileError.message = `${location} - ${compileError.message}`;
    }
    throw compileError;
  }
}

// Re-export WASM initialization for advanced use cases
export { init };

