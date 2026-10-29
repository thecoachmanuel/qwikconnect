import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'OScbwvMKfIsShLSGqiTvSvXIHixsCCHo';

  const isSecure =
    request.nextUrl.protocol === 'https:' ||
    request.headers.get('x-forwarded-proto') === 'https';

  // Resilient token retrieval for Vercel deployment (supports both secure HTTPS and HTTP proxy cookies)
  let token = await getToken({
    req: request,
    secret,
    secureCookie: isSecure,
  });

  if (!token) {
    token = await getToken({
      req: request,
      secret,
      secureCookie: !isSecure,
    });
  }

  if (!token) {
    token = await getToken({
      req: request,
      secret,
      cookieName: isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token',
    });
  }

  // Guard for logged-in users visiting login & register pages
  if (
    pathname === '/user/login' ||
    pathname === '/user/register' ||
    pathname === '/seller/register'
  ) {
    if (token) {
      if (token.guard === 'admin' || token.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      if (token.user_type === 2 || token.user_type === 0 || token.role === 'seller') {
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

    if (token.user_type !== 2 && token.user_type !== 0 && token.role !== 'seller') {
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

    if (token.user_type !== 1 && token.role !== 'buyer') {
      // Seller trying to access buyer routes
      return NextResponse.redirect(new URL('/seller/dashboard', request.url));
    }
  }

  // Guard for /admin routes (except login pages)
  if (pathname.startsWith('/admin') && pathname !== '/admin' && pathname !== '/admin/login') {
    if (!token || (token.guard !== 'admin' && token.role !== 'admin')) {
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
