import { getSessionCookie } from 'better-auth/cookies';
import { NextRequest, NextResponse } from 'next/server';

import { isPlatformHost } from '@/lib/tenant/surface';

const PUBLIC_PREFIXES = [
  '/api/platform-auth',
  '/api/marketplace-auth',
  '/api/marketplace-auth-handoff',
];
const isPublic = (p: string) => PUBLIC_PREFIXES.some((x) => p.startsWith(x));

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Marketplace hosts (storefront, vendor panel) authenticate with the marketplace realm
  // (checked by the API), not the platform session, so they skip the dashboard login redirect.
  if (!isPlatformHost(request.headers.get('host'))) {
    // Dashboard pages never render on a marketplace host. Storefront and vendor-panel routes
    // get rewritten from here once they exist; until then only the API routes answer.
    return pathname.startsWith('/api/')
      ? NextResponse.next()
      : new NextResponse('Not found', { status: 404 });
  }

  const isAuthRoute = ['/login', '/signup'].some((route) =>
    pathname.startsWith(route),
  );
  if (isAuthRoute) {
    return NextResponse.next();
  }

  // ponytail: cookie presence only (cheap, edge-safe). The API validates the session on every
  // call, so a stale cookie gets a 401 there rather than silent access.
  if (!getSessionCookie(request, { cookiePrefix: 'cloviana-platform' })) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)',
  ],
};
