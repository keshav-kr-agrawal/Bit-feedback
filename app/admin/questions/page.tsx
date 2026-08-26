'use client';

import React, { useEffect, useState } from 'react';
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
  ListPlus,
} from 'lucide-react';

export default function AdminQuestionsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<StakeholderCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [questions, setQuestions] = useState<StakeholderQuestion[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<StakeholderQuestion | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formText, setFormText] = useState('');
  const [formType, setFormType] = useState<QuestionType>('checkboxes');
  const [formOptions, setFormOptions] = useState<string[]>([]);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [formRequired, setFormRequired] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState(1);
  const [formActive, setFormActive] = useState(true);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const { data: cats, error: catErr } = await supabase
        .from('stakeholder_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (catErr) throw catErr;
      if (cats && cats.length > 0) {
        setCategories(cats);
        setSelectedCategoryId(cats[0].id);
      }
    } catch (err: any) {
      console.error('Error loading categories for question builder:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionsForCategory = async (catId: string) => {
    if (!catId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stakeholder_questions')
        .select('*, options:stakeholder_question_options(*)')
        .eq('category_id', catId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (data) setQuestions(data);
    } catch (err: any) {
      console.error('Error loading questions for category:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCategoryId) {
      loadQuestionsForCategory(selectedCategoryId);
    }
  }, [selectedCategoryId]);

  const openCreateModal = () => {
    setEditingQuestion(null);
    setFormText('');
    setFormType('checkboxes');
    setFormOptions([]);
    setNewOptionInput('');
    setFormRequired(true);
    setFormSortOrder(questions.length + 1);
    setFormActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (q: StakeholderQuestion) => {
    setEditingQuestion(q);
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
            category_id: selectedCategoryId,
            question_text: formText,
            question_type: formType,
            is_required: formRequired,
            sort_order: formSortOrder,
            is_active: formActive,
          })
          .eq('id', editingQuestion.id);

        if (error) throw error;
        // Delete existing options
        await supabase.from('stakeholder_question_options').delete().eq('question_id', editingQuestion.id);
      } else {
        const { data: inserted, error } = await supabase
          .from('stakeholder_questions')
          .insert([
            {
              category_id: selectedCategoryId,
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

      // Insert new options into stakeholder_question_options
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

      await loadQuestionsForCategory(selectedCategoryId);
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

      setQuestions((prev) =>
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
        alert('Cannot delete question. Soft-disabling instead.');
        await supabase
          .from('stakeholder_questions')
          .update({ is_active: false })
          .eq('id', q.id);
      }

      await loadQuestionsForCategory(selectedCategoryId);
    } catch (err: any) {
      alert(`Error deleting question: ${err.message}`);
    }
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Stakeholder Question Builder
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Configure dynamic, category-specific question sets for Part D of the feedback wizard.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            disabled={!selectedCategoryId}
            className="px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors self-start sm:self-auto disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>

        {/* Category Picker Selector */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-800 flex-shrink-0" />
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-600">
                Select Stakeholder Category to Configure
              </label>
              <p className="text-xs text-slate-400">
                Currently editing questions for: <strong>{selectedCategory?.label}</strong> ({questions.length} questions configured)
              </p>
            </div>
          </div>

          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-semibold focus:bg-white focus:outline-none focus:border-slate-500"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label} ({cat.slug})
              </option>
            ))}
          </select>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
              <p className="text-sm font-medium">Loading Category Questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm space-y-3">
              <p>No questions configured for category <strong>{selectedCategory?.label}</strong> yet.</p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-800 text-white text-xs font-semibold rounded-xl hover:bg-blue-900 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Question</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="space-y-1.5 flex-1">
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

        {/* Modal: Add / Edit Question */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingQuestion ? 'Edit Question' : 'Add Category Question'}
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
                        className="px-3 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-lg text-xs font-semibold"
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
                        className="rounded border-slate-300 text-blue-800 focus:ring-blue-500 h-4 w-4"
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
                        className="rounded border-slate-300 text-blue-800 focus:ring-blue-500 h-4 w-4"
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
                    className="px-5 py-2 rounded-xl bg-blue-800 hover:bg-blue-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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
