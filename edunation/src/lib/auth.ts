import { NextAuthOptions } from 'next-auth';
import { cookies } from 'next/headers';
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
            allowDangerousEmailAccountLinking: true,
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID ?? '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
            allowDangerousEmailAccountLinking: true,
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
                    currentStreak: user.currentStreak,
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

                    const secret = process.env.NEXTAUTH_SECRET ?? 'fallback';
                    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
                    if (expected !== sig) return null;

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

                    const secret = process.env.NEXTAUTH_SECRET ?? 'fallback';
                    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
                    if (expected !== sig) return null;

                    if (Date.now() > parseInt(expiryStr, 10)) return null;

                    const user = await prisma.user.findUnique({ where: { id: userId } });
                    if (!user || user.phone !== phone) return null;

                    return { id: user.id, name: user.name, email: user.email, image: user.image, role: user.role };
                } catch {
                    return null;
                }
            },
        }),
        CredentialsProvider({
            id: 'dev-id',
            name: 'ID Login',
            credentials: {
                name: { label: 'Full Name', type: 'text' },
                idCode: { label: 'Student ID', type: 'text' },
                role: { label: 'Role', type: 'text' },
            },
            async authorize(credentials) {
                console.log('--- Dev Auth Attempt ---');
                console.log('Credentials received:', credentials);

                if (!credentials?.name || !credentials?.idCode || !credentials?.role) {
                    console.log('Missing credentials fields');
                    return null;
                }
                
                // Student ID validation: 6 digits starting with 250
                if (credentials.role === 'student' && !/^250\d{3}$/.test(credentials.idCode)) {
                    console.log('Validation failed: Student ID format');
                    throw new Error('Student ID must be 6 digits and start with 250.');
                }

                try {
                    console.log('Searching for user with Student ID:', credentials.idCode);
                    const email = `${credentials.idCode}@dev.edunation.uz`;
                    
                    // Use upsert to be safe
                    const user = await prisma.user.upsert({
                        where: { studentId: credentials.idCode },
                        update: {
                            name: credentials.name,
                            role: credentials.role,
                        },
                        create: {
                            name: credentials.name,
                            studentId: credentials.idCode,
                            role: credentials.role,
                            email: email,
                        },
                    });

                    console.log('User synced:', user.id);
                    
                    // Ensure subscription exists
                    await prisma.subscription.upsert({
                        where: { userId: user.id },
                        update: {},
                        create: { userId: user.id, plan: 'free', status: 'active' },
                    });

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    };
                } catch (err: any) {
                    console.error('Final Auth Error:', err);
                    throw new Error(`Auth Error: ${err.message || 'Database sync failed'}`);
                }
            },
        }),
    ],

    pages: {
        signIn: '/login',
        error: '/login',
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.role = (user as any).role;
                console.log('JWT Init - User:', user.id, 'Role:', token.role);
            }
            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail && token.email === adminEmail) {
                token.role = 'admin';
            } else if ((token.id || token.sub) && !token.role) { // Only fetch if role is missing
                const userId = (token.id ?? token.sub) as string;
                const dbUser = await prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        name: true,
                        image: true,
                        role: true,
                        points: true,
                        isExpert: true,
                        currentStreak: true
                    },
                });
                if (dbUser) {
                    token.name = dbUser.name;
                    token.picture = dbUser.image;
                    token.role = dbUser.role ?? 'student';
                    token.points = dbUser.points ?? 0;
                    token.currentStreak = dbUser.currentStreak ?? 0;
                    token.isExpert = dbUser.isExpert ?? false;
                }
            }
            return token;
        },

        async session({ session, token, user }) {
            if (session.user) {
                if (token) {
                    (session.user as any).id = token.sub;
                    (session.user as any).name = token.name;
                    (session.user as any).image = token.picture;
                    (session.user as any).role = token.role as string;
                    (session.user as any).points = token.points as number;
                    (session.user as any).currentStreak = token.currentStreak as number;
                    (session.user as any).isExpert = token.isExpert as boolean;
                } else if (user) {
                    (session.user as any).id = user.id;
                    (session.user as any).role = (user as any).role ?? 'student';
                    (session.user as any).points = (user as any).points ?? 0;
                    (session.user as any).currentStreak = (user as any).currentStreak ?? 0;
                    (session.user as any).isExpert = (user as any).isExpert ?? false;
                }
            }
            return session;
        },

        async signIn() {
            return true;
        },
    },

    events: {
        async createUser({ user }) {
            const cookieStore = await cookies();
            const roleCookie = cookieStore.get('edu_role')?.value;
            const finalRole = (roleCookie === 'instructor' ? 'instructor' : 'student');

            await prisma.user.update({
                where: { id: user.id },
                data: { role: finalRole }
            });

            const existing = await prisma.subscription.findUnique({ where: { userId: user.id } });
            if (!existing) {
                await prisma.subscription.create({
                    data: { userId: user.id, plan: 'free', status: 'active' },
                });
            }

            const account = await prisma.account.findFirst({ where: { userId: user.id } });
            const provider = (account?.provider ?? 'email') as 'google' | 'github' | 'telegram' | 'email';
            notifyNewUser({ name: user.name ?? null, email: user.email ?? null, role: finalRole, provider });
        },

        async signIn({ user, account }) {
            const provider = account?.provider ?? 'credentials';
            notifySignIn({ name: user.name ?? null, email: user.email ?? null, provider });
        },
    },

    session: {
        strategy: 'jwt',
        maxAge: 4 * 60 * 60, // 4 hours
    },

    secret: process.env.NEXTAUTH_SECRET,
    debug: true, // Force debug on to see more Vercel logs
};
