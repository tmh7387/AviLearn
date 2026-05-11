'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

const CRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/schedule': 'Schedule',
  '/roster': 'Student roster',
  '/courses': 'Courses',
  '/grades': 'Grades',
  '/chat': 'Chat',
  '/mail': 'Mailbox',
  '/reports': 'Reports',
  '/aircraft': 'Aircraft',
  '/weather': 'Weather',
  '/settings': 'Settings',
};

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const crumb = CRUMB_MAP[pathname] || 'Dashboard';

  return (
    <div className="app">
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', minWidth: 0 }}>
        <Header crumb={crumb} />
        <main className="page" style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
