import React from 'react';
import Link from 'next/link';
import FrontendLayout from '@/components/layout/FrontendLayout';
import { getAllBlogs } from '@/lib/data/blogs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Blog & Articles - QwikConnect Marketplace',
  description: 'Read the latest tips, guides, and news on home improvement, cleaning, tech repair, and professional services from QwikConnect experts.',
};

interface BlogPageProps {
  searchParams: Promise<{
    category?: string;
    q?: string;
  }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const resolvedParams = await searchParams;
  const currentCategory = resolvedParams.category || '';
  const searchQuery = resolvedParams.q || '';

  const allBlogs = await getAllBlogs();

  const dynamicCategories = Array.from(
    new Set(allBlogs.filter((b) => b.status !== 'draft' && b.category).map((b) => b.category))
  );

  const categories = [
    'All',
    ...dynamicCategories,
  ];

  const filteredBlogs = allBlogs.filter((blog) => {
    if (blog.status === 'draft') return false;
    if (currentCategory && currentCategory !== 'All' && blog.category?.toLowerCase() !== currentCategory.toLowerCase()) {
      return false;
    }
    if (searchQuery) {
      const matchTitle = (blog.title || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchExcerpt = (blog.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchTitle && !matchExcerpt) return false;
    }
    return true;
  });

  return (
    <FrontendLayout>
      {/* Banner / Breadcrumb */}
      <div className="banner-inner-area section-bg-2 padding-top-50 padding-bottom-50" style={{ backgroundColor: '#f1f5f9' }}>
        <div className="container container-two">
          <div className="row">
            <div className="col-12">
              <div className="banner-inner-contents">
                <h2 className="banner-inner-title" style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>
                  Latest News & Articles
                </h2>
                <ul className="inner-menu" style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0, marginTop: '10px', fontSize: '14px', color: '#64748b' }}>
                  <li><Link href="/" style={{ color: 'var(--main-color-one)' }}>Home</Link></li>
                  <li>/</li>
                  <li>Blogs</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Blog Area */}
      <section className="blog-area padding-top-70 padding-bottom-100">
        <div className="container container-two">
          {/* Filter Bar */}
          <div className="row align-items-center mb-5 pb-3" style={{ borderBottom: '1px solid #e2e8f0' }}>
            <div className="col-lg-8 mb-3 mb-lg-0">
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {categories.map((cat) => {
                  const isActive = (!currentCategory && cat === 'All') || currentCategory === cat;
                  return (
                    <Link
                      key={cat}
                      href={cat === 'All' ? '/blog' : `/blog?category=${encodeURIComponent(cat)}`}
                      style={{
                        padding: '8px 18px',
                        borderRadius: '25px',
                        fontSize: '14px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        transition: 'all 0.2s ease',
                        backgroundColor: isActive ? 'var(--main-color-one)' : '#f1f5f9',
                        color: isActive ? '#ffffff' : '#475569',
                      }}
                    >
                      {cat}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="col-lg-4">
              <form method="GET" action="/blog" style={{ display: 'flex' }}>
                <input
                  type="text"
                  name="q"
                  defaultValue={searchQuery}
                  placeholder="Search articles..."
                  style={{
                    padding: '10px 16px',
                    borderRadius: '8px 0 0 8px',
                    border: '1px solid #cbd5e1',
                    borderRight: 'none',
                    fontSize: '14px',
                    width: '100%',
                    outline: 'none',
                    backgroundColor: '#fff',
                    color: '#1e293b',
                  }}
                />
                <button
                  type="submit"
                  className="cmn-btn btn-bg-1"
                  style={{
                    borderRadius: '0 8px 8px 0',
                    padding: '0 20px',
                    border: 'none',
                    color: '#fff',
                  }}
                >
                  <i className="las la-search"></i>
                </button>
              </form>
            </div>
          </div>

          {/* Blog Cards Grid */}
          {filteredBlogs.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '48px', color: '#94a3b8', marginBottom: '15px' }}>
                <i className="las la-inbox"></i>
              </div>
              <h4 style={{ color: '#334155', fontWeight: 600 }}>No articles found</h4>
              <p style={{ color: '#64748b' }}>Try adjusting your search criteria or category filter.</p>
              <Link href="/blog" className="cmn-btn btn-outline-1 mt-3" style={{ padding: '8px 20px', borderRadius: '5px' }}>
                Reset Filters
              </Link>
            </div>
          ) : (
            <div className="row g-4">
              {filteredBlogs.map((blog) => (
                <div key={blog.id} className="col-lg-4 col-md-6">
                  <div
                    className="single-blog"
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 5px 20px rgba(0,0,0,0.05)',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    {/* Blog Thumbnail */}
                    <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                      <Link href={`/blog/${encodeURIComponent(blog.slug)}`}>
                        <img
                          src={blog.image}
                          alt={blog.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease',
                          }}
                        />
                      </Link>
                      <span
                        style={{
                          position: 'absolute',
                          top: '15px',
                          left: '15px',
                          backgroundColor: 'var(--main-color-one)',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                          padding: '4px 10px',
                          borderRadius: '4px',
                        }}
                      >
                        {blog.category}
                      </span>
                    </div>

                    {/* Blog Content */}
                    <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <ul
                        style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: '0 0 12px 0',
                          display: 'flex',
                          gap: '15px',
                          fontSize: '13px',
                          color: '#94a3b8',
                        }}
                      >
                        <li style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <i className="las la-calendar"></i>
                          <span>{blog.created_at}</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <i className="las la-user"></i>
                          <span>{blog.author === 's-admin@gmail.com' ? 'Admin' : (blog.author || 'Admin')}</span>
                        </li>
                      </ul>

                      <h5 style={{ fontSize: '18px', fontWeight: 700, lineHeight: '1.4', marginBottom: '12px' }}>
                        <Link
                          href={`/blog/${encodeURIComponent(blog.slug)}`}
                          className="blog-card-title-link"
                        >
                          {blog.title}
                        </Link>
                      </h5>

                      <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px', flex: 1 }}>
                        {blog.excerpt.length > 110 ? `${blog.excerpt.substring(0, 110)}...` : blog.excerpt}
                      </p>

                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                        <Link
                          href={`/blog/${encodeURIComponent(blog.slug)}`}
                          style={{
                            color: 'var(--main-color-one)',
                            fontWeight: 600,
                            fontSize: '14px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            textDecoration: 'none',
                          }}
                        >
                          <span>Read Full Story</span>
                          <i className="las la-arrow-right"></i>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </FrontendLayout>
  );
}
