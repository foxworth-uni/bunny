import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';
import { BlogCard } from '@/components/BlogCard';

export const metadata = {
  title: 'Blog - bunny-next Example',
  description: 'Dynamic blog with MDX and frontmatter',
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div>
      <header style={{ marginBottom: '3rem' }}>
        <h1>Blog</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>A dynamic blog powered by bunny-next</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        {posts.map((post) => (<BlogCard key={post.slug} {...post} />))}
      </div>
    </div>
  );
}
