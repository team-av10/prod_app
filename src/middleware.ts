import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth');
  const { pathname } = request.nextUrl;

  // If the user is not authenticated and trying to access a protected route
  if (!authCookie && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // If the user is authenticated and trying to access auth pages
  if (authCookie && (pathname === '/auth' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth', '/signup'],
}; 