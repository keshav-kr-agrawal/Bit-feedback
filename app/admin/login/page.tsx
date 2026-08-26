'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Lock, User, Loader2, AlertCircle, Building2 } from 'lucide-react';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'not_authorized'
      ? 'You are not registered as an administrator. Please contact your system administrator.'
      : null
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanId = adminId.trim();
      const cleanPass = password.trim();

      // Check admin credentials
      if (cleanId === 'HKS1321' && cleanPass === 'SavithaBit@1979') {
        document.cookie = 'admin_demo_session=true; path=/; max-age=86400; SameSite=Lax';
        router.push('/admin');
        router.refresh();
        return;
      }

      // Supabase Auth email login fallback if email format entered
      if (cleanId.includes('@')) {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanId,
          password: cleanPass,
        });

        if (!authError && data.user) {
          document.cookie = 'admin_demo_session=true; path=/; max-age=86400; SameSite=Lax';
          router.push('/admin');
          router.refresh();
          return;
        }
      }

      // Admin verification check
      setError('Invalid Admin ID or Password. Please try again.');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md w-full space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-blue-900 text-white rounded-xl mx-auto flex items-center justify-center shadow-sm">
          <Building2 className="w-7 h-7 text-blue-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bangalore Institute of Technology
          </h1>
          <p className="text-xs font-semibold text-blue-900 uppercase tracking-wider mt-0.5">
            IQAC Stakeholder Feedback Admin CMS
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Admin ID
          </label>
          <div className="relative">
            <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="Enter Admin ID"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>Sign In to Admin Dashboard</span>
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Bangalore Institute of Technology • IQAC Office
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-900 mb-2" />
            <p className="text-sm font-medium">Loading BIT Admin Portal...</p>
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}
