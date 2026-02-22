import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),

    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID ?? '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
        }),
    ],

    // Custom pages
    pages: {
        signIn: '/login',
        error: '/login',
    },

    callbacks: {
        async session({ session, user }) {
            // When using database sessions, `user` is the DB record
            if (session.user) {
                (session.user as { id?: string; role?: string }).id = user.id;
                (session.user as { id?: string; role?: string }).role = (user as { role?: string }).role ?? 'student';
            }
            return session;
        },

        async signIn({ user }) {
            // Auto-create a free subscription for new users
            if (user?.id) {
                const existing = await prisma.subscription.findUnique({
                    where: { userId: user.id },
                });
                if (!existing) {
                    await prisma.subscription.create({
                        data: {
                            userId: user.id,
                            plan: 'free',
                            status: 'active',
                        },
                    });
                }
            }
            return true;
        },
    },

    session: {
        strategy: 'database',  // use DB-backed sessions (not JWT) with PrismaAdapter
    },

    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
