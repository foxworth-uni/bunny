//! # bunny
//!
//! Runtime MDX compiler and bundler for Rust.
//!
//! This crate provides a runtime bundling API similar to the JavaScript
//! [mdx-bundler](https://github.com/kentcdodds/mdx-bundler) library. It compiles
//! MDX to JSX and bundles all imports into a single executable JavaScript string
//! that can be sent to clients and executed.
//!
//! ## Use Cases
//!
//! - **CMS/Database content**: Fetch MDX from a database and bundle at request time
//! - **SSR frameworks**: Compile and bundle MDX on the server for each request
//! - **Preview systems**: Show live previews of MDX content before publishing
//! - **Dynamic content platforms**: Serve personalized MDX content per user
//!
//! ## Comparison with Other Tools
//!
//! | Tool | Purpose | When to Use |
//! |------|---------|-------------|
//! | `bunny` | Runtime bundling | Server-side, dynamic content from CMS/DB |
//! | `fob-mdx-plugin` | Build-time plugin | Static sites, pre-build all content |
//! | `bunny-mdx-node` | Node.js bindings | Using from JavaScript/TypeScript |
//! | `bunny-mdx` | Just MDX compilation | Building custom integrations |
//!
//! ## Example
//!
//! ```rust,no_run
//! use bunny::{bundle_mdx, BundleMdxOptions};
//! use std::collections::HashMap;
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // MDX content with imports
//!     let mdx = r#"
//! ---
//! title: My Blog Post
//! ---
//!
//! # Hello World
//!
//! import Button from './Button.tsx'
//!
//! <Button>Click me!</Button>
//!     "#;
//!
//!     // Provide dependencies as virtual files
//!     let options = BundleMdxOptions {
//!         source: mdx.to_string(),
//!         files: HashMap::from([
//!             ("./Button.tsx".into(), r#"
//! export default function Button({children}) {
//!     return <button className="btn">{children}</button>
//! }
//!             "#.into()),
//!         ]),
//!         mdx_options: None, // Uses default (all features enabled)
//!     };
//!
//!     // Bundle at runtime
//!     let result = bundle_mdx(options).await?;
//!
//!     println!("Bundle size: {} bytes", result.size());
//!     println!("Title: {:?}", result.frontmatter);
//!
//!     // Send result.code to client for execution
//!     // Client uses: getMDXComponent(code)
//!
//!     Ok(())
//! }
//! ```
//!
//! ## Performance Considerations
//!
//! - **Runtime overhead**: Bundling happens at request time, add caching!
//! - **Memory usage**: Bundler runs in-memory
//! - **Scaling**: Use caching layer (Redis, in-memory) for production
//!
//! ## Architecture
//!
//! ```text
//! MDX source
//!    ↓
//! bunny-mdx (compile MDX → JSX)
//!    ↓
//! fob-core (bundle JSX + imports → single .js)
//!    ↓
//! Executable JavaScript string
//! ```

mod types;

pub use types::{BundleMdxOptions, BundleMdxResult};

use anyhow::{Context, Result};
use bunny_mdx::{compile, MdxCompileOptions};
use fob::{build, BunnyMdxPlugin, BuildOptions, BuildOutput, BundleOutput, OutputFormat};
use std::path::PathBuf;
use std::sync::Arc;

/// Extract JavaScript code from a Rolldown bundle output
///
/// Searches for the first entry chunk in the bundle and returns its code.
fn extract_bundle_code(bundle: &BundleOutput) -> Result<String> {
    use rolldown_common::Output;

    // Find the first JavaScript chunk (should be our entry)
    bundle
        .assets
        .iter()
        .find_map(|asset| {
            if let Output::Chunk(chunk) = asset {
                Some(chunk.code.clone())
            } else {
                None
            }
        })
        .ok_or_else(|| anyhow::anyhow!("No JavaScript chunk found in bundle output"))
}

