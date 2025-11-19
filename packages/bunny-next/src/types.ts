import type { ComponentType } from 'react';
import type { MDXComponents } from '@bunny/mdx-runtime';

/**
 * Options for compiling MDX
 */
export interface CompileOptions {
  /** Enable GitHub Flavored Markdown (default: true) */
  gfm?: boolean;
  /** Enable footnotes (default: true) */
  footnotes?: boolean;
  /** Enable math support (default: false) */
  math?: boolean;
  /** Enable frontmatter parsing (default: true) */
  frontmatter?: boolean;
}

/**
 * Options for serializing MDX content
 */
export interface SerializeOptions<TScope = Record<string, unknown>> {
  /** Variables to pass to MDX components */
  scope?: TScope;
  /** MDX compilation options */
  mdxOptions?: CompileOptions;
  /** Parse frontmatter (default: true) */
  parseFrontmatter?: boolean;
}

/**
 * Result from serializing MDX content
 */
export interface SerializeResult<
  TScope = Record<string, unknown>,
  TFrontmatter = Record<string, any>
> {
  /** Compiled MDX source code */
  compiledSource: string;
  /** Parsed frontmatter */
  frontmatter?: TFrontmatter;
  /** Scope variables */
  scope?: TScope;
  /** Image URLs found in content */
  images?: string[];
}

/**
 * Options for evaluating MDX content
 */
export interface EvaluateOptions<TScope = Record<string, unknown>> {
  /** Variables to pass to MDX components */
  scope?: TScope;
  /** MDX compilation options */
  mdxOptions?: CompileOptions;
  /** Components to make available in MDX */
  components?: MDXComponents;
}

/**
 * Result from evaluating MDX content
 */
export interface EvaluateResult<TFrontmatter = Record<string, any>> {
  /** MDX component ready to render */
  default: ComponentType<MDXContentProps>;
  /** Parsed frontmatter */
  frontmatter?: TFrontmatter;
  /** All named exports from the MDX */
  [exportName: string]: any;
}

/**
 * Props for MDX content components
 */
export interface MDXContentProps {
  /** Components to override default rendering */
  components?: MDXComponents;
  /** Additional props passed to the component */
  [key: string]: any;
}

/**
 * Props for the MDXRemote component
 */
export interface MDXRemoteProps<
  TScope = Record<string, unknown>,
  TFrontmatter = Record<string, any>
> {
  /** Compiled source from serialize() */
  compiledSource: string;
  /** Components to override */
  components?: MDXComponents;
  /** Scope variables */
  scope?: TScope;
  /** Lazy load the component */
  lazy?: boolean;
  /** Frontmatter metadata */
  frontmatter?: TFrontmatter;
}

/**
 * Props for the MDXServerComponent
 */
export interface MDXServerComponentProps<TScope = Record<string, unknown>> {
  /** Raw MDX source */
  source: string;
  /** Components to make available */
  components?: MDXComponents;
  /** Scope variables */
  scope?: TScope;
  /** MDX compilation options */
  mdxOptions?: CompileOptions;
}

/**
 * Webpack loader context type
 */
export interface LoaderContext<TOptions = any> {
  /** Async callback for webpack loaders */
  async(): (err: Error | null, result?: string) => void;
  /** Get loader options */
  getOptions(): TOptions;
  /** Resource path being loaded */
  resourcePath: string;
  /** Add file dependency */
  addDependency(file: string): void;
  /** Emit error */
  emitError(error: Error): void;
  /** Emit warning */
  emitWarning(warning: Error): void;
}
