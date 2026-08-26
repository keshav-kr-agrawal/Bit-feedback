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
        <p className="text-sm text-slate-500 font-medium">
          Powered by {instituteName} IQAC
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Internal Quality Assurance Cell • NBA/NAAC Vision-Mission Feedback Process
        </p>
      </div>
    </footer>
  );
}
