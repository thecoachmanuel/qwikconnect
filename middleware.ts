import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Guard for logged-in users visiting login & register pages
  if (
    pathname === '/user/login' ||
    pathname === '/user/register' ||
    pathname === '/seller/register'
  ) {
    if (token) {
      if (token.guard === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      if (token.user_type === 2 || token.user_type === 0) {
        return NextResponse.redirect(new URL('/seller/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/buyer/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Guard for /seller routes
  if (pathname.startsWith('/seller')) {
    if (pathname === '/seller/register') {
      return NextResponse.next();
    }
    if (!token) {
      const loginUrl = new URL('/user/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (token.user_type !== 2 && token.user_type !== 0) {
      // Buyer trying to access seller routes
      return NextResponse.redirect(new URL('/buyer/dashboard', request.url));
    }
  }

  // Guard for /buyer routes
  if (pathname.startsWith('/buyer')) {
    if (!token) {
      const loginUrl = new URL('/user/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (token.user_type !== 1) {
      // Seller trying to access buyer routes
      return NextResponse.redirect(new URL('/seller/dashboard', request.url));
    }
  }

  // Guard for /admin routes (except login pages)
  if (pathname.startsWith('/admin') && pathname !== '/admin' && pathname !== '/admin/login') {
    if (!token || token.guard !== 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/seller/:path*',
    '/buyer/:path*',
    '/admin/:path*',
    '/user/login',
    '/user/register',
  ],
};
