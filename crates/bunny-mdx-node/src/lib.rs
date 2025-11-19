#![deny(clippy::all)]

//! Node.js bindings for bunny-mdx compiler
//!
//! Provides just the MDX→JSX compiler without bundling.
//!
//! # Example
//!
//! ```javascript
//! import { compile } from '@bunny/mdx-node';
//!
//! const result = compile('# Hello\n\nThis is **MDX**', {
//!   gfm: true,
//!   math: false
//! });
//!
//! console.log(result.code);        // JSX output
//! console.log(result.frontmatter); // Parsed frontmatter
//! console.log(result.images);      // Image URLs
//! ```

use bunny_mdx::{compile as mdx_compile, MdxCompileOptions as RustMdxOptions};
use napi::bindgen_prelude::*;
use napi_derive::napi;

/// MDX compilation options
#[napi(object)]
pub struct CompileOptions {
    /// Enable GitHub Flavored Markdown
    pub gfm: Option<bool>,
    /// Enable footnotes
    pub footnotes: Option<bool>,
    /// Enable math expressions
    pub math: Option<bool>,
    /// File path for error reporting
    pub filepath: Option<String>,
}

/// Frontmatter data
#[napi(object)]
pub struct Frontmatter {
    /// Raw frontmatter string
    pub raw: String,
    /// Parsed data as JSON string
    pub data: String,
}

/// MDX compilation result
#[napi(object)]
pub struct CompileResult {
    /// Generated JSX code
    pub code: String,
    /// Parsed frontmatter (if present)
    pub frontmatter: Option<Frontmatter>,
    /// Collected image URLs
    pub images: Vec<String>,
    /// Named exports
    pub named_exports: Vec<String>,
    /// Re-exports
    pub reexports: Vec<String>,
    /// Imports
    pub imports: Vec<String>,
    /// Default export name
    pub default_export: Option<String>,
}

/// Compile MDX to JSX
///
/// # Arguments
/// * `source` - MDX source code
/// * `options` - Compilation options
///
/// # Returns
/// Returns a `CompileResult` containing the generated JSX and metadata
///
/// # Errors
/// Returns an error if MDX compilation fails
///
/// # Example
/// ```javascript
/// const result = compile('# Hello\n\nThis is **MDX**', {
///   gfm: true,
///   math: false
/// });
/// console.log(result.code);
/// ```
#[napi]
pub fn compile(source: String, options: Option<CompileOptions>) -> Result<CompileResult> {
    // Use default options if not provided
    let opts = options.unwrap_or(CompileOptions {
        gfm: Some(true),
        footnotes: Some(true),
        math: Some(true),
        filepath: None,
    });

    // Build Rust options
    let mut mdx_opts = RustMdxOptions::new();

    if opts.gfm.unwrap_or(true) {
        mdx_opts.gfm = true;
    }
    if opts.footnotes.unwrap_or(true) {
        mdx_opts.footnotes = true;
    }
    if opts.math.unwrap_or(true) {
        mdx_opts.math = true;
    }
    if let Some(path) = opts.filepath {
        mdx_opts.filepath = Some(path);
    }

    // Add default plugins
    mdx_opts = mdx_opts.with_default_plugins();

    // Compile
    let result = mdx_compile(&source, mdx_opts)
        .map_err(|e| Error::from_reason(format!("MDX compilation failed: {}", e)))?;

    // Convert frontmatter to JSON string
    let frontmatter = result.frontmatter.map(|fm| {
        let data_json = serde_json::to_string(&fm.data).unwrap_or_else(|_| "{}".to_string());

        Frontmatter {
            raw: fm.raw,
            data: data_json,
        }
    });

    Ok(CompileResult {
        code: result.code,
        frontmatter,
        images: result.images,
        named_exports: result.named_exports,
        reexports: result.reexports,
        imports: result.imports,
        default_export: result.default_export,
    })
}
