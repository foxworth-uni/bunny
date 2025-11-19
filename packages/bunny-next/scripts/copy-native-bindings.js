#!/usr/bin/env node

/**
 * Copy native .node bindings from @bunny/mdx-node to dist/
 * This ensures the native binaries are available when bunny-next is used
 */

import { copyFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const distDir = join(projectRoot, 'dist');

// Resolve @bunny/mdx-node from node_modules
const mdxNodeDir = join(projectRoot, 'node_modules', '@bunny', 'mdx-node');

if (!existsSync(mdxNodeDir)) {
  console.error('[bunny-next] Error: @bunny/mdx-node not found in node_modules');
  process.exit(1);
}

// Find all .node files in @bunny/mdx-node
const files = readdirSync(mdxNodeDir);
const nodeFiles = files.filter((file) => file.endsWith('.node'));

if (nodeFiles.length === 0) {
  console.error('[bunny-next] Error: No .node files found in @bunny/mdx-node');
  process.exit(1);
}

console.log('[bunny-next] Copying native bindings to dist/...');

// Copy each .node file to dist/
for (const file of nodeFiles) {
  const src = join(mdxNodeDir, file);
  const dest = join(distDir, file);

  try {
    copyFileSync(src, dest);
    console.log(`[bunny-next] ✓ Copied ${file}`);
  } catch (error) {
    console.error(`[bunny-next] ✗ Failed to copy ${file}:`, error.message);
    process.exit(1);
  }
}

console.log(`[bunny-next] ✓ Copied ${nodeFiles.length} native binding(s)`);
