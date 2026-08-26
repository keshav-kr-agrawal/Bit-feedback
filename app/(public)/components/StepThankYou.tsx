'use client';

import React from 'react';
import { SiteSettings } from '@/lib/types';
import { CheckCircle2, Building2 } from 'lucide-react';

interface StepThankYouProps {
  settings: SiteSettings | null;
}

export default function StepThankYou({ settings }: StepThankYouProps) {
  const thankYouMessage =
    settings?.thank_you_message || 'Thank you for your valuable feedback.';
  const instituteName = settings?.institute_name || 'Institute Name';
  const primaryColor = settings?.primary_color || '#1F4E79';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-12 max-w-xl mx-auto text-center space-y-6">
      <div
        className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Feedback Submitted
        </h2>
        <p className="text-base sm:text-lg text-slate-600 font-medium">
          {thankYouMessage}
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-600 space-y-1 text-left">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Building2 className="w-4 h-4 text-slate-500" />
          <span>{instituteName} IQAC Office</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Your input has been recorded securely and will be analyzed by the NBA/NAAC Vision-Mission Formulation Committee.
        </p>
      </div>
    </div>
  );
}
