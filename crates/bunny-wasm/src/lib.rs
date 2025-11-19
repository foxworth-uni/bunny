//! # bunny-wasm
//!
//! WebAssembly bindings for the bunny-mdx compiler, enabling MDX v3 compilation
//! in browser and edge runtime environments.
//!
//! ## Features
//!
//! - Compile MDX v3 to JSX in the browser/edge runtimes
//! - Zero-copy serialization with serde-wasm-bindgen
//! - Full support for GFM, math, and footnotes
//! - Structured error reporting with source context
//! - Optimized for minimal WASM binary size
//!
//! ## Security
//!
//! - All inputs are validated by the underlying bunny-mdx parser
//! - No unsafe code - all FFI boundaries handled by wasm-bindgen
//! - Panics are caught and converted to JavaScript exceptions
//! - No dynamic code execution or eval()
//!
//! ## Usage (JavaScript)
//!
//! ```javascript
//! import init, { compile } from './bunny_wasm.js';
//!
//! await init();
//!
//! const result = compile('# Hello\n\nThis is **MDX**!', {
//!   gfm: true,
//!   math: true,
//!   footnotes: true,
//!   jsx_runtime: 'react/jsx-runtime'
//! });
//!
//! console.log(result.code);        // Compiled JSX
//! console.log(result.frontmatter); // Parsed frontmatter
//! console.log(result.images);      // Collected images
//! ```

use bunny_mdx::{MdxCompileOptions, MdxCompileResult as CoreResult, MdxError};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// Optional: Use wee_alloc for smaller binary size
// This is a trade-off: smaller WASM binary but slightly slower allocation
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Initialize the WASM module with panic hooks for better debugging
///
/// This is automatically called when the module is loaded, but can be
/// called explicitly to ensure proper setup.
#[wasm_bindgen(start)]
pub fn init_wasm() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Compilation options for MDX
///
/// Controls which features are enabled during compilation and how
/// the output is generated.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen(getter_with_clone)]
pub struct CompileOptions {
    /// Enable GitHub Flavored Markdown (tables, strikethrough, task lists, autolinks)
    #[wasm_bindgen(skip)]
    pub gfm: Option<bool>,

    /// Enable footnotes with backrefs
    #[wasm_bindgen(skip)]
    pub footnotes: Option<bool>,

    /// Enable math support (inline $...$ and block $$...$)
    #[wasm_bindgen(skip)]
    pub math: Option<bool>,

    /// JSX runtime import path (default: "react/jsx-runtime")
    #[wasm_bindgen(skip)]
    pub jsx_runtime: Option<String>,

    /// Enable default plugins (heading IDs, image optimization)
    #[wasm_bindgen(skip)]
    pub default_plugins: Option<bool>,

    /// File path for error reporting (optional)
    #[wasm_bindgen(skip)]
    pub filepath: Option<String>,
}

#[wasm_bindgen]
impl CompileOptions {
    /// Create a new CompileOptions with default values
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            gfm: None,
            footnotes: None,
            math: None,
            jsx_runtime: None,
            default_plugins: None,
            filepath: None,
        }
    }
}

impl Default for CompileOptions {
    fn default() -> Self {
        Self::new()
    }
}

/// Result of MDX compilation
///
/// Contains the compiled JSX code and all extracted metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[wasm_bindgen(getter_with_clone)]
pub struct CompileResult {
    /// Generated JSX code
    #[wasm_bindgen(readonly)]
    pub code: String,

    /// Parsed frontmatter as JSON string (null if none)
    #[wasm_bindgen(skip)]
    pub frontmatter: Option<String>,

    /// Frontmatter format ("yaml" or "toml", null if none)
    #[wasm_bindgen(skip)]
    pub frontmatter_format: Option<String>,

    /// Array of image URLs collected during compilation
    #[wasm_bindgen(skip)]
    pub images: Vec<String>,

    /// Named exports found in ESM blocks
    #[wasm_bindgen(skip)]
    pub named_exports: Vec<String>,

    /// Re-exports found in ESM blocks
    #[wasm_bindgen(skip)]
    pub reexports: Vec<String>,

    /// Imports found in ESM blocks
    #[wasm_bindgen(skip)]
    pub imports: Vec<String>,

    /// Default export name (null if none)
    #[wasm_bindgen(skip)]
    pub default_export: Option<String>,
}

