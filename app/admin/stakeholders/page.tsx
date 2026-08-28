'use client';

import React, { useEffect, useState } from 'react';
import AdminNav from '../components/AdminNav';
import { createClient } from '@/lib/supabase/client';
import { StakeholderCategory } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stakeholderCategorySchema } from '@/lib/validation';
import { z } from 'zod';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  ArrowUpDown,
  Power,
} from 'lucide-react';

type FormValues = z.infer<typeof stakeholderCategorySchema>;

export default function AdminStakeholdersPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<StakeholderCategory[]>([]);
  const [editingCategory, setEditingCategory] = useState<StakeholderCategory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(stakeholderCategorySchema),
    defaultValues: {
      label: '',
      slug: '',
      sort_order: 0,
      is_active: true,
    },
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stakeholder_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (data) {
        const mappedCats = data.map((c: any) =>
          c.label.trim() === 'Staff' || c.slug === 'staff'
            ? { ...c, label: 'Technical Staff', slug: 'technical_staff' }
            : c
        );
        setCategories(mappedCats);
      }
    } catch (err: any) {
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({
      label: '',
      slug: '',
      sort_order: categories.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat: StakeholderCategory) => {
    setEditingCategory(cat);
    reset({
      label: cat.label,
      slug: cat.slug,
      sort_order: cat.sort_order,
      is_active: cat.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (values: FormValues) => {
    setSaving(true);
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('stakeholder_categories')
          .update(values)
          .eq('id', editingCategory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('stakeholder_categories')
          .insert([values]);

        if (error) throw error;
      }

      await loadCategories();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Failed to save stakeholder category: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (cat: StakeholderCategory) => {
    try {
      const { error } = await supabase
        .from('stakeholder_categories')
        .update({ is_active: !cat.is_active })
        .eq('id', cat.id);

      if (error) throw error;

      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: !cat.is_active } : c))
      );
    } catch (err: any) {
      alert(`Failed to toggle category state: ${err.message}`);
    }
  };

  const handleDelete = async (cat: StakeholderCategory) => {
    if (
      !confirm(
        `Are you sure you want to delete "${cat.label}"? If responses exist referencing this category, delete will be blocked by Postgres constraints (soft-disable instead).`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from('stakeholder_categories')
        .delete()
        .eq('id', cat.id);

      if (error) {
        alert(
          `Cannot hard-delete category because responses or questions depend on it. Disabling the category instead.`
        );
        await supabase
          .from('stakeholder_categories')
          .update({ is_active: false })
          .eq('id', cat.id);
      }

      await loadCategories();
    } catch (err: any) {
      alert(`Error deleting category: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Stakeholder Categories (Part A Dropdown)
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Add, edit, reorder, or enable/disable stakeholder roles selectable in Part A.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
              <p className="text-sm font-medium">Loading Stakeholder Categories...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-16 text-center">Order</th>
                    <th className="py-3.5 px-4">Category Label</th>
                    <th className="py-3.5 px-4">Slug Identifier</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-xs">
                        {cat.sort_order}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {cat.label}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                        {cat.slug}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleActive(cat)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 mx-auto ${
                            cat.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{cat.is_active ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Add/Edit Category */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingCategory ? 'Edit Stakeholder Category' : 'Add Stakeholder Category'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Display Label <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Industry Partner / Parent"
                    {...register('label')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500"
                  />
                  {errors.label && (
                    <p className="text-xs text-red-600 mt-1">{errors.label.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                    Slug Identifier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. industry_partner"
                    {...register('slug')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:border-slate-500"
                  />
                  {errors.slug && (
                    <p className="text-xs text-red-600 mt-1">{errors.slug.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      {...register('sort_order', { valueAsNumber: true })}
                      className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1">
                      Status
                    </label>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        {...register('is_active')}
                        className="rounded border-slate-300 text-blue-800 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-sm font-semibold text-slate-800">Enabled</span>
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
                      <span>Save Category</span>
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
