import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  console.log('🔒 Middleware checking path:', path);

  // Check if the path starts with /superuser
  if (path.startsWith('/superuser')) {
    // Skip middleware for login page
    if (path === '/superuser/login') {
      // If already authenticated, redirect to dashboard
      const isSuperuser = request.cookies.get('is_superuser')?.value === 'true';
      const token = request.cookies.get('access_token')?.value;
      
      if (isSuperuser && token && path === '/superuser/login') {
        return NextResponse.redirect(new URL('/superuser', request.url));
      }
      return NextResponse.next();
    }

    console.log('🔒 Checking superuser authorization');
    
    // Check if user is authenticated as superuser from cookies
    const isSuperuser = request.cookies.get('is_superuser')?.value === 'true';
    const token = request.cookies.get('access_token')?.value;
    
    console.log('👤 Superuser cookie exists:', isSuperuser);
    console.log('👤 Token exists:', !!token);

    if (!isSuperuser || !token) {
      console.log('⛔ Not authenticated as superuser, redirecting to login');
      return NextResponse.redirect(new URL('/superuser/login', request.url));
    }
    
    console.log('✅ Superuser authenticated, proceeding');
  }

  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/superuser/:path*',
  ],
}; 