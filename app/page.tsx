'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  SiteSettings,
  StakeholderCategory,
  PriorityItem,
  MissionOption,
  StakeholderQuestion,
  MissionSelectionInput,
} from '@/lib/types';
import Header from './(public)/components/Header';
import Footer from './(public)/components/Footer';
import StepLanding from './(public)/components/StepLanding';
import StepCombinedPartAB from './(public)/components/StepCombinedPartAB';
import StepMission from './(public)/components/StepMission';
import StepStakeholderQuestions from './(public)/components/StepStakeholderQuestions';
import StepSuggestion from './(public)/components/StepSuggestion';
import StepThankYou from './(public)/components/StepThankYou';
import { Loader2 } from 'lucide-react';

export default function PublicWizardPage() {
  const supabase = createClient();

  // Database loaded config state
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [categories, setCategories] = useState<StakeholderCategory[]>([]);
  const [priorityItems, setPriorityItems] = useState<PriorityItem[]>([]);
  const [missionOptions, setMissionOptions] = useState<MissionOption[]>([]);
  const [allQuestions, setAllQuestions] = useState<StakeholderQuestion[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Wizard state
  const [step, setStep] = useState<number>(0);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    stakeholder_category_id: '',
    priority_ratings: {} as Record<string, number>,
    mission_commitments: [] as MissionSelectionInput[],
    stakeholder_answers: {} as Record<string, any>,
    suggestion: '',
  });

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch initial database configuration
  useEffect(() => {
    async function loadConfig() {
      try {
        setIsLoadingConfig(true);

        const [
          settingsRes,
          categoriesRes,
          prioritiesRes,
          missionRes,
          questionsRes,
        ] = await Promise.all([
          supabase.from('site_settings').select('*').eq('id', 1).single(),
          supabase
            .from('stakeholder_categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('priority_items')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('mission_options')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('stakeholder_questions')
            .select('*, options:stakeholder_question_options(*)')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
        ]);

        if (settingsRes.data) setSettings(settingsRes.data);
        if (categoriesRes.data) setCategories(categoriesRes.data);
        if (prioritiesRes.data) setPriorityItems(prioritiesRes.data);
        if (missionRes.data) setMissionOptions(missionRes.data);
        if (questionsRes.data) {
          const sorted = questionsRes.data.map((q: any) => ({
            ...q,
            options: Array.isArray(q.options)
              ? [...q.options].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
              : [],
          }));
          setAllQuestions(sorted);
        }
      } catch (err) {
        console.error('Error fetching site configuration:', err);
      } finally {
        setIsLoadingConfig(false);
      }
    }

    loadConfig();
  }, []);

  // Selected category details & questions
  const selectedCategory = categories.find(
    (c) => c.id === formData.stakeholder_category_id
  );

  const activeCategoryQuestions = allQuestions.filter(
    (q) => q.category_id === formData.stakeholder_category_id
  );

  // Wizard Navigation handlers
  const handlePartABSubmit = (data: {
    name: string;
    phone: string;
    email: string;
    stakeholder_category_id: string;
    priority_ratings: Record<string, number>;
  }) => {
    setFormData((prev) => ({
      ...prev,
      ...data,
    }));
    setStep(2);
  };

  const handleMissionSubmit = (commitments: MissionSelectionInput[]) => {
    setFormData((prev) => ({
      ...prev,
      mission_commitments: commitments,
    }));

    // If active category has questions, go to step 3 (Part D), else skip to step 4 (Part E)
    if (activeCategoryQuestions.length > 0) {
      setStep(3);
    } else {
      setStep(4);
    }
  };

  const handleQuestionsSubmit = (answers: Record<string, any>) => {
    setFormData((prev) => ({
      ...prev,
      stakeholder_answers: answers,
    }));
    setStep(4);
  };

  const handleFinalSubmit = async (finalSuggestion: string) => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Re-format stakeholder answers for RPC payload
    const formattedAnswers: Record<string, { text?: string; selected?: any }> = {};
    Object.entries(formData.stakeholder_answers).forEach(([qId, val]) => {
      if (typeof val === 'string') {
        formattedAnswers[qId] = { text: val };
      } else {
        formattedAnswers[qId] = { selected: val };
      }
    });

    const rpcPayload = {
      p_name: formData.name || null,
      p_phone: formData.phone || null,
      p_email: formData.email || null,
      p_stakeholder_category_id: formData.stakeholder_category_id,
      p_priority_ratings: formData.priority_ratings,
      p_mission_selections: formData.mission_commitments,
      p_stakeholder_answers: formattedAnswers,
      p_suggestion: finalSuggestion || null,
    };

    try {
      const { data, error } = await supabase.rpc('submit_feedback_response', rpcPayload);

      if (error) {
        console.warn('RPC submission failed, attempting direct table fallback:', error.message);
        
        // Fallback: Direct table insertion
        const { data: resp, error: parentErr } = await supabase
          .from('responses')
          .insert([
            {
              name: formData.name || null,
              phone: formData.phone || null,
              email: formData.email || null,
              stakeholder_category_id: formData.stakeholder_category_id,
            },
          ])
          .select()
          .single();

        if (parentErr) throw parentErr;

        if (resp && resp.id) {
          const resId = resp.id;

          // Part B Priority Ratings
          const pRows = Object.entries(formData.priority_ratings).map(([pId, rating]) => ({
            response_id: resId,
            priority_item_id: pId,
            rating,
          }));
          if (pRows.length > 0) {
            await supabase.from('response_priority_ratings').insert(pRows);
          }

          // Part C Mission Selections
          const mRows = formData.mission_commitments.map((m) => ({
            response_id: resId,
            mission_option_id: m.option_id,
            other_text: m.other_text || null,
          }));
          if (mRows.length > 0) {
            await supabase.from('response_mission_selections').insert(mRows);
          }

          // Part D Question Answers
          const aRows = Object.entries(formattedAnswers).map(([qId, val]) => ({
            response_id: resId,
            question_id: qId,
            answer_text: val.text || null,
            selected_option_ids: val.selected || null,
          }));
          if (aRows.length > 0) {
            await supabase.from('response_answers').insert(aRows);
          }

          // Part E Suggestion
          if (finalSuggestion && finalSuggestion.trim()) {
            await supabase.from('response_suggestions').insert([
              {
                response_id: resId,
                suggestion_text: finalSuggestion.trim(),
              },
            ]);
          }
        }
      }

      setFormData((prev) => ({ ...prev, suggestion: finalSuggestion }));
      setStep(5);
    } catch (err: any) {
      console.error('Error submitting feedback response:', err);
      setSubmitError(
        err.message || 'Failed to submit response. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step Progress Calculation
  const totalWizardSteps = activeCategoryQuestions.length > 0 ? 4 : 3;
  const currentStepNumber =
    step === 0 ? 0 : step === 5 ? totalWizardSteps : step > 3 && activeCategoryQuestions.length === 0 ? step - 1 : step;

  const primaryColor = settings?.primary_color || '#1F4E79';

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FB]">
      <Header settings={settings} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        {isLoadingConfig ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
            <p className="text-sm font-medium">Loading Feedback Form Configuration...</p>
          </div>
        ) : (
          <>
            {/* Step Progress Bar (Shown during wizard steps 1-4) */}
            {step > 0 && step < 5 && (
              <div className="max-w-2xl mx-auto mb-8 px-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
                  <span>Step {currentStepNumber} of {totalWizardSteps}</span>
                  <span>
                    {step === 1 && 'Part A & B: Details & Priorities'}
                    {step === 2 && 'Part C: Mission Commitments'}
                    {step === 3 && 'Part D: Role Questions'}
                    {step === 4 && 'Part E: Final Suggestions'}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${(currentStepNumber / totalWizardSteps) * 100}%`,
                      backgroundColor: primaryColor,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Wizard Steps */}
            {step === 0 && (
              <StepLanding
                settings={settings}
                onStart={() => setStep(1)}
              />
            )}

            {step === 1 && (
              <StepCombinedPartAB
                categories={categories}
                priorityItems={priorityItems}
                initialValues={{
                  name: formData.name,
                  phone: formData.phone,
                  email: formData.email,
                  stakeholder_category_id: formData.stakeholder_category_id,
                  priority_ratings: formData.priority_ratings,
                }}
                onNext={handlePartABSubmit}
                primaryColor={primaryColor}
              />
            )}

            {step === 2 && (
              <StepMission
                missionOptions={missionOptions}
                initialSelections={formData.mission_commitments}
                onNext={handleMissionSubmit}
                onBack={() => setStep(1)}
                primaryColor={primaryColor}
              />
            )}

            {step === 3 && (
              <StepStakeholderQuestions
                categoryLabel={selectedCategory?.label || 'Stakeholder'}
                questions={activeCategoryQuestions}
                initialAnswers={formData.stakeholder_answers}
                onNext={handleQuestionsSubmit}
                onBack={() => setStep(2)}
                primaryColor={primaryColor}
              />
            )}

            {step === 4 && (
              <StepSuggestion
                initialSuggestion={formData.suggestion}
                onSubmit={handleFinalSubmit}
                onBack={() =>
                  setStep(activeCategoryQuestions.length > 0 ? 3 : 2)
                }
                isSubmitting={isSubmitting}
                submitError={submitError}
                primaryColor={primaryColor}
              />
            )}

            {step === 5 && <StepThankYou settings={settings} />}
          </>
        )}
      </main>

      <Footer settings={settings} />
    </div>
  );
}
