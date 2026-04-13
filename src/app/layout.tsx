import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Disclaimer from '@/components/Disclaimer';

export const metadata: Metadata = {
  title: 'College Coach — Your Academic Journey Guide',
  description:
    'A step-by-step guide to help students succeed from 6th grade through college admissions with AI-powered coaching, roadmaps, goals, and weekly check-ins.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <Navbar />
        <Disclaimer />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
