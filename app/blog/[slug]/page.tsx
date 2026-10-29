import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import FrontendLayout from '@/components/layout/FrontendLayout';
import { getBlogBySlug, getAllBlogs } from '@/lib/data/blogs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface BlogSingleProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogSingleProps) {
  const resolvedParams = await params;
  const blog = await getBlogBySlug(resolvedParams.slug);

  if (!blog) {
    return {
      title: 'Article Not Found - QwikConnect',
    };
  }

  return {
    title: `${blog.title} - QwikConnect Blog`,
    description: blog.excerpt || blog.title,
  };
}

export default async function BlogSinglePage({ params }: BlogSingleProps) {
  const resolvedParams = await params;
  const blog = await getBlogBySlug(resolvedParams.slug);

  if (!blog) {
    notFound();
  }

  const allBlogs = await getAllBlogs();
  const relatedBlogs = allBlogs
    .filter((b) => b.id !== blog.id)
    .slice(0, 3);

  return (
    <FrontendLayout>
      {/* Banner / Breadcrumb */}
      <div className="banner-inner-area section-bg-2 padding-top-50 padding-bottom-50" style={{ backgroundColor: '#f1f5f9' }}>
        <div className="container container-two">
          <div className="row">
            <div className="col-12">
              <div className="banner-inner-contents">
                <h2 className="banner-inner-title" style={{ fontSize: '28px', fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
                  {blog.title}
                </h2>
                <ul className="inner-menu" style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0, marginTop: '10px', fontSize: '14px', color: '#64748b' }}>
                  <li><Link href="/" style={{ color: 'var(--main-color-one)' }}>Home</Link></li>
                  <li>/</li>
                  <li><Link href="/blog" style={{ color: 'var(--main-color-one)' }}>Blog</Link></li>
                  <li>/</li>
                  <li style={{ color: '#1e293b' }}>Article</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Blog Details Area */}
      <section className="blog-details-area padding-top-70 padding-bottom-90">
        <div className="container container-two">
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <div className="blog-details-wrapper">
                {/* Featured Image */}
                <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
                  <img
                    src={blog.image}
                    alt={blog.title}
                    style={{ width: '100%', maxHeight: '460px', objectFit: 'cover', display: 'block' }}
                  />
                </div>

                {/* Meta details */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px', gap: '15px' }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', fontSize: '14px', color: '#64748b' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="las la-user" style={{ color: 'var(--main-color-one)', fontSize: '18px' }}></i>
                      <span>By {blog.author === 's-admin@gmail.com' ? 'Admin' : (blog.author || 'Admin')}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="las la-calendar" style={{ color: 'var(--main-color-one)', fontSize: '18px' }}></i>
                      <span>{blog.created_at}</span>
                    </span>
                  </div>

                  <span
                    style={{
                      backgroundColor: 'rgba(56, 189, 248, 0.1)',
                      color: 'var(--main-color-one)',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {blog.category}
                  </span>
                </div>

                {/* Excerpt Blockquote */}
                {blog.excerpt && (
                  <div
                    style={{
                      borderLeft: '4px solid var(--main-color-one)',
                      backgroundColor: '#f8fafc',
                      padding: '24px 30px',
                      borderRadius: '0 12px 12px 0',
                      marginBottom: '35px',
                    }}
                  >
                    <p style={{ margin: 0, fontStyle: 'italic', fontSize: '17px', color: '#334155', lineHeight: '1.6' }}>
                      "{blog.excerpt}"
                    </p>
                  </div>
                )}

                {/* Full Article Content */}
                <div
                  className="blog-content-area"
                  style={{ fontSize: '16px', lineHeight: '1.8', color: '#334155' }}
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />

                {/* Share Links */}
                <div
                  style={{
                    borderTop: '1px solid #e2e8f0',
                    borderBottom: '1px solid #e2e8f0',
                    padding: '20px 0',
                    marginTop: '50px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '15px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '15px' }}>Share This Story:</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <a
                        href="https://www.facebook.com"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#3b5998',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          textDecoration: 'none',
                        }}
                      >
                        <i className="lab la-facebook-f"></i>
                      </a>
                      <a
                        href="https://twitter.com"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#1da1f2',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          textDecoration: 'none',
                        }}
                      >
                        <i className="lab la-twitter"></i>
                      </a>
                      <a
                        href="https://www.linkedin.com"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: '#0077b5',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          textDecoration: 'none',
                        }}
                      >
                        <i className="lab la-linkedin-in"></i>
                      </a>
                    </div>
                  </div>

                  <Link href="/blog" className="cmn-btn btn-outline-1" style={{ padding: '8px 20px', borderRadius: '5px', fontSize: '14px' }}>
                    &larr; Back to All Blogs
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Related Articles Area */}
          {relatedBlogs.length > 0 && (
            <div style={{ marginTop: '80px', paddingTop: '50px', borderTop: '1px solid #e2e8f0' }}>
              <div className="row mb-4">
                <div className="col-12 text-center">
                  <h3 style={{ fontSize: '26px', fontWeight: 700, color: '#1e293b' }}>
                    Related Articles & Guides
                  </h3>
                </div>
              </div>

              <div className="row g-4">
                {relatedBlogs.map((rBlog) => (
                  <div key={rBlog.id} className="col-lg-4 col-md-6">
                    <div
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div style={{ height: '180px', overflow: 'hidden' }}>
                        <Link href={`/blog/${encodeURIComponent(rBlog.slug)}`}>
                          <img
                            src={rBlog.image}
                            alt={rBlog.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </Link>
                      </div>
                      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ color: 'var(--main-color-one)', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                          {rBlog.category}
                        </span>
                        <h6 style={{ fontSize: '16px', fontWeight: 700, lineHeight: '1.4', marginBottom: '10px' }}>
                          <Link href={`/blog/${encodeURIComponent(rBlog.slug)}`} style={{ color: '#1e293b', textDecoration: 'none' }}>
                            {rBlog.title}
                          </Link>
                        </h6>
                        <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                          <Link href={`/blog/${encodeURIComponent(rBlog.slug)}`} style={{ color: 'var(--main-color-one)', fontSize: '13px', fontWeight: 600 }}>
                            Read More &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </FrontendLayout>
  );
}
