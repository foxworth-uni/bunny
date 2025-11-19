/**
 * Tests for Bunny MDX compiler
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { compile, compileSync, initialize, CompileError } from './index.js';
import { initSync } from '../dist/bunny_wasm.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize WASM once before all tests using Node.js sync method
beforeAll(() => {
  // Load WASM file synchronously for Node.js environment
  const wasmPath = join(__dirname, '../dist/bunny_wasm_bg.wasm');
  const wasmBuffer = readFileSync(wasmPath);
  initSync(wasmBuffer);
});

describe('initialization', () => {
  it('should initialize without errors', async () => {
    await expect(initialize()).resolves.not.toThrow();
  });

  it('should be safe to call initialize multiple times', async () => {
    await initialize();
    await initialize();
    await initialize();
    // No errors should occur
  });
});

describe('compile() - basic functionality', () => {
  it('should compile simple markdown', async () => {
    const result = await compile('# Hello World');
    expect(result.code).toBeTruthy();
    expect(result.code).toContain('Hello World');
  });

  it('should compile MDX with bold text', async () => {
    const result = await compile('This is **bold** text');
    expect(result.code).toContain('bold');
  });

  it('should compile MDX with italic text', async () => {
    const result = await compile('This is *italic* text');
    expect(result.code).toContain('italic');
  });

  it('should compile empty string', async () => {
    const result = await compile('');
    expect(result.code).toBeTruthy(); // Should still return wrapper code
  });

  it('should compile multiline markdown', async () => {
    const mdx = `
# Title

Paragraph 1

Paragraph 2
    `.trim();

    const result = await compile(mdx);
    expect(result.code).toContain('Title');
    expect(result.code).toContain('Paragraph 1');
    expect(result.code).toContain('Paragraph 2');
  });
});

describe('compile() - options', () => {
  it('should handle GFM option - strikethrough', async () => {
    const result = await compile('This is ~~strikethrough~~ text', { gfm: true });
    expect(result.code).toContain('del');
  });

  it('should handle GFM option - tables', async () => {
    const mdx = `
| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
    `.trim();

    const result = await compile(mdx, { gfm: true });
    expect(result.code).toContain('table');
  });

  it('should handle GFM option - task lists', async () => {
    const mdx = `
- [ ] Task 1
- [x] Task 2
    `.trim();

    const result = await compile(mdx, { gfm: true });
    expect(result.code).toContain('checkbox');
  });

  it('should handle math option - inline', async () => {
    const result = await compile('Inline math: $E = mc^2$', { math: true });
    expect(result.code).toContain('math');
  });

  it('should handle math option - block', async () => {
    const mdx = `
$$
E = mc^2
$$
    `.trim();

    const result = await compile(mdx, { math: true });
    expect(result.code).toContain('math');
  });

  it('should handle footnotes option', async () => {
    const mdx = `
Text with footnote[^1]

[^1]: This is the footnote
    `.trim();

    const result = await compile(mdx, { footnotes: true });
    expect(result.code).toContain('footnote');
  });

  it('should handle custom JSX runtime', async () => {
    const result = await compile('# Hello', {
      jsxRuntime: 'preact/jsx-runtime'
    });
    expect(result.code).toContain('preact/jsx-runtime');
  });

  it('should handle filepath option for error reporting', async () => {
    const result = await compile('# Hello', {
      filepath: 'test.mdx'
    });
    expect(result.code).toBeTruthy();
  });
});

describe('compile() - frontmatter', () => {
  it('should parse YAML frontmatter', async () => {
    const mdx = `---
title: Test Post
author: John Doe
tags: [mdx, test]
---

# Content
    `.trim();

    const result = await compile(mdx);
    expect(result.frontmatter).toBeDefined();
    expect(result.frontmatter?.title).toBe('Test Post');
    expect(result.frontmatter?.author).toBe('John Doe');
    expect(result.frontmatter?.tags).toEqual(['mdx', 'test']);
    expect(result.frontmatterFormat).toBe('yaml');
  });

  it('should parse TOML frontmatter', async () => {
    const mdx = `+++
title = "Test Post"
author = "John Doe"
+++

# Content
    `.trim();

    const result = await compile(mdx);
    expect(result.frontmatter).toBeDefined();
    expect(result.frontmatter?.title).toBe('Test Post');
    expect(result.frontmatter?.author).toBe('John Doe');
    expect(result.frontmatterFormat).toBe('toml');
  });

  it('should handle MDX without frontmatter', async () => {
    const result = await compile('# Just content');
    expect(result.frontmatter).toBeUndefined();
    expect(result.frontmatterFormat).toBeUndefined();
  });

  it('should handle complex frontmatter', async () => {
    const mdx = `---
title: Complex Post
metadata:
  author: Jane Doe
  date: 2025-01-01
  tags:
    - tag1
    - tag2
published: true
---

# Content
    `.trim();

    const result = await compile(mdx);
    expect(result.frontmatter).toBeDefined();
    expect(result.frontmatter?.title).toBe('Complex Post');
    expect(result.frontmatter?.metadata).toHaveProperty('author');
    expect(result.frontmatter?.published).toBe(true);
  });
});

describe('compile() - metadata extraction', () => {
  it('should extract images when default plugins enabled', async () => {
    const mdx = `
# Post

![Alt text](./image.png)
![Another](https://example.com/image.jpg)
    `.trim();

    const result = await compile(mdx, { defaultPlugins: true });
    expect(result.images).toBeDefined();
    expect(result.images.length).toBeGreaterThan(0);
    expect(result.images).toContain('./image.png');
    expect(result.images).toContain('https://example.com/image.jpg');
  });

  it('should extract named exports', async () => {
    const mdx = `
export const meta = { title: 'Test' };

# Content
    `.trim();

    const result = await compile(mdx);
    expect(result.namedExports).toBeDefined();
    expect(result.namedExports.length).toBeGreaterThan(0);
    // The export statement itself is collected
    expect(result.namedExports[0]).toContain('meta');
  });

  it('should extract imports', async () => {
    const mdx = `
import { Component } from './component';

# Content
    `.trim();

    const result = await compile(mdx);
    expect(result.imports).toBeDefined();
    expect(result.imports.length).toBeGreaterThan(0);
  });

  it('should handle MDX without imports/exports', async () => {
    const result = await compile('# Simple content');
    expect(result.namedExports).toEqual([]);
    expect(result.imports).toEqual([]);
    expect(result.reexports).toEqual([]);
  });
});

describe('compile() - error handling', () => {
  it('should throw on invalid ESM syntax', async () => {
    await expect(
      compile('import { foo } fro "./bar"')
    ).rejects.toThrow();
  });

  it('should provide error details on compilation failure', async () => {
    try {
      await compile('import { x } fro "y"');
      expect.fail('Should have thrown an error');
    } catch (error) {
      const err = error as CompileError;
      expect(err.message).toBeTruthy();
      // Error should have some context
      expect(err).toHaveProperty('message');
    }
  });

  it('should handle very large input', async () => {
    const large = '# Title\n\n' + 'Lorem ipsum dolor sit amet. '.repeat(10000);
    const result = await compile(large);
    expect(result.code).toBeTruthy();
  });

  it('should handle special characters', async () => {
    const mdx = '# Title with emoji 🎉 and symbols &amp; "quotes"';
    const result = await compile(mdx);
    expect(result.code).toBeTruthy();
    expect(result.code).toContain('🎉');
  });
});

describe('compileSync()', () => {
  it('should compile synchronously after initialization', () => {
    const result = compileSync('# Hello World');
    expect(result.code).toBeTruthy();
    expect(result.code).toContain('Hello World');
  });

  it('should support all options like async version', () => {
    const result = compileSync('This is ~~strikethrough~~', { gfm: true });
    expect(result.code).toContain('del');
  });

  it('should handle frontmatter synchronously', () => {
    const mdx = `---
title: Sync Test
---

# Content
    `.trim();

    const result = compileSync(mdx);
    expect(result.frontmatter?.title).toBe('Sync Test');
  });

  it('should throw on errors synchronously', () => {
    expect(() => {
      compileSync('import { x } fro "y"');
    }).toThrow();
  });
});

describe('compile() - JSX components', () => {
  it('should handle JSX components in MDX', async () => {
    const mdx = `
# Title

<CustomComponent prop="value">
  Content
</CustomComponent>
    `.trim();

    const result = await compile(mdx);
    expect(result.code).toContain('CustomComponent');
    expect(result.code).toContain('prop');
  });

  it('should handle self-closing JSX', async () => {
    const mdx = '# Title\n\n<Button />';
    const result = await compile(mdx);
    expect(result.code).toContain('Button');
  });

  it('should handle JSX with expressions', async () => {
    const mdx = '<Component value={42} />';
    const result = await compile(mdx);
    expect(result.code).toBeTruthy();
  });
});

describe('compile() - combined features', () => {
  it('should handle all features together', async () => {
    const mdx = `---
title: Full Featured Post
author: Test Author
---

import { Button } from './components';

# {frontmatter.title}

This has **bold**, *italic*, and ~~strikethrough~~.

## Table

| Col 1 | Col 2 |
|-------|-------|
| A     | B     |

## Math

Inline: $E = mc^2$

Block:
$$
\\sum_{i=1}^n i = \\frac{n(n+1)}{2}
$$

## Footnotes

Text with footnote[^1]

[^1]: Footnote content

## Component

<Button>Click me</Button>

![Image](./test.png)
    `.trim();

    const result = await compile(mdx, {
      gfm: true,
      math: true,
      footnotes: true,
      defaultPlugins: true,
    });

    expect(result.code).toBeTruthy();
    expect(result.frontmatter?.title).toBe('Full Featured Post');
    expect(result.code).toContain('bold');
    expect(result.code).toContain('italic');
    expect(result.code).toContain('del'); // strikethrough
    expect(result.code).toContain('table');
    expect(result.code).toContain('math');
    expect(result.code).toContain('Button');
    expect(result.images.length).toBeGreaterThan(0);
  });
});

describe('compile() - edge cases', () => {
  it('should handle code blocks', async () => {
    const mdx = `
\`\`\`javascript
const x = 42;
\`\`\`
    `.trim();

    const result = await compile(mdx);
    expect(result.code).toBeTruthy();
  });

  it('should handle nested lists', async () => {
    const mdx = `
- Item 1
  - Nested 1
  - Nested 2
- Item 2
    `.trim();

    const result = await compile(mdx);
    expect(result.code).toBeTruthy();
  });

  it('should handle blockquotes', async () => {
    const mdx = '> This is a quote';
    const result = await compile(mdx);
    expect(result.code).toBeTruthy();
  });

  it('should handle horizontal rules', async () => {
    const mdx = `
Content above

---

Content below
    `.trim();

    const result = await compile(mdx);
    expect(result.code).toBeTruthy();
  });

  it('should handle inline code', async () => {
    const mdx = 'Use `const` for constants';
    const result = await compile(mdx);
    expect(result.code).toContain('const');
  });

  it('should handle links', async () => {
    const mdx = '[Link text](https://example.com)';
    const result = await compile(mdx);
    expect(result.code).toContain('example.com');
  });

  it('should handle images without alt text', async () => {
    const mdx = '![](./image.png)';
    const result = await compile(mdx, { defaultPlugins: true });
    expect(result.code).toBeTruthy();
  });
});
