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
import { FALLBACK_CATEGORIES, FALLBACK_QUESTIONS } from '@/lib/sampleData';
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
  const [categories, setCategories] = useState<StakeholderCategory[]>(FALLBACK_CATEGORIES);
  const [priorityItems, setPriorityItems] = useState<PriorityItem[]>([]);
  const [missionOptions, setMissionOptions] = useState<MissionOption[]>([]);
  const [allQuestions, setAllQuestions] = useState<StakeholderQuestion[]>(FALLBACK_QUESTIONS);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // Wizard state
  const [step, setStep] = useState<number>(1);
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
          optionsRes,
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
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('stakeholder_question_options')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
        ]);

        if (settingsRes.data) setSettings(settingsRes.data);
        if (categoriesRes.data && categoriesRes.data.length > 0) {
          const mappedCats = categoriesRes.data.map((c: any) =>
            c.label.trim() === 'Staff' || c.slug === 'staff'
              ? { ...c, label: 'Technical Staff', slug: 'technical_staff' }
              : c
          );
          setCategories(mappedCats);
        }
        if (prioritiesRes.data && prioritiesRes.data.length > 0) setPriorityItems(prioritiesRes.data);
        if (missionRes.data && missionRes.data.length > 0) setMissionOptions(missionRes.data);

        if (questionsRes.data && questionsRes.data.length > 0) {
          const optionsList = optionsRes.data || [];
          const dbQuestions = questionsRes.data;
          const activeCats = categoriesRes.data && categoriesRes.data.length > 0 ? categoriesRes.data : FALLBACK_CATEGORIES;

          // Check if any active category has no questions in dbQuestions
          const extraFallbacks: any[] = [];
          activeCats.forEach((cat: any) => {
            const hasQuestionsInDb = dbQuestions.some((q: any) => q.category_id === cat.id);
            if (!hasQuestionsInDb) {
              const catLabel = cat.label.toLowerCase();
              const catSlug = cat.slug.toLowerCase();
              const roleKeyword =
                catLabel.includes('academic') || catSlug.includes('academic') ? 'academic' :
                catLabel.includes('technical') || catLabel.includes('staff') || catSlug.includes('staff') ? 'techstaff' : '';

              if (roleKeyword) {
                const fQs = FALLBACK_QUESTIONS.filter((fq) => fq.id.toLowerCase().includes(roleKeyword)).map((fq) => ({
                  ...fq,
                  category_id: cat.id,
                }));
                extraFallbacks.push(...fQs);
              }
            }
          });

          const combinedQuestions = [...dbQuestions, ...extraFallbacks];

          const sorted = combinedQuestions.map((q: any) => {
            let opts = optionsList.filter((o: any) => o.question_id === q.id);
            if ((!opts || opts.length === 0) && q.question_type !== 'paragraph') {
              const fallbackMatch = FALLBACK_QUESTIONS.find(
                (fq) => fq.question_text.trim().toLowerCase() === q.question_text.trim().toLowerCase()
              );
              if (fallbackMatch && fallbackMatch.options) {
                opts = fallbackMatch.options;
              }
            }
            return {
              ...q,
              options: (opts || []).sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)),
            };
          });
          setAllQuestions(sorted);
        } else {
          setAllQuestions(FALLBACK_QUESTIONS);
        }
      } catch (err) {
        console.error('Error fetching site configuration:', err);
        setAllQuestions(FALLBACK_QUESTIONS);
      } finally {
        setIsLoadingConfig(false);
      }
    }

    loadConfig();
  }, []);

  // Selected category details
  const selectedCategory = categories.find(
    (c) => c.id === formData.stakeholder_category_id
  );

  // Get matching questions for category
  const getQuestionsForCategory = (catId: string) => {
    if (!catId) return FALLBACK_QUESTIONS.filter((q) => q.id.includes('student'));
    const catObj = categories.find((c) => c.id === catId);
    const catLabel = catObj ? catObj.label.toLowerCase() : '';
    const catSlug = catObj ? catObj.slug.toLowerCase() : '';

    // 1. Direct category_id match
    let matched = allQuestions.filter((q: any) => q.is_active !== false && q.category_id === catId);
    if (matched.length > 0) return matched;

    // 2. Joined category id/slug match
    matched = allQuestions.filter((q: any) => {
      if (q.is_active === false) return false;
      if (q.category && (q.category.id === catId || q.category.slug === catSlug)) return true;
      return false;
    });
    if (matched.length > 0) return matched;

    // 3. Keyword matching against FALLBACK_QUESTIONS
    const roleKeyword = 
      catLabel.includes('student') || catSlug.includes('student') ? 'student' :
      catLabel.includes('faculty') || catSlug.includes('faculty') ? 'faculty' :
      catLabel.includes('alumni') || catSlug.includes('alumni') ? 'alumni' :
      catLabel.includes('employer') || catLabel.includes('industry') || catSlug.includes('employer') ? 'employer' :
      catLabel.includes('parent') || catSlug.includes('parent') ? 'parent' :
      catLabel.includes('management') || catLabel.includes('governing') || catSlug.includes('management') ? 'mgmt' :
      catLabel.includes('society') || catLabel.includes('community') || catSlug.includes('society') ? 'soc' :
      catLabel.includes('academic') || catSlug.includes('academic') ? 'academic' :
      catLabel.includes('technical') || catLabel.includes('staff') || catSlug.includes('staff') ? 'techstaff' :
      '';

    if (roleKeyword) {
      return FALLBACK_QUESTIONS.filter((q) => q.id.toLowerCase().includes(roleKeyword));
    }

    return [];
  };

  const activeCategoryQuestions = getQuestionsForCategory(formData.stakeholder_category_id);

  // Deterministic 4-step wizard structure
  const totalWizardSteps = 4;

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
    // ALWAYS move to Step 3 (Part D: Role-Specific Questions)
    setStep(3);
  };

  const handleQuestionsSubmit = (answers: Record<string, any>) => {
    setFormData((prev) => ({
      ...prev,
      stakeholder_answers: answers,
    }));
    // Move to Step 4 (Part E: Additional Suggestions)
    setStep(4);
  };

  const handleFinalSubmit = async (finalSuggestion: string) => {
    setIsSubmitting(true);
    setSubmitError(null);

    // Format answers for RPC payload
    const formattedAnswers: Record<string, { text?: string; selected?: any }> = {};
    Object.entries(formData.stakeholder_answers).forEach(([qId, val]) => {
      if (typeof val === 'string') {
        formattedAnswers[qId] = { text: val };
      } else {
        formattedAnswers[qId] = { selected: val };
      }
    });

    const payload = {
      name: formData.name || null,
      phone: formData.phone || null,
      email: formData.email || null,
      stakeholder_category_id: formData.stakeholder_category_id,
      priority_ratings: formData.priority_ratings,
      mission_selections: formData.mission_commitments,
      stakeholder_answers: formattedAnswers,
      suggestion: finalSuggestion || null,
    };

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok || resData.error) {
        throw new Error(resData.error || 'Server failed to process submission.');
      }

      setFormData((prev) => ({ ...prev, suggestion: finalSuggestion }));
      setStep(5);
    } catch (err: any) {
      console.error('Error submitting feedback response:', err);
      setSubmitError(
        err.message || 'We could not submit your response — please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  <span>Step {step} of {totalWizardSteps}</span>
                  <span>
                    {step === 1 && 'Part A & B: Details & Priorities'}
                    {step === 2 && 'Part C: Mission Commitments'}
                    {step === 3 && 'Part D: Role-Specific Questions'}
                    {step === 4 && 'Part E: Additional Recommendations'}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${(step / totalWizardSteps) * 100}%`,
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
                onBack={() => setStep(3)}
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
