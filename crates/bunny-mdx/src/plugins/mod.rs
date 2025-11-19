//! Plugin system for MDX transformations

mod trait_def;
mod heading_ids;
mod image_optimization;
mod link_validation;

pub use trait_def::MdxPlugin;
pub use heading_ids::HeadingIdPlugin;
pub use image_optimization::ImageOptimizationPlugin;
pub use link_validation::LinkValidationPlugin;
