//! Types for the bunny runtime bundling API

use bunny_mdx::{FrontmatterData, MdxCompileOptions};
use std::collections::HashMap;

/// Options for runtime MDX bundling
///
/// This configures how MDX content should be compiled and bundled at runtime,
/// similar to the mdx-bundler JavaScript library.
///
/// # Example
///
/// ```rust,no_run
/// use bunny::bundler::{BundleMdxOptions, bundle_mdx};
/// use std::collections::HashMap;
///
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// let options = BundleMdxOptions {
///     source: r#"
/// # Hello World
///
/// import Button from './Button.tsx'
///
/// <Button>Click me</Button>
///     "#.to_string(),
///     files: HashMap::from([
///         ("./Button.tsx".into(), r#"
/// export default function Button({children}) {
///     return <button>{children}</button>
/// }
///         "#.into()),
///     ]),
///     mdx_options: None,
/// };
///
/// let result = bundle_mdx(options).await?;
/// println!("Bundled code: {}", result.code);
/// # Ok(())
/// # }
/// ```
#[derive(Debug, Clone, Default)]
pub struct BundleMdxOptions {
    /// The MDX source code to compile and bundle
    pub source: String,

    /// Virtual filesystem: map of file paths to their contents
    ///
    /// When your MDX file imports other files, provide them here.
    /// Paths are relative to the MDX file.
    ///
    /// # Example
    ///
    /// ```rust
    /// use std::collections::HashMap;
    ///
    /// let files: HashMap<String, String> = HashMap::from([
    ///     ("./components/Button.tsx".to_string(), "...".to_string()),
    ///     ("./utils/helpers.ts".to_string(), "...".to_string()),
    /// ]);
    /// ```
    pub files: HashMap<String, String>,

    /// MDX compilation options (GFM, math, plugins, etc.)
    ///
    /// If `None`, uses default options with all features enabled.
    pub mdx_options: Option<MdxCompileOptions>,
}

impl BundleMdxOptions {
    /// Create a new BundleMdxOptions with just source
    ///
    /// # Example
    ///
    /// ```rust
    /// use bunny::bundler::BundleMdxOptions;
    ///
    /// let options = BundleMdxOptions::new("# Hello");
    /// ```
    pub fn new(source: impl Into<String>) -> Self {
        Self {
            source: source.into(),
            ..Default::default()
        }
    }

    /// Add a virtual file to the filesystem
    ///
    /// # Example
    ///
    /// ```rust
    /// use bunny::bundler::BundleMdxOptions;
    ///
    /// let options = BundleMdxOptions::new("import X from './x.js'")
    ///     .with_file("./x.js", "export default 'hi'");
    /// ```
    pub fn with_file(mut self, path: impl Into<String>, content: impl Into<String>) -> Self {
        self.files.insert(path.into(), content.into());
        self
    }

    /// Set MDX compilation options
    ///
    /// # Example
    ///
    /// ```rust
    /// use bunny::bundler::BundleMdxOptions;
    /// use bunny_mdx::MdxCompileOptions;
    ///
    /// let options = BundleMdxOptions::new("# Hello")
    ///     .with_mdx_options(
    ///         MdxCompileOptions::new()
    ///             .with_all_features()
    ///             .with_default_plugins()
    ///     );
    /// ```
    pub fn with_mdx_options(mut self, options: MdxCompileOptions) -> Self {
        self.mdx_options = Some(options);
        self
    }
}

/// Result of runtime MDX bundling
///
/// Contains the executable JavaScript bundle and extracted metadata.
///
/// # Example
///
/// ```rust,no_run
/// use bunny::bundler::{bundle_mdx, BundleMdxOptions};
///
/// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
/// let result = bundle_mdx(BundleMdxOptions::new("# Hello")).await?;
///
/// // Send to client
/// println!("Bundle size: {} bytes", result.code.len());
///
/// // Check for frontmatter
/// if let Some(fm) = result.frontmatter {
///     println!("Frontmatter: {:?}", fm.raw);
/// }
/// # Ok(())
/// # }
/// ```
#[derive(Debug, Clone)]
pub struct BundleMdxResult {
    /// Executable JavaScript bundle
    ///
    /// This is a complete, self-contained bundle that can be executed
    /// in a JavaScript runtime. On the client, use it with `getMDXComponent()`
    /// from mdx-bundler/client or a similar runtime.
    pub code: String,

    /// Parsed frontmatter from the MDX file
    ///
    /// Extracted from YAML or TOML frontmatter blocks at the top of the file.
    pub frontmatter: Option<FrontmatterData>,
}

impl BundleMdxResult {
    /// Get the size of the bundled code in bytes
    pub fn size(&self) -> usize {
        self.code.len()
    }

    /// Check if frontmatter was present
    pub fn has_frontmatter(&self) -> bool {
        self.frontmatter.is_some()
    }
}
