import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { LanguageProvider } from '@/context/LanguageContext';
import AuthProvider from '@/components/AuthProvider';

export const metadata: Metadata = {
  title: 'EduNation – Learn Without Limits',
  description: 'EduNation is a premium educational platform offering world-class video courses in tech, design, business, and more. Start free, upgrade anytime.',
  keywords: 'online learning, video courses, education, programming, design, EduNation',
  openGraph: {
    title: 'EduNation – Learn Without Limits',
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
            <Navbar />
            <main>{children}</main>
            <Footer />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
