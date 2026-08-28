'use client';

import React from 'react';
import { SiteSettings } from '@/lib/types';
import { ClipboardList, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

interface StepLandingProps {
  settings: SiteSettings | null;
  onStart: () => void;
}

export default function StepLanding({ settings, onStart }: StepLandingProps) {
  const formTitle =
    settings?.form_title || 'Stakeholder Feedback for Institute Vision & Mission';
  const introText =
    settings?.form_intro_text ||
    'Your feedback will help shape the future Vision and Mission of the Institute.';
  const isOpen = settings?.is_form_open ?? true;
  const closedMessage =
    settings?.closed_message ||
    'This feedback form is currently closed. Thank you for your interest.';
  const primaryColor = settings?.primary_color || '#1F4E79';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-10 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold uppercase tracking-wider mb-2">
        <ClipboardList className="w-5 h-5" style={{ color: primaryColor }} />
        <span>An Autonomous Institution under VTU, Belagavi</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-4">
        {formTitle}
      </h2>

      <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8 whitespace-pre-line">
        {introText}
      </p>

      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-8 space-y-3">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
          Exercise Overview & Structure
        </h3>
        <ul className="text-sm text-slate-600 space-y-2">
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span><strong>Part A:</strong> Basic Respondent Identification</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span><strong>Part B:</strong> Evaluation of Institutional Priorities (1–5 Scale)</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span><strong>Part C:</strong> Core Mission Commitments (Pick exactly 3 items)</span>
          </li>
          <li className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span><strong>Part D:</strong> Category-Specific Feedback & Qualitative Inputs</span>
          </li>
        </ul>
      </div>

      {isOpen ? (
        <button
          onClick={onStart}
          className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:opacity-95 active:scale-[0.99]"
          style={{ backgroundColor: primaryColor }}
        >
          <span>Begin Feedback Exercise</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3.5 text-amber-900">
          <Lock className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Form Closed</h4>
            <p className="text-sm text-amber-800 mt-1">{closedMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
