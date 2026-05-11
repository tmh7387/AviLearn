'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Users, BookOpen, ClipboardCheck,
  MessageSquare, Mail, BarChart3, Plane, Cloud, Settings, Info, Zap,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    label: 'Console',
    items: [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
      { id: 'schedule', icon: Calendar, label: 'Schedule', badge: '3', href: '/schedule' },
      { id: 'roster', icon: Users, label: 'Roster', badge: '47', href: '/roster' },
      { id: 'courses', icon: BookOpen, label: 'Courses', href: '/courses' },
      { id: 'simulations', icon: Zap, label: 'Simulations', href: '/simulations' },
      { id: 'grades', icon: ClipboardCheck, label: 'Grades', badge: '9', href: '/grades' },
    ],
  },
  {
    label: 'Apps',
    items: [
      { id: 'chat', icon: MessageSquare, label: 'Chat', href: '/chat' },
      { id: 'mail', icon: Mail, label: 'Mailbox', href: '/mail' },
      { id: 'reports', icon: BarChart3, label: 'Reports', href: '/reports' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'aircraft', icon: Plane, label: 'Aircraft', href: '/aircraft' },
      { id: 'weather', icon: Cloud, label: 'Weather', href: '/weather' },
      { id: 'settings', icon: Settings, label: 'Settings', href: '/settings' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="6" fill="#2dd4bf" fillOpacity="0.15" />
          <path d="M8 18L14 8L20 18" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10.5 14H17.5" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>
          Avi<span style={{ color: '#2dd4bf' }}>Learn</span>
        </div>
      </div>

      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <div className="sidebar-section">{section.label}</div>
          <div className="sidebar-nav">
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/') || (item.href === '/dashboard' && pathname === '/');
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={18} style={{ flexShrink: 0 }} />
                  <span>{item.label}</span>
                  {item.badge && <span className="badge">{item.badge}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      <div className="sidebar-foot">
        <Info size={14} />
        v1.0.0 · AviLearn Engine
      </div>
    </aside>
  );
}
