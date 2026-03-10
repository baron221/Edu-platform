import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import AuthProvider from '@/components/AuthProvider';
import ConditionalLayout from '@/components/ConditionalLayout';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://edunationuz.com'),
  title: {
    default: 'EduNationUz – Learn Without Limits',
    template: '%s | EduNationUz',
  },
  description: 'EduNationUz is a premium educational platform offering world-class video courses in tech, design, business, and more. Start free, upgrade anytime.',
  keywords: ['online learning', 'video courses', 'education', 'programming', 'design', 'EduNationUz', 'online ta\'lim', 'kurslar'],
  authors: [{ name: 'EduNationUz Team' }],
  openGraph: {
    title: 'EduNationUz – Learn Without Limits',
    description: 'Premium online courses with video lessons. Free & Subscription plans available.',
    type: 'website',
    locale: 'uz_UZ',
    alternateLocale: ['ru_RU', 'en_US'],
    siteName: 'EduNationUz',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'EduNationUz' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduNationUz – Learn Without Limits',
    description: 'Premium online courses with video lessons.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EduNation',
  },
};

export const viewport = {
  themeColor: '#f8fafc',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      registration.unregister();
                    }
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <LanguageProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1e293b',
                  color: '#fff',
                  border: '1px solid #334155',
                }
              }}
            />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