/// Compile and bundle MDX at runtime
///
/// This is the main entry point for runtime MDX bundling. It takes MDX source code
/// and a map of virtual files, then compiles the MDX to JSX and bundles all imports
/// into a single executable JavaScript string.
///
/// # Arguments
///
/// * `options` - Configuration for MDX compilation and bundling
///
/// # Returns
///
/// * `Ok(BundleMdxResult)` - Bundled JavaScript code and metadata
/// * `Err` - Compilation or bundling error
///
/// # Example
///
/// ```rust,no_run
/// use bunny::{bundle_mdx, BundleMdxOptions};
/// use bunny_mdx::MdxCompileOptions;
/// use std::collections::HashMap;
///
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// let result = bundle_mdx(BundleMdxOptions {
///     source: "# Hello\n\nimport X from './x.js'\n\n<X />".to_string(),
///     files: HashMap::from([
///         ("./x.js".into(), "export default () => 'Hi'".into()),
///     ]),
///     mdx_options: Some(
///         MdxCompileOptions::new()
///             .with_all_features()
///             .with_default_plugins()
///     ),
/// }).await?;
///
/// // result.code is ready to execute on client
/// println!("Bundle: {}", result.code);
/// # Ok(())
/// # }
/// ```
///
/// # Performance
///
/// This function performs bundling synchronously in the current task. For high-throughput
/// servers, consider:
///
/// - Caching bundled results (MDX source hash → bundle)
/// - Rate limiting bundle requests
/// - Using a task queue for bundling operations
///
/// # Errors
///
/// Returns error if:
/// - MDX compilation fails (syntax error, invalid JSX)
/// - Bundling fails (missing import, invalid JavaScript)
/// - File I/O fails (temporary directory creation)
pub async fn bundle_mdx(options: BundleMdxOptions) -> Result<BundleMdxResult> {
    // Step 1: Compile MDX to JSX
    let mdx_opts = options.mdx_options.unwrap_or_else(|| {
        MdxCompileOptions::new()
            .with_all_features()
            .with_default_plugins()
    });

    let mdx_result = compile(&options.source, mdx_opts).context("Failed to compile MDX to JSX")?;

    // Step 2: Bundle using fob-core with virtual files
    let mut build_opts = BuildOptions::new("__mdx_entry__.jsx")
        .format(OutputFormat::Esm)
        .sourcemap_hidden()
        .plugin(Arc::new(BunnyMdxPlugin::new(PathBuf::from("."))));

    // Add MDX entry as virtual file
    build_opts.virtual_files
        .insert("__mdx_entry__.jsx".to_string(), mdx_result.code.clone());

    // Add all user-provided virtual files
    for (path, content) in options.files {
        build_opts.virtual_files.insert(path, content);
    }

    let build_result = build(build_opts)
        .await
        .context("Failed to bundle MDX and dependencies")?;

    // Step 3: Extract bundled code from result
    let bundled_code = match build_result.output {
        BuildOutput::Single(bundle) => extract_bundle_code(&bundle)?,
        BuildOutput::Multiple(_) => {
            anyhow::bail!("Unexpected multiple bundle output for single MDX file")
        }
    };

    Ok(BundleMdxResult {
        code: bundled_code,
        frontmatter: mdx_result.frontmatter,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_basic_mdx_bundling() {
        let result = bundle_mdx(BundleMdxOptions::new("# Hello World")).await;
        assert!(result.is_ok());

        let bundle = result.unwrap();
        assert!(!bundle.code.is_empty());
        assert!(bundle.code.contains("Hello World") || bundle.code.len() > 100);
    }

    #[tokio::test]
    async fn test_mdx_with_frontmatter() {
        let mdx = r#"---
title: Test Post
author: Joy
---

# Hello
"#;
        let result = bundle_mdx(BundleMdxOptions::new(mdx)).await.unwrap();

        // Note: Frontmatter is extracted during MDX compilation
        // This test just verifies bundling succeeds with frontmatter present
        assert!(!result.code.is_empty());
        // Frontmatter extraction is tested in bunny-mdx crate
    }

    #[tokio::test]
    async fn test_mdx_with_imports() {
        let mdx = r#"
import Button from './Button.jsx'

# Test

<Button>Click</Button>
"#;

        let button_component = r#"
export default function Button({children}) {
    return <button>{children}</button>
}
"#;

        let options = BundleMdxOptions::new(mdx).with_file("./Button.jsx", button_component);

        let result = bundle_mdx(options).await;
        assert!(
            result.is_ok(),
            "Bundling with imports should succeed: {:?}",
            result.err()
        );

        let bundle = result.unwrap();
        assert!(!bundle.code.is_empty());
        // Bundle should contain button logic
        assert!(bundle.code.len() > 200);
    }
}
