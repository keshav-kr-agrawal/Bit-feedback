'use client';

import React, { useEffect, useState } from 'react';
import AdminNav from '../components/AdminNav';
import { createClient } from '@/lib/supabase/client';
import { StakeholderCategory, StakeholderQuestion, QuestionType } from '@/lib/types';
import { FALLBACK_CATEGORIES, FALLBACK_QUESTIONS } from '@/lib/sampleData';
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Power,
  Users,
  Eye,
  Filter,
  Search,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export default function AdminQuestionsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<StakeholderCategory[]>(FALLBACK_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [allQuestionsList, setAllQuestionsList] = useState<StakeholderQuestion[]>([]);
  
  // View Mode: 'all' = All Current Questions Overview, 'category' = Manage Single Category
  const [viewMode, setViewMode] = useState<'all' | 'category'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<StakeholderQuestion | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formText, setFormText] = useState('');
  const [formType, setFormType] = useState<QuestionType>('checkboxes');
  const [formOptions, setFormOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [formRequired, setFormRequired] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState(1);
  const [formActive, setFormActive] = useState(true);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch Categories
      const { data: catData, error: catErr } = await supabase
        .from('stakeholder_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      const loadedCats = (catData && catData.length > 0) ? catData : FALLBACK_CATEGORIES;
      setCategories(loadedCats);
      if (loadedCats.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(loadedCats[0].id);
      }

      // Fetch Questions & Options
      const [questionsRes, optionsRes] = await Promise.all([
        supabase
          .from('stakeholder_questions')
          .select('*')
          .order('sort_order', { ascending: true }),
        supabase
          .from('stakeholder_question_options')
          .select('*')
          .order('sort_order', { ascending: true }),
      ]);

      if (questionsRes.data && questionsRes.data.length > 0) {
        const optionsList = optionsRes.data || [];
        const dbQuestions = questionsRes.data;

        // Check if any active category has no questions in dbQuestions
        const extraFallbacks: any[] = [];
        loadedCats.forEach((cat: any) => {
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

        const combinedList = [...dbQuestions, ...extraFallbacks];

        const combined = combinedList.map((q: any) => {
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
        setAllQuestionsList(combined);
      } else {
        setAllQuestionsList(FALLBACK_QUESTIONS);
      }
    } catch (err: any) {
      console.error('Error fetching admin questions:', err);
      setAllQuestionsList(FALLBACK_QUESTIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const openCreateModal = (catId?: string) => {
    const targetCatId = catId || selectedCategoryId || (categories[0]?.id ?? '');
    setEditingQuestion(null);
    setFormCategoryId(targetCatId);
    setFormText('');
    setFormType('checkboxes');
    setFormOptions([]);
    setNewOptionInput('');
    setFormRequired(true);
    setFormSortOrder(allQuestionsList.filter((q) => q.category_id === targetCatId).length + 1);
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (q: StakeholderQuestion) => {
    setEditingQuestion(q);
    setFormCategoryId(q.category_id);
    setFormText(q.question_text);
    setFormType(q.question_type);
    const loadedOpts = Array.isArray(q.options)
      ? q.options.map((o: any) => (typeof o === 'string' ? o : o.option_label))
      : [];
    setFormOptions(loadedOpts);
    setNewOptionInput('');
    setFormRequired(q.is_required);
    setFormSortOrder(q.sort_order);
    setFormActive(q.is_active);
    setIsModalOpen(true);
  };

  const addOption = () => {
    const trimmed = newOptionInput.trim();
    if (trimmed && !formOptions.includes(trimmed)) {
      setFormOptions([...formOptions, trimmed]);
      setNewOptionInput('');
    }
  };

  const removeOption = (idx: number) => {
    setFormOptions(formOptions.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) {
      alert('Please enter question text.');
      return;
    }

    const requiresOptions =
      formType === 'checkboxes' ||
      formType === 'multiple_choice' ||
      formType === 'multiple_choice_grid';

    if (requiresOptions && formOptions.length === 0) {
      alert('Please add at least one option for this question type.');
      return;
    }

    setSaving(true);

    try {
      let qId = editingQuestion?.id;

      if (editingQuestion) {
        const { error } = await supabase
          .from('stakeholder_questions')
          .update({
            category_id: formCategoryId,
            question_text: formText,
            question_type: formType,
            is_required: formRequired,
            sort_order: formSortOrder,
            is_active: formActive,
          })
          .eq('id', editingQuestion.id);

        if (error) throw error;
        await supabase.from('stakeholder_question_options').delete().eq('question_id', editingQuestion.id);
      } else {
        const { data: inserted, error } = await supabase
          .from('stakeholder_questions')
          .insert([
            {
              category_id: formCategoryId,
              question_text: formText,
              question_type: formType,
              is_required: formRequired,
              sort_order: formSortOrder,
              is_active: formActive,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        qId = inserted.id;
      }

      if (requiresOptions && qId && formOptions.length > 0) {
        const optionRecords = formOptions.map((optLabel, idx) => ({
          question_id: qId,
          option_label: optLabel,
          option_group: 'option',
          sort_order: idx + 1,
          is_active: true,
        }));

        await supabase.from('stakeholder_question_options').insert(optionRecords);
      }

      await fetchAllData();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Failed to save question: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (q: StakeholderQuestion) => {
    try {
      const { error } = await supabase
        .from('stakeholder_questions')
        .update({ is_active: !q.is_active })
        .eq('id', q.id);

      if (error) throw error;

      setAllQuestionsList((prev) =>
        prev.map((item) => (item.id === q.id ? { ...item, is_active: !q.is_active } : item))
      );
    } catch (err: any) {
      alert(`Failed to toggle question status: ${err.message}`);
    }
  };

  const handleDelete = async (q: StakeholderQuestion) => {
    if (!confirm(`Are you sure you want to delete question "${q.question_text}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('stakeholder_questions')
        .delete()
        .eq('id', q.id);

      if (error) {
        await supabase
          .from('stakeholder_questions')
          .update({ is_active: false })
          .eq('id', q.id);
      }

      await fetchAllData();
    } catch (err: any) {
      alert(`Error deleting question: ${err.message}`);
    }
  };

  // Helper to resolve category label/slug for a question
  const getCategoryForQuestion = (q: StakeholderQuestion) => {
    return categories.find((c) => c.id === q.category_id) || {
      id: q.category_id,
      label: 'General Stakeholder',
      slug: 'general',
      sort_order: 99,
      is_active: true,
    };
  };

  // Filtered questions based on search and selected view
  const filteredQuestions = allQuestionsList.filter((q) => {
    if (viewMode === 'category' && selectedCategoryId && q.category_id !== selectedCategoryId) {
      return false;
    }
    if (searchQuery.trim()) {
      const qTextMatch = q.question_text.toLowerCase().includes(searchQuery.toLowerCase());
      const cat = getCategoryForQuestion(q);
      const catMatch = cat.label.toLowerCase().includes(searchQuery.toLowerCase());
      return qTextMatch || catMatch;
    }
    return true;
  });

  // Group questions by category
  const questionsByCategoryMap = categories.map((cat) => {
    const questionsInCat = filteredQuestions.filter((q) => q.category_id === cat.id);
    return {
      category: cat,
      questions: questionsInCat,
    };
  });

  // Also catch any orphan questions that don't match loaded categories
  const orphanQuestions = filteredQuestions.filter(
    (q) => !categories.some((c) => c.id === q.category_id)
  );

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider mb-1">
              <HelpCircle className="w-4 h-4" />
              <span>Feedback CMS • Question Console</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              All Current Questions Overview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View all active stakeholder feedback questions across categories without having to answer them.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => openCreateModal()}
              className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Question</span>
            </button>
          </div>
        </div>

        {/* Navigation & Controls Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setViewMode('all')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                viewMode === 'all'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-4 h-4 text-blue-800" />
              <span>All Questions Overview ({allQuestionsList.length})</span>
            </button>

            <button
              onClick={() => setViewMode('category')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                viewMode === 'category'
                  ? 'bg-white text-blue-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filter by Category</span>
            </button>
          </div>

          {/* Search / Category Filter Controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1 max-w-md">
            {viewMode === 'category' && (
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-semibold focus:bg-white focus:outline-none focus:border-slate-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label} ({cat.slug})
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions or categories..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-xs font-medium focus:bg-white focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Questions Content Section */}
        {loading ? (
          <div className="bg-white rounded-2xl p-16 border border-slate-200 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
            <p className="text-sm font-medium">Loading All Current Questions...</p>
          </div>
        ) : viewMode === 'all' ? (
          /* ALL QUESTIONS OVERVIEW (GROUPED BY CATEGORY) */
          <div className="space-y-8">
            {questionsByCategoryMap.map(({ category, questions }) => {
              if (searchQuery.trim() && questions.length === 0) return null;

              return (
                <div
                  key={category.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Category Header Bar */}
                  <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base tracking-tight text-white">
                          {category.label}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Slug: <code className="text-blue-300 font-mono">{category.slug}</code> • {questions.length} questions configured
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openCreateModal(category.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  {/* Category Questions List */}
                  {questions.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No questions configured for {category.label} yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {questions.map((q) => (
                        <div key={q.id} className="p-6 hover:bg-slate-50/70 transition-colors space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                  #{q.sort_order}
                                </span>
                                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                                  Type: {q.question_type}
                                </span>
                                {q.is_required ? (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                                    Mandatory
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                    Optional
                                  </span>
                                )}
                              </div>

                              <h4 className="text-base font-bold text-slate-900 leading-snug">
                                {q.question_text}
                              </h4>
                            </div>

                            {/* Status & Action Buttons */}
                            <div className="flex items-center gap-2 self-start sm:self-center">
                              <button
                                onClick={() => toggleActive(q)}
                                className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  q.is_active
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                <Power className="w-3 h-3" />
                                <span>{q.is_active ? 'Active' : 'Disabled'}</span>
                              </button>

                              <button
                                onClick={() => openEditModal(q)}
                                className="p-2 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 transition-colors"
                                title="Edit Question"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDelete(q)}
                                className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                title="Delete Question"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Options Preview Box (Read-only without answering) */}
                          {Array.isArray(q.options) && q.options.length > 0 ? (
                            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <span>Configured Choices / Options ({q.options.length})</span>
                                <span>Preview Only</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {q.options.map((opt: any, idx: number) => {
                                  const lbl = typeof opt === 'string' ? opt : opt.option_label;
                                  const grp = typeof opt === 'object' ? opt.option_group : 'option';
                                  return (
                                    <span
                                      key={idx}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                        grp === 'row'
                                          ? 'bg-amber-50 text-amber-900 border-amber-200'
                                          : grp === 'column'
                                          ? 'bg-purple-50 text-purple-900 border-purple-200'
                                          : 'bg-white text-slate-800 border-slate-200 shadow-2xs'
                                      }`}
                                    >
                                      {grp === 'row' ? 'Row: ' : grp === 'column' ? 'Scale: ' : ''}{lbl}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          ) : q.question_type === 'paragraph' ? (
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs font-medium text-slate-500 italic">
                              Free-text paragraph response area (No fixed options required)
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Orphan questions fallback */}
            {orphanQuestions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-800 text-white px-6 py-4">
                  <h3 className="font-bold text-base text-white">Other System Questions</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {orphanQuestions.map((q) => (
                    <div key={q.id} className="p-6 space-y-2">
                      <h4 className="font-bold text-slate-900">{q.question_text}</h4>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SINGLE CATEGORY MANAGEMENT VIEW */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Category: {categories.find((c) => c.id === selectedCategoryId)?.label}
                </h3>
                <p className="text-xs text-slate-500">
                  Showing questions configured for this specific category.
                </p>
              </div>

              <button
                onClick={() => openCreateModal(selectedCategoryId)}
                className="px-3.5 py-2 bg-blue-900 text-white text-xs font-semibold rounded-xl hover:bg-blue-950 transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            {filteredQuestions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm space-y-3">
                <p>No questions configured for this category yet.</p>
                <button
                  onClick={() => openCreateModal(selectedCategoryId)}
                  className="px-4 py-2 bg-blue-900 text-white text-xs font-semibold rounded-xl hover:bg-blue-950 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Question</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          #{q.sort_order}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                          {q.question_type}
                        </span>
                        {q.is_required && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-700">
                            Required
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-semibold text-slate-900 leading-snug">
                        {q.question_text}
                      </h4>

                      {Array.isArray(q.options) && q.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {q.options.map((opt: any, idx: number) => {
                            const lbl = typeof opt === 'string' ? opt : opt.option_label;
                            return (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                              >
                                {lbl}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-center">
                      <button
                        onClick={() => toggleActive(q)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                          q.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{q.is_active ? 'Active' : 'Disabled'}</span>
                      </button>

                      <button
                        onClick={() => openEditModal(q)}
                        className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        title="Edit Question"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(q)}
                        className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Add / Edit Question */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingQuestion ? 'Edit Question' : 'Add Question'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Stakeholder Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label} ({cat.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Question Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    placeholder="e.g. Which areas should the Institute strengthen?"
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Question Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as QuestionType)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500"
                  >
                    <option value="checkboxes">Checkboxes (Multi-select)</option>
                    <option value="paragraph">Paragraph (Textarea input)</option>
                    <option value="multiple_choice">Multiple Choice (Radio buttons)</option>
                    <option value="multiple_choice_grid">
                      Multiple Choice Grid (1-5 Mini rating per row)
                    </option>
                    <option value="rating_scale">Rating Scale (1-5 Scale)</option>
                  </select>
                </div>

                {/* Options List Manager (for checkboxes, multiple_choice, grid) */}
                {(formType === 'checkboxes' ||
                  formType === 'multiple_choice' ||
                  formType === 'multiple_choice_grid') && (
                  <div className="space-y-2 border border-slate-200 rounded-xl p-3.5 bg-slate-50">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                      Question Options / Grid Items <span className="text-red-500">*</span>
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newOptionInput}
                        onChange={(e) => setNewOptionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addOption();
                          }
                        }}
                        placeholder="Type option and click Add..."
                        className="flex-1 p-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                      />
                      <button
                        type="button"
                        onClick={addOption}
                        className="px-3 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-semibold"
                      >
                        Add
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pt-1">
                      {formOptions.map((opt, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-800"
                        >
                          <span>{opt}</span>
                          <button
                            type="button"
                            onClick={() => removeOption(idx)}
                            className="text-slate-400 hover:text-red-600 p-1"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formSortOrder}
                      onChange={(e) => setFormSortOrder(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Required
                    </label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formRequired}
                        onChange={(e) => setFormRequired(e.target.checked)}
                        className="rounded border-slate-300 text-blue-900 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-xs font-semibold text-slate-800">Mandatory</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Status
                    </label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formActive}
                        onChange={(e) => setFormActive(e.target.checked)}
                        className="rounded border-slate-300 text-blue-900 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-xs font-semibold text-slate-800">Enabled</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Question</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
