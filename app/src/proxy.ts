import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PREFIXES = ['/api/auth', '/api/webhooks'];
const isPublic = (p: string) => PUBLIC_PREFIXES.some((x) => p.startsWith(x));

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const isAuthRoute = ['/login', '/signup'].some((route) =>
    pathname.startsWith(route),
  );
  if (isAuthRoute) {
    // ponytail: auth pages must render even when Supabase auth is slow.
    return NextResponse.next();
  }

  // Prepare the response we’ll mutate with cookies
  let res = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (pairs: any[]) => {
          pairs.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          res = NextResponse.next({ request });
          pairs.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();

  const isAuthenticated = Boolean(data?.claims.sub);

  if (!isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)',
  ],
};
