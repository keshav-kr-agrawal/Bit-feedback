'use client';

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  Table as TableIcon,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Mail,
  Phone,
} from 'lucide-react';
import { StakeholderCategory, FeedbackResponse } from '@/lib/types';

interface PartAStakeholderVisualizerProps {
  categories: StakeholderCategory[];
  responses: FeedbackResponse[];
  loading?: boolean;
  onRefresh?: () => void;
  lastUpdated?: Date | null;
}

const PALETTE = [
  '#1F4E79', // BIT Navy
  '#059669', // Emerald
  '#2563EB', // Royal Blue
  '#D97706', // Amber
  '#7C3AED', // Purple
  '#DB2777', // Pink
  '#0284C7', // Sky Blue
  '#475569', // Slate
  '#EA580C', // Orange
  '#0D9488', // Teal
];

export default function PartAStakeholderVisualizer({
  categories,
  responses,
  loading = false,
  onRefresh,
  lastUpdated,
}: PartAStakeholderVisualizerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'distribution' | 'ranking' | 'matrix'>('distribution');

  const totalResponses = responses.length;

  // Category stats
  const categoryStats = useMemo(() => {
    return categories.map((cat, index) => {
      const catResponses = responses.filter((r) => r.stakeholder_category_id === cat.id);
      const count = catResponses.length;
      const percentage = totalResponses > 0 ? Number(((count / totalResponses) * 100).toFixed(1)) : 0;
      const withEmail = catResponses.filter((r) => r.email && r.email.trim().length > 0).length;
      const withPhone = catResponses.filter((r) => r.phone && r.phone.trim().length > 0).length;

      return {
        id: cat.id,
        label: cat.label,
        slug: cat.slug,
        count,
        percentage,
        withEmail,
        withPhone,
        color: PALETTE[index % PALETTE.length],
      };
    });
  }, [categories, responses, totalResponses]);

  // Sort descending by count
  const sortedStats = useMemo(() => {
    return [...categoryStats].sort((a, b) => b.count - a.count);
  }, [categoryStats]);

  const topCategory = sortedStats[0];
  const engagedCategoriesCount = sortedStats.filter((c) => c.count > 0).length;

  const totalWithEmail = useMemo(() => {
    return responses.filter((r) => r.email && r.email.trim().length > 0).length;
  }, [responses]);

  const emailRate = totalResponses > 0 ? Math.round((totalWithEmail / totalResponses) * 100) : 0;

  // Chart data for Pie
  const pieChartData = useMemo(() => {
    return sortedStats
      .filter((c) => c.count > 0)
      .map((c) => ({
        name: c.label,
        value: c.count,
        color: c.color,
        percentage: c.percentage,
      }));
  }, [sortedStats]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 px-5 py-4 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-inner">
              <Users className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded border border-blue-400/30">
                  Part A Analytics
                </span>
                <span className="text-white/40">•</span>
                <span className="text-xs text-blue-100 font-medium">
                  Stakeholder Engagement & Demographic Share
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Real-Time Stakeholder Category Breakdown
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Live Indicator */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-semibold"
              title={
                lastUpdated
                  ? `Last synchronized with database at ${lastUpdated.toLocaleTimeString()}`
                  : 'Real-time database sync active'
              }
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>LIVE DATA</span>
            </div>

            {/* Expand / Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/20"
              title={isExpanded ? 'Collapse Visualization Panel' : 'Expand Visualization Panel'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-6 bg-[#FAFBFD]">
          {/* Key Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Submissions */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Submissions
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{totalResponses}</span>
                  <span className="text-xs text-slate-500">Verified</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  Live response feed active
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5 text-[#1F4E79]" />
              </div>
            </div>

            {/* Top Stakeholder Group */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Primary Stakeholder Group
                </p>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate" title={topCategory?.label}>
                  {topCategory ? topCategory.label : 'None'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold">
                    {topCategory ? `${topCategory.percentage}% share` : ''}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    ({topCategory ? topCategory.count : 0} responses)
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
            </div>

            {/* Categories Engaged */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Active Stakeholder Groups
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{engagedCategoriesCount}</span>
                  <span className="text-xs text-slate-500">/ {categories.length} Total</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  {categories.length > 0
                    ? `${Math.round((engagedCategoriesCount / categories.length) * 100)}% Coverage`
                    : ''}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>

            {/* Contact Verified */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Contactability Rate
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{emailRate}%</span>
                  <span className="text-xs text-slate-500">({totalWithEmail} emails)</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Valid email addresses captured
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold">
                <Mail className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('distribution')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'distribution'
                    ? 'bg-[#1F4E79] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <PieIcon className="w-3.5 h-3.5" />
                <span>Distribution Charts</span>
              </button>

              <button
                onClick={() => setActiveTab('ranking')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'ranking'
                    ? 'bg-[#1F4E79] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Representation Breakdown</span>
              </button>

              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'matrix'
                    ? 'bg-[#1F4E79] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Summary Matrix</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Distribution Charts (Donut + Bar) */}
          {activeTab === 'distribution' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Donut Chart */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col items-center">
                <div className="w-full text-left mb-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Stakeholder Share (Donut Chart)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Proportional representation across all 10 stakeholder categories
                  </p>
                </div>

                {pieChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                    No response submissions yet.
                  </div>
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={2}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: any, item: any) => [
                            `${value} responses (${item.payload.percentage}%)`,
                            name,
                          ]}
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            borderRadius: '0.75rem',
                            color: '#FFFFFF',
                            fontSize: '12px',
                            border: '1px solid #334155',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Horizontal Bar Chart */}
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="w-full text-left mb-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    Response Volume per Category
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Absolute count of verified stakeholder feedback submissions
                  </p>
                </div>

                {sortedStats.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                    No category data available.
                  </div>
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={sortedStats}
                        margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} />
                        <YAxis
                          type="category"
                          dataKey="label"
                          width={140}
                          tick={{ fontSize: 10, fill: '#334155' }}
                        />
                        <Tooltip
                          formatter={(value: any, name: any, item: any) => [
                            `${value} responses (${item.payload.percentage}%)`,
                            'Count',
                          ]}
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            borderRadius: '0.75rem',
                            color: '#FFFFFF',
                            fontSize: '12px',
                            border: '1px solid #334155',
                          }}
                        />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                          {sortedStats.map((entry, index) => (
                            <Cell key={`bar-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Representation Breakdown Cards */}
          {activeTab === 'ranking' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sortedStats.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-300 transition-all shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-bold text-slate-900" title={cat.label}>
                        {cat.label}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-black whitespace-nowrap">
                      {cat.count}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-700">{cat.percentage}% share</span>
                    <span>
                      {cat.withEmail} emails • {cat.withPhone} phones
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: Summary Matrix */}
          {activeTab === 'matrix' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Stakeholder Representation & Engagement Matrix
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ensuring adequate representation from all mandatory NBA/NAAC stakeholder categories
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {categories.length} Stakeholder Categories
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Internal Slug</th>
                      <th className="py-3 px-4 text-center">Submissions</th>
                      <th className="py-3 px-4 text-center">Share (%)</th>
                      <th className="py-3 px-4 text-center">Contact Capture</th>
                      <th className="py-3 px-4 text-center">Representation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedStats.map((item, idx) => {
                      const status =
                        item.count >= 20
                          ? { label: 'Optimal Representation', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
                          : item.count >= 5
                          ? { label: 'Active Representation', bg: 'bg-blue-50 text-blue-800 border-blue-200' }
                          : item.count > 0
                          ? { label: 'Low Sample Size', bg: 'bg-amber-50 text-amber-800 border-amber-200' }
                          : { label: 'Pending Submissions', bg: 'bg-slate-100 text-slate-600 border-slate-200' };

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-700">#{idx + 1}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.label}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono">{item.slug}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-900">
                            {item.count}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-blue-900">
                            {item.percentage}%
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600">
                            {item.withEmail} emails ({item.withPhone} phones)
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${status.bg}`}
                            >
                              {status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
