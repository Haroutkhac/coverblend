import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import './globals.css';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  title: 'CoverBlend — Album Cover Camouflage Engine',
  description:
    'Upload any photo. Discover the album cover that was hiding inside it all along. CoverBlend analyzes your images and finds album artwork that camouflages seamlessly into your photos.',
  keywords: ['album cover', 'music', 'photo blend', 'camouflage', 'visual matching'],
  openGraph: {
    title: 'CoverBlend — Album Cover Camouflage Engine',
    description: 'Upload any photo. Discover the album cover hiding inside it.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-zinc-950 text-zinc-100`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
