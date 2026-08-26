'use client';

import React, { useEffect, useState } from 'react';
import AdminNav from '../components/AdminNav';
import { createClient } from '@/lib/supabase/client';
import { PriorityItem } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { priorityItemSchema } from '@/lib/validation';
import { z } from 'zod';
import { Star, Plus, Edit2, Trash2, X, Loader2, Power } from 'lucide-react';

type FormValues = z.infer<typeof priorityItemSchema>;

export default function AdminPrioritiesPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<PriorityItem[]>([]);
  const [editingItem, setEditingItem] = useState<PriorityItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(priorityItemSchema),
    defaultValues: {
      label: '',
      sort_order: 0,
      is_active: true,
    },
  });

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('priority_items')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (data) setItems(data);
    } catch (err: any) {
      console.error('Error loading priority items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    reset({
      label: '',
      sort_order: items.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: PriorityItem) => {
    setEditingItem(item);
    reset({
      label: item.label,
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (values: FormValues) => {
    setSaving(true);
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('priority_items')
          .update(values)
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('priority_items').insert([values]);

        if (error) throw error;
      }

      await loadItems();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Failed to save priority item: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: PriorityItem) => {
    try {
      const { error } = await supabase
        .from('priority_items')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_active: !item.is_active } : i))
      );
    } catch (err: any) {
      alert(`Failed to toggle priority item status: ${err.message}`);
    }
  };

  const handleDelete = async (item: PriorityItem) => {
    if (!confirm(`Are you sure you want to delete priority item "${item.label}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('priority_items')
        .delete()
        .eq('id', item.id);

      if (error) {
        alert(
          'Cannot delete this item as existing responses reference it. Soft-disabling instead.'
        );
        await supabase
          .from('priority_items')
          .update({ is_active: false })
          .eq('id', item.id);
      }

      await loadItems();
    } catch (err: any) {
      alert(`Error deleting priority item: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Part B: Institutional Priority Items
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage the rating items evaluated on a 1–5 scale by all respondents in Part B.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Priority Item</span>
          </button>
        </div>

        {/* Priority Items Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
              <p className="text-sm font-medium">Loading Priority Items...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-16 text-center">Order</th>
                    <th className="py-3.5 px-4">Priority Item Label</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-xs">
                        {item.sort_order}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {item.label}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleActive(item)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 mx-auto ${
                            item.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{item.is_active ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            title="Edit Priority Item"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                            title="Delete Priority Item"
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

        {/* Modal: Add/Edit Priority Item */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingItem ? 'Edit Priority Item' : 'Add Priority Item'}
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
                    Priority Item Wording <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Research and innovation"
                    {...register('label')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-slate-500"
                  />
                  {errors.label && (
                    <p className="text-xs text-red-600 mt-1">{errors.label.message}</p>
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
                      <span>Save Item</span>
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
