/**
 * bunny-wasm - MDX compiler for browsers and WASM environments
 *
 * Compile MDX v3 to JSX in the browser using WebAssembly.
 * For Node.js environments, use @fob/bunny-node (native NAPI module) for better performance.
 *
 * @module
 *
 * @example
 * ```typescript
 * import { compile } from "@fob/bunny-wasm";
 *
 * const result = compile("# Hello **World**", {
 *   gfm: true,
 *   math: true,
 * });
 *
 * console.log(result.code);        // Compiled JSX
 * console.log(result.frontmatter); // Parsed frontmatter
 * ```
 *
 * @example Browser usage
 * ```html
 * <script type="module">
 *   import { compile } from 'https://esm.sh/jsr/@fob/bunny-wasm';
 *
 *   const result = compile('# Hello from the browser!', { gfm: true });
 *   document.body.innerHTML = result.code;
 * </script>
 * ```
 */

// Export everything from the generated WASM bindings
// The @ts-self-types directive in bunny_wasm.js tells JSR to use bunny_wasm.d.ts
export {
  compile,
  init_wasm,
  CompileOptions,
  CompileResult,
} from "./pkg/bunny_wasm.js";
