import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import AuthProvider from '@/components/AuthProvider';
import ConditionalLayout from '@/components/ConditionalLayout';

export const metadata: Metadata = {
  title: 'EduNationUz – Learn Without Limits',
  description: 'EduNationUz is a premium educational platform offering world-class video courses in tech, design, business, and more. Start free, upgrade anytime.',
  keywords: 'online learning, video courses, education, programming, design, EduNationUz',
  openGraph: {
    title: 'EduNationUz – Learn Without Limits',
    description: 'Premium online courses with video lessons. Free & Subscription plans available.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LanguageProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