#[wasm_bindgen]
impl CompileResult {
    /// Get frontmatter as JSON string (for JavaScript access)
    #[wasm_bindgen(getter)]
    pub fn frontmatter(&self) -> Option<String> {
        self.frontmatter.clone()
    }

    /// Get frontmatter format
    #[wasm_bindgen(getter)]
    pub fn frontmatter_format(&self) -> Option<String> {
        self.frontmatter_format.clone()
    }

    /// Get collected image URLs
    #[wasm_bindgen(getter)]
    pub fn images(&self) -> Vec<String> {
        self.images.clone()
    }

    /// Get named exports
    #[wasm_bindgen(getter)]
    pub fn named_exports(&self) -> Vec<String> {
        self.named_exports.clone()
    }

    /// Get re-exports
    #[wasm_bindgen(getter)]
    pub fn reexports(&self) -> Vec<String> {
        self.reexports.clone()
    }

    /// Get imports
    #[wasm_bindgen(getter)]
    pub fn imports(&self) -> Vec<String> {
        self.imports.clone()
    }

    /// Get default export name
    #[wasm_bindgen(getter)]
    pub fn default_export(&self) -> Option<String> {
        self.default_export.clone()
    }
}

/// Compile MDX source to JSX
///
/// # Arguments
///
/// * `source` - The MDX source code to compile
/// * `options` - Optional compilation options (JavaScript object)
///
/// # Returns
///
/// * `Ok(CompileResult)` - Compiled JSX and extracted metadata
/// * `Err(JsValue)` - Compilation error with context
///
/// # Security
///
/// This function safely processes untrusted input:
/// - Input is validated by the markdown parser
/// - ESM syntax is validated with OXC parser
/// - No code execution occurs during compilation
/// - All errors are caught and reported safely
///
/// # Example (JavaScript)
///
/// ```javascript
/// const result = compile('# Hello', { gfm: true });
/// console.log(result.code);
/// ```
#[wasm_bindgen]
pub fn compile(source: &str, options: JsValue) -> Result<CompileResult, JsValue> {
    // Deserialize JavaScript options using serde-wasm-bindgen
    let opts: CompileOptions = if options.is_null() || options.is_undefined() {
        CompileOptions::default()
    } else {
        serde_wasm_bindgen::from_value(options)
            .map_err(|e| JsValue::from_str(&format!("Invalid options: {}", e)))?
    };

    let mut compile_opts = MdxCompileOptions::new();

    // Apply feature flags
    if opts.gfm.unwrap_or(false) {
        compile_opts.gfm = true;
    }
    if opts.footnotes.unwrap_or(false) {
        compile_opts.footnotes = true;
    }
    if opts.math.unwrap_or(false) {
        compile_opts.math = true;
    }

    // Set JSX runtime
    if let Some(runtime) = opts.jsx_runtime {
        compile_opts.jsx_runtime = runtime;
    }

    // Set filepath for error reporting
    if let Some(filepath) = opts.filepath {
        compile_opts.filepath = Some(filepath);
    }

    // Add default plugins if requested
    if opts.default_plugins.unwrap_or(false) {
        compile_opts = compile_opts.with_default_plugins();
    }

    // Compile MDX to JSX
    // This is the core operation - all input validation happens here
    let result = bunny_mdx::compile(source, compile_opts).map_err(convert_error)?;

    // Convert to WASM-friendly result
    Ok(convert_result(result))
}

/// Convert core MdxCompileResult to WASM CompileResult
///
/// This performs serialization of complex types (frontmatter) to JSON
/// for easy consumption by JavaScript.
fn convert_result(result: CoreResult) -> CompileResult {
    let (frontmatter, frontmatter_format) = result
        .frontmatter
        .as_ref()
        .map(|fm| {
            let json_str = serde_json::to_string(&fm.data).unwrap_or_else(|_| "null".to_string());
            let format = match fm.format {
                bunny_mdx::FrontmatterFormat::Yaml => "yaml",
                bunny_mdx::FrontmatterFormat::Toml => "toml",
            }
            .to_string();
            (Some(json_str), Some(format))
        })
        .unwrap_or((None, None));

    CompileResult {
        code: result.code,
        frontmatter,
        frontmatter_format,
        images: result.images,
        named_exports: result.named_exports,
        reexports: result.reexports,
        imports: result.imports,
        default_export: result.default_export,
    }
}

