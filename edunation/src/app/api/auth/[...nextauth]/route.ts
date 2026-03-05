import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { notifyNewUser, notifySignIn } from '@/lib/telegram';

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
        CredentialsProvider({
            name: 'Email',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.password) return null;

                const passwordMatch = await bcrypt.compare(credentials.password, user.password);
                if (!passwordMatch) return null;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    role: user.role,
                };
            },
        }),

        // ── Telegram Login Widget ──────────────────────────────────────
        CredentialsProvider({
            id: 'telegram',
            name: 'Telegram',
            credentials: { telegramToken: { label: 'Telegram Token', type: 'text' } },
            async authorize(credentials) {
                if (!credentials?.telegramToken) return null;

                try {
                    const [b64, sig] = credentials.telegramToken.split('.');
                    if (!b64 || !sig) return null;

                    const payload = Buffer.from(b64, 'base64url').toString();
                    const [userId, expiryStr] = payload.split(':');

                    // Verify signature
                    const secret = process.env.NEXTAUTH_SECRET ?? 'fallback';
                    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
                    if (expected !== sig) return null;

                    // Check expiry
                    if (Date.now() > parseInt(expiryStr, 10)) return null;

                    const user = await prisma.user.findUnique({ where: { id: userId } });
                    if (!user) return null;

                    return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role };
                } catch {
                    return null;
                }
            },
        }),
        CredentialsProvider({
            id: 'phone',
            name: 'Phone',
            credentials: {
                phoneToken: { label: 'Phone Token', type: 'text' },
            },
            async authorize(credentials) {
                if (!credentials?.phoneToken) return null;

                try {
                    const [b64, sig] = credentials.phoneToken.split('.');
                    if (!b64 || !sig) return null;

                    const payload = Buffer.from(b64, 'base64url').toString();
                    const [userId, expiryStr, phone] = payload.split(':');

                    // Verify signature
                    const secret = process.env.NEXTAUTH_SECRET ?? 'fallback';
                    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
                    if (expected !== sig) return null;

                    // Check expiry
                    if (Date.now() > parseInt(expiryStr, 10)) return null;

                    const user = await prisma.user.findUnique({ where: { id: userId } });
                    if (!user || user.phone !== phone) return null;

                    return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role };
                } catch {
                    return null;
                }
            },
        }),
    ],

    // Custom pages
    pages: {
        signIn: '/login',
        error: '/login',
    },

    callbacks: {
        async jwt({ token, user }) {
            // On initial sign-in, store user id
            if (user) {
                token.id = user.id;
                token.email = user.email;
            }
            // Auto-grant admin to the owner email set in .env.local
            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail && token.email === adminEmail) {
                token.role = 'admin';
            } else if (token.id || token.sub) {
                // Fetch latest role from DB for all other users
                const userId = (token.id ?? token.sub) as string;
                const dbUser = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { role: true, points: true, isExpert: true },
                });
                token.role = dbUser?.role ?? 'student';
                token.points = dbUser?.points ?? 0;
                token.isExpert = dbUser?.isExpert ?? false;
            }
            return token;
        },

        async session({ session, token, user }) {
            if (session.user) {
                if (token) {
                    (session.user as any).id = token.sub;
                    (session.user as any).role = token.role as string;
                    (session.user as any).points = token.points as number;
                    (session.user as any).isExpert = token.isExpert as boolean;
                } else if (user) {
                    (session.user as any).id = user.id;
                    (session.user as any).role = (user as any).role ?? 'student';
                    (session.user as any).points = (user as any).points ?? 0;
                    (session.user as any).isExpert = (user as any).isExpert ?? false;
                }
            }
            return session;
        },

        async signIn() {
            return true;
        },
    },

    // Fires AFTER the user is fully committed to the DB (OAuth only)
    events: {
        async createUser({ user }) {
            // Only create subscription for OAuth users (credentials users get it via register API)
            const existing = await prisma.subscription.findUnique({ where: { userId: user.id } });
            if (!existing) {
                await prisma.subscription.create({
                    data: { userId: user.id, plan: 'free', status: 'active' },
                });
            }

            // 🔔 Detect provider from Account table (created just before this event)
            const account = await prisma.account.findFirst({ where: { userId: user.id } });
            const provider = (account?.provider ?? 'email') as 'google' | 'github' | 'telegram' | 'email';
            notifyNewUser({ name: user.name ?? null, email: user.email ?? null, role: (user as any).role ?? 'student', provider });
        },

        async signIn({ user, account }) {
            // Fires on every successful sign-in (not just first time)
            const provider = account?.provider ?? 'credentials';
            notifySignIn({ name: user.name ?? null, email: user.email ?? null, provider });
        },
    },

    session: {
        strategy: 'jwt',   // switch to JWT so CredentialsProvider works with PrismaAdapter
    },

    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
