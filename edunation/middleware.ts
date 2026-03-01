import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const role = token?.role as string;
        const isAuthorized = role === 'admin' || role === 'instructor';
        const isProtectedDashboard = req.nextUrl.pathname.startsWith('/admin') ||
            req.nextUrl.pathname.startsWith('/instructor/courses') ||
            req.nextUrl.pathname.startsWith('/instructor/dashboard');
        const isUsersRoute = req.nextUrl.pathname.startsWith('/admin/users');

        if (isProtectedDashboard && !isAuthorized) {
            return NextResponse.redirect(new URL('/?error=unauthorized', req.url));
        }

        // Only admins can access the users management page
        if (isUsersRoute && role !== 'admin') {
            return NextResponse.redirect(new URL('/instructor/courses?error=unauthorized', req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ['/admin/:path*', '/instructor/courses/:path*', '/instructor/dashboard/:path*'],
};
