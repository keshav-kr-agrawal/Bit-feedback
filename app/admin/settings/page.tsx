'use client';

import React, { useEffect, useState } from 'react';
import AdminNav from '../components/AdminNav';
import { createClient } from '@/lib/supabase/client';
import { SiteSettings } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { siteSettingsSchema } from '@/lib/validation';
import { z } from 'zod';
import { Save, Loader2, CheckCircle2, Lock, Unlock, Palette, Building2 } from 'lucide-react';

type FormValues = z.infer<typeof siteSettingsSchema>;

export default function AdminSettingsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(siteSettingsSchema),
  });

  const isFormOpen = watch('is_form_open');
  const primaryColorValue = watch('primary_color') || '#1F4E79';

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error) throw error;
      if (data) {
        reset({
          institute_name: data.institute_name,
          logo_url: data.logo_url || '',
          form_title: data.form_title,
          form_intro_text: data.form_intro_text,
          is_form_open: data.is_form_open,
          closed_message: data.closed_message,
          thank_you_message: data.thank_you_message,
          primary_color: data.primary_color,
        });
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    setToast(null);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          id: 1,
          ...values,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setToast('Site settings updated successfully!');
      setTimeout(() => setToast(null), 4000);
    } catch (err: any) {
      alert(`Failed to update site settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Site Settings & Form Control
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage institute branding, custom messaging, primary accent colors, and form status.
          </p>
        </div>

        {toast && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{toast}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
            <p className="text-sm font-medium">Loading Settings Configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Form Availability Toggle Banner */}
            <div
              className={`rounded-2xl p-6 border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                isFormOpen
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/60 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-start gap-3">
                {isFormOpen ? (
                  <Unlock className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Lock className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-bold text-base">
                    Public Feedback Form Status: {isFormOpen ? 'OPEN (Accepting Submissions)' : 'CLOSED (Locked)'}
                  </h3>
                  <p className="text-xs opacity-80 mt-0.5">
                    {isFormOpen
                      ? 'Respondents can access and submit the multi-step feedback form.'
                      : 'The form displays the closed message and blocks new submissions.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setValue('is_form_open', !isFormOpen)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm ${
                  isFormOpen
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                }`}
              >
                {isFormOpen ? 'Close Form Now' : 'Open Form Now'}
              </button>
            </div>

            {/* General Branding Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building2 className="w-5 h-5 text-blue-800" />
                <span>Institute Branding & Logo</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Institute Name
                  </label>
                  <input
                    type="text"
                    {...register('institute_name')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500"
                  />
                  {errors.institute_name && (
                    <p className="text-xs text-red-600 mt-1">{errors.institute_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Logo Image URL <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/logo.png"
                    {...register('logo_url')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500"
                  />
                </div>
              </div>

              {/* Primary Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Primary Institutional Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColorValue}
                    onChange={(e) => setValue('primary_color', e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    {...register('primary_color')}
                    placeholder="#1F4E79"
                    className="w-36 p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:border-slate-500"
                  />
                  <div
                    className="h-10 px-4 rounded-xl text-white text-xs font-bold flex items-center shadow-sm"
                    style={{ backgroundColor: primaryColorValue }}
                  >
                    Color Preview
                  </div>
                </div>
                {errors.primary_color && (
                  <p className="text-xs text-red-600 mt-1">{errors.primary_color.message}</p>
                )}
              </div>
            </div>

            {/* Public Form Wording & Messages */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Public Form Wording & Headers
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Form Heading Title
                </label>
                <input
                  type="text"
                  {...register('form_title')}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500"
                />
                {errors.form_title && (
                  <p className="text-xs text-red-600 mt-1">{errors.form_title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                  Form Introduction Text
                </label>
                <textarea
                  rows={3}
                  {...register('form_intro_text')}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500"
                />
                {errors.form_intro_text && (
                  <p className="text-xs text-red-600 mt-1">{errors.form_intro_text.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Form Closed Message
                  </label>
                  <textarea
                    rows={3}
                    {...register('closed_message')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500"
                  />
                  {errors.closed_message && (
                    <p className="text-xs text-red-600 mt-1">{errors.closed_message.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Thank You Completion Message
                  </label>
                  <textarea
                    rows={3}
                    {...register('thank_you_message')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500"
                  />
                  {errors.thank_you_message && (
                    <p className="text-xs text-red-600 mt-1">{errors.thank_you_message.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Site Settings</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
