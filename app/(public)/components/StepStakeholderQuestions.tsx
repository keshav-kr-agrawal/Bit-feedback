'use client';

import React, { useState } from 'react';
import { StakeholderQuestion, StakeholderQuestionOption } from '@/lib/types';
import { ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StepStakeholderQuestionsProps {
  categoryLabel: string;
  questions: StakeholderQuestion[];
  initialAnswers: Record<string, any>;
  onNext: (answers: Record<string, any>) => void;
  onBack: () => void;
  primaryColor: string;
}

export default function StepStakeholderQuestions({
  categoryLabel,
  questions,
  initialAnswers,
  onNext,
  onBack,
  primaryColor,
}: StepStakeholderQuestionsProps) {
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAnswerChange = (qId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: value,
    }));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  const handleCheckboxToggle = (qId: string, optionLabel: string) => {
    const currentList: string[] = Array.isArray(answers[qId]) ? answers[qId] : [];
    const updated = currentList.includes(optionLabel)
      ? currentList.filter((item) => item !== optionLabel)
      : [...currentList, optionLabel];

    handleAnswerChange(qId, updated);
  };

  const handleGridRatingChange = (qId: string, rowLabel: string, colLabel: string) => {
    const currentGrid: Record<string, string> =
      typeof answers[qId] === 'object' && answers[qId] !== null ? answers[qId] : {};
    handleAnswerChange(qId, {
      ...currentGrid,
      [rowLabel]: colLabel,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    questions.forEach((q) => {
      if (q.is_required) {
        const val = answers[q.id];
        if (val === undefined || val === null || val === '') {
          newErrors[q.id] = 'This question is required.';
        } else if (q.question_type === 'checkboxes' && Array.isArray(val) && val.length === 0) {
          newErrors[q.id] = 'Please select at least one option.';
        } else if (q.question_type === 'multiple_choice_grid') {
          const gridAnswers: Record<string, string> =
            typeof val === 'object' && val !== null ? val : {};
          const rowOptions = (q.options || []).filter(
            (o) => o.option_group === 'row' || o.option_group === 'option'
          );
          const missing = rowOptions.some((r) => !gridAnswers[r.option_label]);
          if (missing) {
            newErrors[q.id] = 'Please rate every item in the grid.';
          }
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext(answers);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-3xl mx-auto space-y-6 text-center">
        <div>
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            <span>Part D</span>
            <span>•</span>
            <span>{categoryLabel} Questionnaire</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Role-Specific Stakeholder Feedback</h2>
          <p className="text-sm text-slate-600 mt-2">
            No additional category-specific questions are configured for <strong>{categoryLabel}</strong>.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            type="button"
            onClick={() => onNext({})}
            className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all hover:opacity-95"
            style={{ backgroundColor: primaryColor }}
          >
            <span>Continue to Final Suggestion</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-3xl mx-auto space-y-6"
    >
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          <span>Part D</span>
          <span>•</span>
          <span>{categoryLabel} Specific Questions</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Role-Specific Stakeholder Feedback
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Please answer the following questions tailored to your role as {categoryLabel}.
        </p>
      </div>

      <div className="space-y-8 divide-y divide-slate-100">
        {questions.map((q, idx) => {
          const hasError = !!errors[q.id];
          const rawOptions = q.options || [];

          return (
            <div key={q.id} className="pt-6 first:pt-0 space-y-3">
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-400 text-sm mt-0.5">
                  {idx + 1}.
                </span>
                <label className="text-base font-semibold text-slate-800 leading-snug">
                  {q.question_text}{' '}
                  {q.is_required && <span className="text-red-500">*</span>}
                </label>
              </div>

              {hasError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium pl-6">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors[q.id]}</span>
                </div>
              )}

              <div className="pl-6">
                {/* 1. Checkboxes */}
                {q.question_type === 'checkboxes' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {rawOptions.map((opt) => {
                        const isChecked =
                          Array.isArray(answers[q.id]) &&
                          answers[q.id].includes(opt.option_label);
                        return (
                          <label
                            key={opt.id}
                            className={`flex items-start gap-3 p-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer select-none ${
                              isChecked
                                ? 'bg-blue-50/50 border-blue-300 text-slate-900'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCheckboxToggle(q.id, opt.option_label)}
                              className="mt-0.5 rounded border-slate-300 text-slate-800 focus:ring-slate-500 h-4 w-4"
                            />
                            <span>{opt.option_label}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Full multiline text area for written response */}
                    <div className="pt-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Specific Comments / Detailed Written Feedback <span className="font-normal text-slate-400">(Optional)</span>
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Type your detailed written response, comments, or additional areas to strengthen here..."
                        value={
                          typeof answers[`${q.id}_other`] === 'string'
                            ? answers[`${q.id}_other`]
                            : ''
                        }
                        onChange={(e) => handleAnswerChange(`${q.id}_other`, e.target.value)}
                        className="w-full p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* 2. Paragraph */}
                {q.question_type === 'paragraph' && (
                  <textarea
                    rows={4}
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Type your detailed response here..."
                    className="w-full p-3.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500 transition-colors"
                  />
                )}

                {/* 3. Multiple Choice */}
                {q.question_type === 'multiple_choice' && (
                  <div className="space-y-2">
                    {rawOptions.map((opt) => {
                      const isSelected = answers[q.id] === opt.option_label;
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer select-none ${
                            isSelected
                              ? 'bg-blue-50/50 border-blue-300 text-slate-900'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${q.id}`}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(q.id, opt.option_label)}
                            className="text-slate-800 focus:ring-slate-500 h-4 w-4"
                          />
                          <span>{opt.option_label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* 4. Multiple Choice Grid */}
                {q.question_type === 'multiple_choice_grid' && (() => {
                  const rows = rawOptions.filter(
                    (o) => o.option_group === 'row' || o.option_group === 'option'
                  );
                  const columns = rawOptions.filter((o) => o.option_group === 'column');
                  const colLabels =
                    columns.length > 0
                      ? columns.map((c) => c.option_label)
                      : ['Not Important', 'Somewhat Important', 'Important', 'Very Important'];

                  return (
                    <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                      <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <span>Quality / Competency</span>
                        <span>Rating Options</span>
                      </div>
                      {rows.map((rowOpt) => {
                        const currentVal =
                          typeof answers[q.id] === 'object' && answers[q.id] !== null
                            ? answers[q.id][rowOpt.option_label]
                            : undefined;

                        return (
                          <div
                            key={rowOpt.id}
                            className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <span className="text-sm font-medium text-slate-800 sm:max-w-xs">
                              {rowOpt.option_label}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {colLabels.map((cLabel) => {
                                const isSel = currentVal === cLabel;
                                return (
                                  <button
                                    key={cLabel}
                                    type="button"
                                    onClick={() =>
                                      handleGridRatingChange(q.id, rowOpt.option_label, cLabel)
                                    }
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                      isSel
                                        ? 'text-white border-transparent shadow-sm'
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                    style={
                                      isSel ? { backgroundColor: primaryColor } : undefined
                                    }
                                  >
                                    {cLabel}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* 5. Rating Scale */}
                {q.question_type === 'rating_scale' && (
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isSel = answers[q.id] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleAnswerChange(q.id, val)}
                          className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all border ${
                            isSel
                              ? 'text-white border-transparent'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                          style={isSel ? { backgroundColor: primaryColor } : undefined}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all hover:opacity-95"
          style={{ backgroundColor: primaryColor }}
        >
          <span>Next: Final Suggestion</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
