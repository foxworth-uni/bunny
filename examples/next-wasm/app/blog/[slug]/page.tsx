import { notFound } from 'next/navigation';
import { serialize } from 'bunny-next-wasm';
import { MDXRemote } from 'bunny-next-wasm/client';
import { getAllPosts, getPostBySlug } from '@/lib/posts';
import { mdxComponents } from '@/components/mdx';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: 'Post Not Found' };
  return {
    title: `${post.frontmatter.title} - bunny-next Blog`,
    description: post.frontmatter.description,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const mdxSource = await serialize(post.content, {
    mdxOptions: { gfm: true, footnotes: true },
  });

  return (
    <article>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{post.frontmatter.title}</h1>
        <div style={{ color: '#666', fontSize: '0.95rem' }}>
          <time>{post.frontmatter.date}</time> · <span>{post.frontmatter.author}</span>
        </div>
      </header>

      <div className="mdx-content">
        <MDXRemote {...mdxSource} components={mdxComponents} />
      </div>
    </article>
  );
}
