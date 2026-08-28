'use client';

import React from 'react';
import { SiteSettings } from '@/lib/types';

interface FooterProps {
  settings: SiteSettings | null;
}

export default function Footer({ settings }: FooterProps) {
  const instituteName = settings?.institute_name || 'Bangalore Institute of Technology';

  return (
    <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <p className="text-sm font-semibold text-slate-700">
          {instituteName}
        </p>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          An Autonomous Institution under VTU, Belagavi
        </p>
      </div>
    </footer>
  );
}
