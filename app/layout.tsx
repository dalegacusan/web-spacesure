import { Toaster } from '@/components/toaster';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type React from 'react';
import { AuthProvider } from './context/auth.context';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SpaceSure - Parking Reservation System',
  description: 'Park with Confidence, Reserve with Ease',
  generator: 'v0.dev',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
