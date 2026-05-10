import { NextAuthOptions } from 'next-auth';
import { cookies } from 'next/headers';
import GoogleProvider from 'next-auth/providers/google';

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
            id: 'quick-access',
            name: 'Quick Access',
            credentials: {
                firstName: { label: 'First Name', type: 'text' },
                lastName: { label: 'Last Name', type: 'text' },
                university: { label: 'University', type: 'text' },
            },
            async authorize(credentials) {
                if (!credentials?.firstName || !credentials?.lastName || !credentials?.university) return null;

                const fullName = `${credentials.firstName.trim()} ${credentials.lastName.trim()}`;
                const university = credentials.university.trim();
                
                // Create a deterministic email based on name and university to find the same user later
                const slugName = fullName.toLowerCase().replace(/\s+/g, '.');
                const slugUni = university.toLowerCase().replace(/\s+/g, '.');
                const stableEmail = `${slugName}.${slugUni}@direct.edunation.uz`;

                // 1. Try to find existing user first
                let user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: stableEmail },
                            {
                                AND: [
                                    { name: fullName },
                                    { university: university }
                                ]
                            }
                        ]
                    }
                });

                let isNewUser = false;

                // 2. If not found, create a new one
                if (!user) {
                    isNewUser = true;
                    user = await prisma.user.create({
                        data: {
                            name: fullName,
                            email: stableEmail,
                            university: university,
                            role: 'student',
                        }
                    });
                } else {
                    // Update to uppercase if previously lowercase
                    if (user.name !== fullName || user.university !== university) {
                        user = await prisma.user.update({
                            where: { id: user.id },
                            data: { name: fullName, university: university }
                        });
                    }
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isNewAccount: isNewUser,
                };
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
                token.sub = user.id;
                token.email = user.email;
                token.role = (user as any).role;
            }
            const adminEmail = process.env.ADMIN_EMAIL;
            if (adminEmail && token.email === adminEmail) {
                token.role = 'admin';
            } else if (token.id || token.sub) {
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
                    (session.user as any).id = (token.id ?? token.sub) as string;
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
            let displayName = user.name ?? '—';
            
            if (provider === 'quick-access') {
                const isNew = (user as any).isNewAccount;
                if (isNew) {
                    displayName += ' (YANGI TALABA 🌟)';
                } else {
                    displayName += ' (Qayta kirdi 🔄)';
                }
            }
            
            notifySignIn({ name: displayName, email: user.email ?? null, provider });
        },
    },

    session: {
        strategy: 'jwt',
        maxAge: 4 * 60 * 60, // 4 hours
    },

    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === 'development',
};
