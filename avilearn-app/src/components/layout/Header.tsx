'use client';

import { Search, Bell, HelpCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

interface HeaderProps {
  crumb: string;
}

export function Header({ crumb }: HeaderProps) {
  return (
    <header className="header">
      <div className="crumb">
        <span>AviLearn</span>
        <span style={{ color: 'var(--fg-3)' }}>›</span>
        <span className="now">{crumb}</span>
      </div>
      <div className="search">
        <Search size={16} className="search-icon" />
        <input placeholder="Search students, lessons, aircraft…" />
      </div>
      <button className="icon-btn" title="Notifications">
        <Bell size={18} />
        <span className="dot" />
      </button>
      <button className="icon-btn" title="Help">
        <HelpCircle size={18} />
      </button>
      <div className="user-chip">
        <Avatar name="Anne Clarc" seed={2} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span className="name">Anne Clarc</span>
          <span className="role">Chief instructor</span>
        </div>
      </div>
    </header>
  );
}
