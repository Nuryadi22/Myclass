import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-myclass-monitoring-app-2026'
);

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as {
      userId: number;
      name: string;
      username: string;
      role: string;
      className?: string | null;
    };
  } catch (e) {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Skip proxy for internal Next.js requests, public uploads, static assets, and api
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const session = token ? await verifyToken(token) : null;

  // Guest page - Login
  if (pathname === '/') {
    if (session) {
      if (session.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else if (session.role === 'teacher') {
        return NextResponse.redirect(new URL('/teacher/dashboard', request.url));
      } else {
        return NextResponse.redirect(new URL('/parent/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // Protected pages
  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/teacher') ||
    pathname.startsWith('/parent') ||
    pathname.startsWith('/discussions');

  if (isProtected) {
    if (!session) {
      // Redirect to login page
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Role verification
    if (pathname.startsWith('/admin') && session.role !== 'admin') {
      return redirectDashboard(session.role, request);
    }
    if (pathname.startsWith('/teacher') && session.role !== 'teacher') {
      return redirectDashboard(session.role, request);
    }
    if (pathname.startsWith('/parent') && session.role !== 'parent') {
      return redirectDashboard(session.role, request);
    }
    if (pathname.startsWith('/discussions') && session.role === 'admin') {
      // Admin has no access to discussion board
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

function redirectDashboard(role: string, request: NextRequest) {
  if (role === 'admin') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  } else if (role === 'teacher') {
    return NextResponse.redirect(new URL('/teacher/dashboard', request.url));
  } else {
    return NextResponse.redirect(new URL('/parent/dashboard', request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
