import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/authContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartOps - Team Task Management',
  description: 'Smart Operation System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
