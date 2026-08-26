'use client';

import React, { useState } from 'react';
import { ArrowLeft, Send, Loader2, MessageSquareText } from 'lucide-react';

interface StepSuggestionProps {
  initialSuggestion: string;
  onSubmit: (suggestion: string) => void;
  onBack: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  primaryColor: string;
}

export default function StepSuggestion({
  initialSuggestion,
  onSubmit,
  onBack,
  isSubmitting,
  submitError,
  primaryColor,
}: StepSuggestionProps) {
  const [suggestion, setSuggestion] = useState(initialSuggestion);
  const [isCooldown, setIsCooldown] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isCooldown) return;

    // Soft anti-spam cooldown
    setIsCooldown(true);
    setTimeout(() => setIsCooldown(false), 3000);

    onSubmit(suggestion);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-2xl mx-auto space-y-6"
    >
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          <span>Part E</span>
          <span>•</span>
          <span>Final Comments</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Additional Recommendations
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Please provide any additional suggestion that should be considered while formulating the Vision and Mission of the Institute.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          Your Suggestion / Comments <span className="text-slate-400 font-normal">(Optional)</span>
        </label>
        <div className="relative">
          <textarea
            rows={5}
            value={suggestion}
            onChange={(e) => setSuggestion(e.target.value)}
            placeholder="Share any key aspects, values, or improvements you feel should be incorporated..."
            className="w-full p-4 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500 transition-colors"
          />
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
          <strong>Submission Error:</strong> {submitError}
        </div>
      )}

      <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting || isCooldown}
          className="px-7 py-3 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: primaryColor }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting Feedback...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Feedback</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
