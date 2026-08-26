'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stepCombinedPartABSchema } from '@/lib/validation';
import { StakeholderCategory, PriorityItem } from '@/lib/types';
import { User, Phone, Mail, Users, ArrowRight, AlertCircle } from 'lucide-react';
import { z } from 'zod';

type FormValues = z.infer<typeof stepCombinedPartABSchema>;

interface StepCombinedPartABProps {
  categories: StakeholderCategory[];
  priorityItems: PriorityItem[];
  initialValues: {
    name: string;
    phone: string;
    email: string;
    stakeholder_category_id: string;
    priority_ratings: Record<string, number>;
  };
  onNext: (data: {
    name: string;
    phone: string;
    email: string;
    stakeholder_category_id: string;
    priority_ratings: Record<string, number>;
  }) => void;
  primaryColor: string;
}

export default function StepCombinedPartAB({
  categories,
  priorityItems,
  initialValues,
  onNext,
  primaryColor,
}: StepCombinedPartABProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(stepCombinedPartABSchema),
    defaultValues: {
      name: initialValues.name,
      phone: initialValues.phone,
      email: initialValues.email,
      stakeholder_category_id: initialValues.stakeholder_category_id,
    },
  });

  const [ratings, setRatings] = useState<Record<string, number>>(
    initialValues.priority_ratings || {}
  );
  const [priorityError, setPriorityError] = useState<string | null>(null);

  const handleRatingChange = (itemId: string, val: number) => {
    setRatings((prev) => ({
      ...prev,
      [itemId]: val,
    }));
    setPriorityError(null);
  };

  const onFormSubmit = (values: FormValues) => {
    // Check if every active priority item has been rated
    const unrated = priorityItems.filter((item) => !ratings[item.id]);

    if (unrated.length > 0) {
      setPriorityError(
        `Please rate all ${priorityItems.length} priority items before proceeding (${unrated.length} unrated remaining).`
      );
      return;
    }

    onNext({
      name: values.name || '',
      phone: values.phone || '',
      email: values.email || '',
      stakeholder_category_id: values.stakeholder_category_id,
      priority_ratings: ratings,
    });
  };

  const ratedCount = Object.keys(ratings).filter((id) =>
    priorityItems.some((item) => item.id === id)
  ).length;

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 max-w-3xl mx-auto space-y-8"
    >
      {/* SECTION 1: PART A */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            <span>Part A</span>
            <span>•</span>
            <span>Respondent Details</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            Personal & Stakeholder Information
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Please provide your contact details (optional) and select your stakeholder role (mandatory).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Full Name <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Dr. Rajesh Kumar"
                {...register('name')}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500 transition-colors"
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                {...register('phone')}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500 transition-colors"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Email Address <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                placeholder="e.g. rajesh@example.com"
                {...register('email')}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500 transition-colors"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Stakeholder Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Stakeholder Category <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Users className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                {...register('stakeholder_category_id')}
                className={`w-full pl-11 pr-4 py-2.5 rounded-xl border bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none transition-colors appearance-none ${
                  errors.stakeholder_category_id
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-slate-300 focus:border-slate-500'
                }`}
              >
                <option value="">-- Select Stakeholder Category --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.stakeholder_category_id && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                {errors.stakeholder_category_id.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* SECTION 2: PART B */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            <span>Part B</span>
            <span>•</span>
            <span>Institutional Priorities</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            How important should the following areas be in determining the future direction of the Institute?
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Rate each item on a scale of 1 to 5 (<strong className="text-slate-900">1 = Low priority</strong>, <strong className="text-slate-900">5 = Very high priority</strong>).
          </p>
        </div>

        {/* Legend */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
          <div className="font-medium">
            Scale: 1 (Low) → 5 (Very High)
          </div>
          <div className="font-semibold text-slate-600">
            Progress: {ratedCount} / {priorityItems.length} rated
          </div>
        </div>

        {priorityError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{priorityError}</span>
          </div>
        )}

        <div className="space-y-4 divide-y divide-slate-100">
          {priorityItems.map((item, idx) => {
            const currentRating = ratings[item.id];
            return (
              <div key={item.id} className="pt-4 first:pt-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <label className="text-sm font-medium text-slate-800 md:max-w-md">
                    <span className="font-semibold text-slate-400 mr-2">
                      {idx + 1}.
                    </span>
                    {item.label}
                  </label>

                  <div className="flex items-center gap-1.5 sm:gap-2 self-start md:self-auto">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const isSelected = currentRating === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleRatingChange(item.id, val)}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-sm font-semibold transition-all border ${
                            isSelected
                              ? 'text-white border-transparent shadow-sm scale-105'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                          style={
                            isSelected ? { backgroundColor: primaryColor } : undefined
                          }
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 rounded-xl text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all hover:opacity-95"
          style={{ backgroundColor: primaryColor }}
        >
          <span>Next: Mission Commitments</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
