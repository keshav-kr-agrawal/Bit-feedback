'use client';

import React, { useEffect, useState } from 'react';
import AdminNav from '../components/AdminNav';
import { createClient } from '@/lib/supabase/client';
import { MissionOption } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { missionOptionSchema } from '@/lib/validation';
import { z } from 'zod';
import { CheckSquare, Plus, Edit2, Trash2, X, Loader2, Power } from 'lucide-react';

type FormValues = z.infer<typeof missionOptionSchema>;

export default function AdminMissionOptionsPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<MissionOption[]>([]);
  const [editingOption, setEditingOption] = useState<MissionOption | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(missionOptionSchema),
    defaultValues: {
      label: '',
      sort_order: 0,
      is_active: true,
    },
  });

  const loadOptions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mission_options')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (data) setOptions(data);
    } catch (err: any) {
      console.error('Error loading mission options:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const openCreateModal = () => {
    setEditingOption(null);
    reset({
      label: '',
      sort_order: options.length + 1,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (opt: MissionOption) => {
    setEditingOption(opt);
    reset({
      label: opt.label,
      sort_order: opt.sort_order,
      is_active: opt.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (values: FormValues) => {
    setSaving(true);
    try {
      if (editingOption) {
        const { error } = await supabase
          .from('mission_options')
          .update(values)
          .eq('id', editingOption.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('mission_options').insert([values]);

        if (error) throw error;
      }

      await loadOptions();
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Failed to save mission option: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (opt: MissionOption) => {
    try {
      const { error } = await supabase
        .from('mission_options')
        .update({ is_active: !opt.is_active })
        .eq('id', opt.id);

      if (error) throw error;

      setOptions((prev) =>
        prev.map((o) => (o.id === opt.id ? { ...o, is_active: !opt.is_active } : o))
      );
    } catch (err: any) {
      alert(`Failed to toggle mission option status: ${err.message}`);
    }
  };

  const handleDelete = async (opt: MissionOption) => {
    if (!confirm(`Are you sure you want to delete mission option "${opt.label}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('mission_options')
        .delete()
        .eq('id', opt.id);

      if (error) {
        alert(
          'Cannot delete option as existing responses reference it. Soft-disabling instead.'
        );
        await supabase
          .from('mission_options')
          .update({ is_active: false })
          .eq('id', opt.id);
      }

      await loadOptions();
    } catch (err: any) {
      alert(`Error deleting option: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Part C: Mission Commitment Options
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage the checkbox options presented in Part C (respondents pick exactly 3 commitments).
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Mission Option</span>
          </button>
        </div>

        {/* Mission Options Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
              <p className="text-sm font-medium">Loading Mission Commitment Options...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-16 text-center">Order</th>
                    <th className="py-3.5 px-4">Mission Commitment Wording</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {options.map((opt) => (
                    <tr key={opt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-xs">
                        {opt.sort_order}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {opt.label}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleActive(opt)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 mx-auto ${
                            opt.is_active
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{opt.is_active ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(opt)}
                            className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            title="Edit Mission Option"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(opt)}
                            className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                            title="Delete Mission Option"
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

        {/* Modal: Add/Edit Mission Option */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingOption ? 'Edit Mission Option' : 'Add Mission Option'}
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
                    Option Wording <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Technically competent graduates"
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
                      <span>Save Option</span>
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
