'use client';

import React, { useState } from 'react';
import { MissionOption, MissionSelectionInput } from '@/lib/types';
import { ArrowLeft, ArrowRight, CheckSquare, AlertCircle } from 'lucide-react';

interface StepMissionProps {
  missionOptions: MissionOption[];
  initialSelections: MissionSelectionInput[];
  onNext: (selections: MissionSelectionInput[]) => void;
  onBack: () => void;
  primaryColor: string;
}

export default function StepMission({
  missionOptions,
  initialSelections,
  onNext,
  onBack,
  primaryColor,
}: StepMissionProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSelections.map((s) => s.option_id)
  );

  const initialOtherText =
    initialSelections.find((s) => s.other_text !== undefined)?.other_text || '';
  const [otherText, setOtherText] = useState<string>(initialOtherText);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const otherOption = missionOptions.find(
    (o) => o.label.toLowerCase() === 'other'
  );

  const toggleOption = (id: string) => {
    setErrorMsg(null);
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
      if (otherOption && id === otherOption.id) {
        setOtherText('');
      }
    } else {
      if (selectedIds.length >= 3) {
        setErrorMsg(
          'You can select a maximum of 3 commitments. Please uncheck one option to pick a different one.'
        );
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length !== 3) {
      setErrorMsg(
        `Please select exactly 3 commitments. Currently selected: ${selectedIds.length}/3.`
      );
      return;
    }

    if (otherOption && selectedIds.includes(otherOption.id) && !otherText.trim()) {
      setErrorMsg('Please specify your text for the "Other" commitment.');
      return;
    }

    const payload: MissionSelectionInput[] = selectedIds.map((id) => {
      const isOther = otherOption && id === otherOption.id;
      return {
        option_id: id,
        other_text: isOther ? otherText.trim() : undefined,
      };
    });

    onNext(payload);
  };

  const isExactThree = selectedIds.length === 3;
  const isOtherChecked = otherOption && selectedIds.includes(otherOption.id);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-3xl mx-auto space-y-6"
    >
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
          <span>Part C</span>
          <span>•</span>
          <span>Mission Commitments</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Core Commitments for Institute Mission
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Mention any <strong className="text-slate-900 font-semibold">THREE</strong> important commitments that should be reflected in the Institute Mission.
        </p>
      </div>

      {/* Progress & selection counter badge */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <CheckSquare className="w-5 h-5 text-slate-500" />
          <span>Requirement: Select exactly 3 options</span>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
            isExactThree
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}
        >
          {selectedIds.length} / 3 Selected
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Checkbox Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {missionOptions.map((option) => {
          const isChecked = selectedIds.includes(option.id);
          const isDisabled = !isChecked && selectedIds.length >= 3;

          return (
            <div key={option.id} className="space-y-2">
              <label
                onClick={() => {
                  if (!isDisabled) toggleOption(option.id);
                }}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm font-medium transition-all cursor-pointer select-none ${
                  isChecked
                    ? 'bg-blue-50/50 border-blue-300 text-slate-900 shadow-sm'
                    : isDisabled
                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => {}}
                  className="mt-0.5 rounded border-slate-300 text-slate-800 focus:ring-slate-500 h-4 w-4"
                />
                <span className="leading-snug">{option.label}</span>
              </label>

              {/* Specify text input if "Other" option selected */}
              {isChecked && option.label.toLowerCase() === 'other' && (
                <div className="pl-7">
                  <input
                    type="text"
                    value={otherText}
                    onChange={(e) => setOtherText(e.target.value)}
                    placeholder="Please specify custom commitment..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs focus:bg-white focus:outline-none focus:border-slate-500"
                  />
                </div>
              )}
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
          disabled={!isExactThree}
          className={`px-6 py-2.5 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all ${
            isExactThree ? 'hover:opacity-95' : 'opacity-50 cursor-not-allowed'
          }`}
          style={{ backgroundColor: primaryColor }}
        >
          <span>Next: Stakeholder Questions</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
