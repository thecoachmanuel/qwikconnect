import { getBlogs, getBlogBySlug as fetchMongoBlogBySlug, MongoBlog } from '@/lib/mongodb';

export interface BlogItem {
  id: number;
  title: string;
  slug: string;
  category: string;
  category_id?: string;
  image: string;
  author: string;
  excerpt: string;
  content: string;
  status?: string;
  tags?: string[];
  views?: number;
  created_at: string;
}

export async function getAllBlogs(): Promise<BlogItem[]> {
  const blogs = await getBlogs();
  return blogs as BlogItem[];
}

export async function getBlogBySlug(slug: string): Promise<BlogItem | null> {
  const blog = await fetchMongoBlogBySlug(slug);
  return blog as BlogItem | null;
}

