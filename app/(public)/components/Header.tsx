'use client';

import React from 'react';
import Image from 'next/image';
import { Building2 } from 'lucide-react';
import { SiteSettings } from '@/lib/types';

interface HeaderProps {
  settings: SiteSettings | null;
}

export default function Header({ settings }: HeaderProps) {
  const instituteName = settings?.institute_name || 'Bangalore Institute of Technology';
  const logoUrl = settings?.logo_url;
  const primaryColor = settings?.primary_color || '#1F4E79';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      {/* Dynamic primary color accent bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: primaryColor }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <div className="relative h-12 w-12 flex-shrink-0">
              <img
                src={logoUrl}
                alt={instituteName}
                className="h-12 w-12 object-contain"
              />
            </div>
          ) : (
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Building2 className="w-6 h-6" />
            </div>
          )}
          <div>
            <h1 className="font-semibold text-lg sm:text-xl text-slate-900 tracking-tight leading-snug">
              {instituteName}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Internal Quality Assurance Cell (IQAC) • NBA & NAAC Accreditation
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
