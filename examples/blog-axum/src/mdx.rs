use anyhow::Result;
use bunny_mdx::{compile, MdxCompileOptions};
use serde_json::Value as JsonValue;
use std::collections::HashMap;

pub struct MdxCompiler {
    options: MdxCompileOptions,
}

#[derive(Debug)]
pub struct CompileResult {
    pub code: String,
    pub frontmatter: HashMap<String, JsonValue>,
}

impl MdxCompiler {
    pub fn new() -> Self {
        Self {
            options: MdxCompileOptions::new()
                .with_jsx_runtime("react/jsx-runtime"),
        }
    }

    pub fn compile(&self, source: &str) -> Result<CompileResult> {
        let result = compile(source, self.options.clone())?;
        
        // Extract frontmatter if present
        let frontmatter = if let Some(fm) = &result.frontmatter {
            // FrontmatterData.data is already a JsonValue, convert to HashMap
            if let JsonValue::Object(map) = &fm.data {
                map.iter()
                    .map(|(k, v)| (k.clone(), v.clone()))
                    .collect()
            } else {
                HashMap::new()
            }
        } else {
            HashMap::new()
        };

        Ok(CompileResult {
            code: result.code,
            frontmatter,
        })
    }
}

impl Default for MdxCompiler {
    fn default() -> Self {
        Self::new()
    }
}

