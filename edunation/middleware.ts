import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const role = token?.role as string;
        const isAuthorized = role === 'admin' || role === 'instructor';
        const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
        const isUsersRoute = req.nextUrl.pathname.startsWith('/admin/users');

        if (isAdminRoute && !isAuthorized) {
            return NextResponse.redirect(new URL('/?error=unauthorized', req.url));
        }

        // Only admins can access the users management page
        if (isUsersRoute && role !== 'admin') {
            return NextResponse.redirect(new URL('/admin?error=unauthorized', req.url));
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
    matcher: ['/admin/:path*'],
};
