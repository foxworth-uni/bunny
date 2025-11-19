import { promises as fs } from 'fs';
import path from 'path';
import { serialize } from 'bunny-next-wasm';

const postsDirectory = path.join(process.cwd(), 'app/blog/posts');

interface PostFrontmatter {
  title: string;
  description?: string;
  date: string;
  author: string;
  tags?: string[];
}

export interface Post {
  slug: string;
  content: string;
  frontmatter: PostFrontmatter;
}

export async function getAllPosts(): Promise<Post[]> {
  try {
    const fileNames = await fs.readdir(postsDirectory);
    const mdxFiles = fileNames.filter((name) => name.endsWith('.mdx'));
    const posts = await Promise.all(mdxFiles.map(async (fileName) => {
      const slug = fileName.replace(/\.mdx$/, '');
      const post = await getPostBySlug(slug);
      return post!;
    }));
    return posts.sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
  } catch (error) {
    console.error('Error reading posts:', error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const filePath = path.join(postsDirectory, `${slug}.mdx`);
    const content = await fs.readFile(filePath, 'utf8');
    const result = await serialize<{}, PostFrontmatter>(content, { parseFrontmatter: true });
    return {
      slug,
      content,
      frontmatter: result.frontmatter || { title: slug, date: new Date().toISOString(), author: 'Unknown' },
    };
  } catch (error) {
    console.error(`Error reading post ${slug}:`, error);
    return null;
  }
}
