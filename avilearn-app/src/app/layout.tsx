import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AviLearn Engine',
  description: 'Aviation training & learning-management platform — dynamic simulation generator + AI-orchestrated content transformation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
