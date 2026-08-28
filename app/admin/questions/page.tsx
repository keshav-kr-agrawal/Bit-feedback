'use client';

import React, { useEffect, useState, useMemo } from 'react';
import AdminNav from '../components/AdminNav';
import { createClient } from '@/lib/supabase/client';
import { StakeholderCategory, StakeholderQuestion, QuestionType } from '@/lib/types';
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Power,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Layers,
  Tag,
  Eye,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface ExtendedQuestion extends StakeholderQuestion {
  category?: {
    id: string;
    label: string;
    slug: string;
  };
}

export default function AdminQuestionsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<StakeholderCategory[]>([]);
  const [allQuestions, setAllQuestions] = useState<ExtendedQuestion[]>([]);

  // Filtering & View state
  const [viewMode, setViewMode] = useState<'all' | 'category'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ExtendedQuestion | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formCategoryId, setFormCategoryId] = useState<string>('');
  const [formText, setFormText] = useState('');
  const [formType, setFormType] = useState<QuestionType>('checkboxes');
  const [formOptions, setFormOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [formRequired, setFormRequired] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState(1);
  const [formActive, setFormActive] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch categories
      const { data: cats, error: catErr } = await supabase
        .from('stakeholder_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (catErr) throw catErr;
      if (cats) {
        setCategories(cats);
        if (cats.length > 0 && !formCategoryId) {
          setFormCategoryId(cats[0].id);
        }
      }

      // 2. Fetch all questions with category and options
      const { data: qData, error: qErr } = await supabase
        .from('stakeholder_questions')
        .select(`
          *,
          category:stakeholder_categories(id, label, slug),
          options:stakeholder_question_options(*)
        `)
        .order('sort_order', { ascending: true });

      if (qErr) {
        // Fallback without join if foreign key alias differs
        const { data: fallbackData } = await supabase
          .from('stakeholder_questions')
          .select('*, options:stakeholder_question_options(*)')
          .order('sort_order', { ascending: true });

        if (fallbackData) {
          const mapWithCat = fallbackData.map((q: any) => ({
            ...q,
            category: cats?.find((c) => c.id === q.category_id),
          }));
          setAllQuestions(mapWithCat);
        }
      } else if (qData) {
        // Attach category object if null
        const enriched = qData.map((q: any) => ({
          ...q,
          category: q.category || cats?.find((c) => c.id === q.category_id),
        }));
        setAllQuestions(enriched);
      }
    } catch (err: any) {
      console.error('Error loading questions data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Questions list logic
  const filteredQuestions = useMemo(() => {
    return allQuestions.filter((q) => {
      // Category Filter
      if (filterCategoryId !== 'all' && q.category_id !== filterCategoryId) {
        return false;
      }
      // Type Filter
      if (filterType !== 'all' && q.question_type !== filterType) {
        return false;
      }
      // Status Filter
      if (filterStatus === 'active' && !q.is_active) return false;
      if (filterStatus === 'disabled' && q.is_active) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const textMatch = q.question_text.toLowerCase().includes(query);
        const catMatch = q.category?.label.toLowerCase().includes(query);
        const optionMatch = Array.isArray(q.options)
          ? q.options.some((o: any) =>
              (typeof o === 'string' ? o : o.option_label).toLowerCase().includes(query)
            )
          : false;
        return textMatch || catMatch || optionMatch;
      }

      return true;
    });
  }, [allQuestions, filterCategoryId, filterType, filterStatus, searchQuery]);

  // Statistics
  const totalQuestionsCount = allQuestions.length;
  const activeQuestionsCount = allQuestions.filter((q) => q.is_active).length;
  const categoriesCount = categories.length;
  const requiredQuestionsCount = allQuestions.filter((q) => q.is_required).length;

  const openCreateModal = () => {
    setEditingQuestion(null);
    setFormCategoryId(filterCategoryId !== 'all' ? filterCategoryId : categories[0]?.id || '');
    setFormText('');
    setFormType('checkboxes');
    setFormOptions([]);
    setNewOptionInput('');
    setFormRequired(true);
    setFormSortOrder(allQuestions.length + 1);
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (q: ExtendedQuestion) => {
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
    if (!formCategoryId) {
      alert('Please select a stakeholder category.');
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

      await loadData();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Failed to save question: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (q: ExtendedQuestion) => {
    try {
      const { error } = await supabase
        .from('stakeholder_questions')
        .update({ is_active: !q.is_active })
        .eq('id', q.id);

      if (error) throw error;

      setAllQuestions((prev) =>
        prev.map((item) => (item.id === q.id ? { ...item, is_active: !q.is_active } : item))
      );
    } catch (err: any) {
      alert(`Failed to toggle question status: ${err.message}`);
    }
  };

  const handleDelete = async (q: ExtendedQuestion) => {
    if (!confirm(`Are you sure you want to delete question: "${q.question_text}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('stakeholder_questions')
        .delete()
        .eq('id', q.id);

      if (error) {
        // Soft disable if foreign key constraints exist
        await supabase
          .from('stakeholder_questions')
          .update({ is_active: false })
          .eq('id', q.id);
      }

      await loadData();
    } catch (err: any) {
      alert(`Error deleting question: ${err.message}`);
    }
  };

  // Helper for Category badge colors
  const getCategoryBadgeClass = (slug?: string) => {
    switch (slug) {
      case 'student':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'faculty':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'employer':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'alumni':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'parent':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'management':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
              <HelpCircle className="w-4 h-4 text-blue-900" />
              <span>Bangalore Institute of Technology — Admin Portal</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Current Questions Console
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage and view all current stakeholder feedback questions configured across all categories.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-5 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all hover:shadow self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Question</span>
          </button>
        </div>

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Total Questions
            </span>
            <div className="text-2xl font-bold text-slate-900 flex items-center justify-between">
              <span>{totalQuestionsCount}</span>
              <Layers className="w-5 h-5 text-blue-600 opacity-80" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Active Questions
            </span>
            <div className="text-2xl font-bold text-emerald-700 flex items-center justify-between">
              <span>{activeQuestionsCount}</span>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 opacity-80" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Categories Configured
            </span>
            <div className="text-2xl font-bold text-indigo-700 flex items-center justify-between">
              <span>{categoriesCount}</span>
              <Users className="w-5 h-5 text-indigo-600 opacity-80" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Mandatory Questions
            </span>
            <div className="text-2xl font-bold text-amber-700 flex items-center justify-between">
              <span>{requiredQuestionsCount}</span>
              <Tag className="w-5 h-5 text-amber-600 opacity-80" />
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions by text, category, or options..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={filterCategoryId}
                  onChange={(e) => setFilterCategoryId(e.target.value)}
                  className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories ({categories.length})</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">All Question Types</option>
                  <option value="checkboxes">Checkboxes</option>
                  <option value="paragraph">Paragraph</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="multiple_choice_grid">Multiple Choice Grid</option>
                  <option value="rating_scale">Rating Scale</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Power className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="disabled">Disabled Only</option>
                </select>
              </div>

              {(filterCategoryId !== 'all' ||
                filterType !== 'all' ||
                filterStatus !== 'all' ||
                searchQuery !== '') && (
                <button
                  onClick={() => {
                    setFilterCategoryId('all');
                    setFilterType('all');
                    setFilterStatus('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <span>
              Showing <strong>{filteredQuestions.length}</strong> of <strong>{allQuestions.length}</strong> questions
            </span>

            {filterCategoryId !== 'all' && (
              <span className="text-blue-900 font-semibold">
                Category Filter: {categories.find((c) => c.id === filterCategoryId)?.label}
              </span>
            )}
          </div>
        </div>

        {/* Questions Display Table / List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
              <p className="text-sm font-medium">Loading All Current Questions...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No questions found matching your criteria.</p>
              <p className="text-xs text-slate-400">
                Try adjusting your search keywords or resetting filters.
              </p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-900 text-white text-xs font-semibold rounded-xl hover:bg-blue-950 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredQuestions.map((q) => {
                const catLabel = q.category?.label || 'General Category';
                const catSlug = q.category?.slug;
                const optionsList = Array.isArray(q.options) ? q.options : [];

                return (
                  <div
                    key={q.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-5 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      {/* Top Metadata Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          #{q.sort_order}
                        </span>

                        {/* Stakeholder Category Badge */}
                        <span
                          className={`text-xs font-bold tracking-tight px-3 py-0.5 rounded-full border ${getCategoryBadgeClass(
                            catSlug
                          )}`}
                        >
                          {catLabel}
                        </span>

                        {/* Question Type Badge */}
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          {q.question_type.replace(/_/g, ' ')}
                        </span>

                        {/* Required Badge */}
                        {q.is_required ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Optional
                          </span>
                        )}
                      </div>

                      {/* Question Text */}
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {q.question_text}
                      </h3>

                      {/* Options / Grid Preview */}
                      {optionsList.length > 0 && (
                        <div className="pt-1.5 space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                            Configured Options ({optionsList.length}):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {optionsList.map((opt: any, idx: number) => {
                              const lbl = typeof opt === 'string' ? opt : opt.option_label;
                              const grp = typeof opt === 'object' ? opt.option_group : 'option';
                              return (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80 flex items-center gap-1"
                                >
                                  {grp && grp !== 'option' && (
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                      [{grp}]
                                    </span>
                                  )}
                                  <span>{lbl}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2.5 self-start lg:self-center flex-shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 w-full lg:w-auto justify-end">
                      <button
                        onClick={() => toggleActive(q)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          q.is_active
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{q.is_active ? 'Active' : 'Disabled'}</span>
                      </button>

                      <button
                        onClick={() => openEditModal(q)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 hover:bg-blue-100 font-semibold text-xs transition-colors flex items-center gap-1.5 border border-blue-200"
                        title="Edit Question"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleDelete(q)}
                        className="p-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors border border-red-200"
                        title="Delete Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add / Edit Question Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingQuestion ? 'Edit Question' : 'Add Question'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bangalore Institute of Technology — Feedback Configuration
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Stakeholder Category Choice */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Stakeholder Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:border-slate-500"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label} ({cat.slug})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Question Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    placeholder="e.g. Which strategic areas should the Institute emphasize in the coming years?"
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500"
                  />
                </div>

                {/* Question Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Question Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as QuestionType)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:border-slate-500"
                  >
                    <option value="checkboxes">Checkboxes (Multi-select)</option>
                    <option value="paragraph">Paragraph (Textarea input)</option>
                    <option value="multiple_choice">Multiple Choice (Radio buttons)</option>
                    <option value="multiple_choice_grid">
                      Multiple Choice Grid (Rating matrix per row)
                    </option>
                    <option value="rating_scale">Rating Scale (1-5 Scale)</option>
                  </select>
                </div>

                {/* Options List Manager */}
                {(formType === 'checkboxes' ||
                  formType === 'multiple_choice' ||
                  formType === 'multiple_choice_grid') && (
                  <div className="space-y-2 border border-slate-200 rounded-xl p-3.5 bg-slate-50">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
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
                        placeholder="Type option label and click Add..."
                        className="flex-1 p-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white"
                      />
                      <button
                        type="button"
                        onClick={addOption}
                        className="px-3.5 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-xs font-bold"
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
                    className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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
