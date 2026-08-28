'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  TableProperties,
  Sliders,
  Users,
  Star,
  CheckSquare,
  HelpCircle,
  ExternalLink,
  LogOut,
  Building2,
} from 'lucide-react';

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    document.cookie = 'admin_demo_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Responses', href: '/admin/responses', icon: TableProperties },
    { label: 'Site Settings', href: '/admin/settings', icon: Sliders },
    { label: 'Categories', href: '/admin/stakeholders', icon: Users },
    { label: 'Priority Items', href: '/admin/priorities', icon: Star },
    { label: 'Mission Options', href: '/admin/mission-options', icon: CheckSquare },
    { label: 'Question Builder', href: '/admin/questions', icon: HelpCircle },
  ];

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shadow-sm flex-shrink-0">
              <img src="/bit.jpg" alt="BIT Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base tracking-tight block leading-tight text-white">
                Bangalore Institute of Technology
              </span>
              <span className="text-[11px] text-blue-300 font-medium block">
                An Autonomous Institution under VTU, Belagavi
              </span>
            </div>
          </div>

          {/* Quick links & Sign out */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
            >
              <span>View Live Form</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Sub-nav tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
