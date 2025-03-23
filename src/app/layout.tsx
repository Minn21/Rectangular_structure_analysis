import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navigation from '@/components/Navigation';
import { FoundationProvider } from '@/providers/FoundationProvider';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Structural Analysis App',
  description: 'A comprehensive structural analysis application for engineering design',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <FoundationProvider>
          <Navigation />
          <main>
            {children}
          </main>
        </FoundationProvider>
      </body>
    </html>
  );
}