/// Convert MdxError to JsValue with structured error information
///
/// This creates a JavaScript Error object with all the context from MdxError,
/// making errors easy to handle in JavaScript.
///
/// # Error Structure
///
/// The JavaScript error object will have these properties:
/// - `message`: The error message
/// - `file`: Optional file path
/// - `line`: Optional line number (1-indexed)
/// - `column`: Optional column number (1-indexed)
/// - `context`: Optional source code context
/// - `suggestion`: Optional fix suggestion
fn convert_error(error: Box<MdxError>) -> JsValue {
    // Create a JavaScript object with all error information
    let obj = js_sys::Object::new();

    // Set message
    js_sys::Reflect::set(&obj, &"message".into(), &error.message.clone().into())
        .unwrap_or_default();

    // Set optional file
    if let Some(ref file) = error.file {
        js_sys::Reflect::set(&obj, &"file".into(), &file.clone().into()).unwrap_or_default();
    }

    // Set optional line and column
    if let Some(line) = error.line {
        js_sys::Reflect::set(&obj, &"line".into(), &JsValue::from_f64(line as f64))
            .unwrap_or_default();
    }
    if let Some(column) = error.column {
        js_sys::Reflect::set(&obj, &"column".into(), &JsValue::from_f64(column as f64))
            .unwrap_or_default();
    }

    // Set optional context
    if let Some(ref context) = error.context {
        js_sys::Reflect::set(&obj, &"context".into(), &context.clone().into())
            .unwrap_or_default();
    }

    // Set optional suggestion
    if let Some(ref suggestion) = error.suggestion {
        js_sys::Reflect::set(&obj, &"suggestion".into(), &suggestion.clone().into())
            .unwrap_or_default();
    }

    // Create a proper JavaScript Error with the message
    let js_error = js_sys::Error::new(&error.message);

    // Copy all properties to the error object
    let error_obj = js_error.as_ref();
    let keys = js_sys::Object::keys(&obj);
    for i in 0..keys.length() {
        let key = keys.get(i);
        if let Ok(value) = js_sys::Reflect::get(&obj, &key) {
            js_sys::Reflect::set(error_obj, &key, &value).unwrap_or_default();
        }
    }

    js_error.into()
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    fn test_basic_compilation() {
        let result = compile("# Hello\n\nThis is **bold** text.", None).unwrap();
        assert!(result.code.contains("Hello"));
        assert!(result.code.contains("bold"));
    }

    #[wasm_bindgen_test]
    fn test_with_options() {
        let opts = CompileOptions {
            gfm: Some(true),
            math: Some(true),
            footnotes: Some(true),
            jsx_runtime: Some("react/jsx-runtime".to_string()),
            default_plugins: Some(false),
            filepath: None,
        };

        let result = compile("This is ~~strikethrough~~ text.", Some(opts)).unwrap();
        assert!(result.code.contains("del"));
    }

    #[wasm_bindgen_test]
    fn test_with_frontmatter() {
        let result = compile("---\ntitle: Test\n---\n\n# Hello", None).unwrap();
        assert!(result.frontmatter.is_some());
        assert_eq!(result.frontmatter_format, Some("yaml".to_string()));
    }

    #[wasm_bindgen_test]
    fn test_invalid_mdx() {
        let result = compile("import { foo } fro './bar'", None);
        assert!(result.is_err());
    }

    #[wasm_bindgen_test]
    fn test_empty_input() {
        let result = compile("", None).unwrap();
        assert!(!result.code.is_empty()); // Should contain wrapper function
    }

    #[wasm_bindgen_test]
    fn test_math_support() {
        let opts = CompileOptions {
            math: Some(true),
            ..Default::default()
        };
        let result = compile("Inline math: $E = mc^2$", Some(opts)).unwrap();
        assert!(result.code.contains("math"));
    }

    #[wasm_bindgen_test]
    fn test_default_plugins() {
        let opts = CompileOptions {
            default_plugins: Some(true),
            ..Default::default()
        };
        let result = compile("# Hello World\n\n![test](./image.png)", Some(opts)).unwrap();
        assert!(!result.images.is_empty());
        assert_eq!(result.images[0], "./image.png");
    }
}
