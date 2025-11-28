use bunny_mdx::{compile, MdxCompileOptions, OutputFormat};
use std::io::{self, Read};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Read MDX from stdin
    let mut input = String::new();
    io::stdin().read_to_string(&mut input)?;

    // Parse command line args for options
    let args: Vec<String> = std::env::args().collect();
    let output_format = args
        .get(1)
        .map(|s| match s.as_str() {
            "function-body" => OutputFormat::FunctionBody,
            _ => OutputFormat::Program,
        })
        .unwrap_or(OutputFormat::Program);

    // Create options with all features enabled (matching benchmark defaults)
    let mut options = MdxCompileOptions::new();
    options.gfm = true;
    options.footnotes = true;
    options.math = true;
    options.output_format = output_format;

    // Compile MDX
    let result = compile(&input, options)?;

    // Output result as JSON for easy parsing
    let output = serde_json::json!({
        "code": result.code,
        "success": true
    });

    println!("{}", serde_json::to_string(&output)?);
    Ok(())
}

