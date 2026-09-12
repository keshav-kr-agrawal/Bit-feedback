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
  ReferenceLine,
} from 'recharts';
import {
  CheckSquare,
  Award,
  Users,
  ChevronDown,
  ChevronUp,
  Table as TableIcon,
  BarChart3,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { MissionOption, StakeholderCategory, FeedbackResponse } from '@/lib/types';

interface PartCMissionVisualizerProps {
  options: MissionOption[];
  responses: FeedbackResponse[];
  categories: StakeholderCategory[];
  loading?: boolean;
  onRefresh?: () => void;
  lastUpdated?: Date | null;
}

export default function PartCMissionVisualizer({
  options,
  responses,
  categories,
  loading = false,
  onRefresh,
  lastUpdated,
}: PartCMissionVisualizerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'ranking' | 'stakeholder' | 'matrix'>('ranking');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.label]));
  }, [categories]);

  // Responses that selected at least 1 mission commitment
  const responsesWithMissions = useMemo(() => {
    return responses.filter(
      (r) => Array.isArray(r.mission_commitments) && r.mission_commitments.length > 0
    );
  }, [responses]);

  // Compute selection stats per mission option
  const optionStats = useMemo(() => {
    if (!options || options.length === 0) return [];

    const totalRespondents = responsesWithMissions.length;

    return options.map((opt) => {
      let count = 0;
      const catCounts: Record<string, number> = {};

      responsesWithMissions.forEach((r) => {
        const hasPicked = r.mission_commitments.some((m: any) => {
          const optId = typeof m === 'object' && m !== null ? m.option_id : m;
          return optId === opt.id;
        });

        if (hasPicked) {
          count++;
          if (r.stakeholder_category_id) {
            catCounts[r.stakeholder_category_id] =
              (catCounts[r.stakeholder_category_id] || 0) + 1;
          }
        }
      });

      const percentage = totalRespondents > 0 ? Number(((count / totalRespondents) * 100).toFixed(1)) : 0;

      return {
        id: opt.id,
        label: opt.label,
        shortLabel: opt.label.length > 36 ? opt.label.substring(0, 36) + '...' : opt.label,
        count,
        percentage,
        catCounts,
      };
    });
  }, [options, responsesWithMissions]);

  // Sort descending by selection count
  const sortedOptionStats = useMemo(() => {
    return [...optionStats].sort((a, b) => b.count - a.count || b.percentage - a.percentage);
  }, [optionStats]);

  const totalSelectionsCount = useMemo(() => {
    return sortedOptionStats.reduce((acc, o) => acc + o.count, 0);
  }, [sortedOptionStats]);

  const avgSelectionsPerRespondent = useMemo(() => {
    if (responsesWithMissions.length === 0) return 0;
    return Number((totalSelectionsCount / responsesWithMissions.length).toFixed(1));
  }, [totalSelectionsCount, responsesWithMissions]);

  const topMission = sortedOptionStats[0];
  const topThree = sortedOptionStats.slice(0, 3);

  // Chart data
  const chartData = useMemo(() => {
    return sortedOptionStats.map((item, idx) => ({
      name: item.shortLabel,
      fullName: item.label,
      count: item.count,
      percentage: item.percentage,
      rank: idx + 1,
    }));
  }, [sortedOptionStats]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 px-5 py-4 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-inner">
              <CheckSquare className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded border border-emerald-400/30">
                  Part C Analytics
                </span>
                <span className="text-white/40">•</span>
                <span className="text-xs text-emerald-100 font-medium">
                  Core Mission Commitments (3 Picks per Respondent)
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Real-Time Mission Option Preferences Visualization
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
            {/* Top Endorsed Mission */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  #1 Endorsed Commitment
                </p>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate" title={topMission?.label}>
                  {topMission ? topMission.label : 'None'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                    {topMission ? `${topMission.percentage}% picked` : ''}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    ({topMission ? topMission.count : 0} votes)
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold flex-shrink-0">
                <Award className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            {/* Total Votes Count */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Mission Selections
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{totalSelectionsCount}</span>
                  <span className="text-xs text-slate-500">picks cast</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Avg {avgSelectionsPerRespondent} picks per response
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5 text-blue-700" />
              </div>
            </div>

            {/* Evaluated Respondents */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Submissions Evaluated
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {responsesWithMissions.length}
                  </span>
                  <span className="text-xs text-slate-500">/ {responses.length} total</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  {responses.length > 0
                    ? `${Math.round((responsesWithMissions.length / responses.length) * 100)}% Participation`
                    : 'No responses'}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>

            {/* Active Mission Options */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Configured Mission Statements
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{options.length}</span>
                  <span className="text-xs text-slate-500">Statements</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {options.filter((o) => o.is_active).length} Active in Public Form
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center font-bold">
                <CheckSquare className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </div>

          {/* Top 3 Consensus Banner */}
          {topThree.length >= 3 && (
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Top 3 Consensus Mission Commitments (Accreditation Triad)
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {topThree.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-emerald-200/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-bold">
                        Pick #{idx + 1}
                      </span>
                      <span className="text-xs font-black text-emerald-900">
                        {item.percentage}% ({item.count} votes)
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-2" title={item.label}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('ranking')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'ranking'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Selection Frequency Rankings</span>
              </button>

              <button
                onClick={() => setActiveTab('stakeholder')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'stakeholder'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Stakeholder Group Breakdown</span>
              </button>

              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'matrix'
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Summary Matrix</span>
              </button>
            </div>
          </div>

          {/* TAB 1: Frequency Rankings */}
          {activeTab === 'ranking' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Mission Commitment Options Pick Rate (% of Total Respondents)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      How often each mission commitment is included in stakeholders' Top 3 choices
                    </p>
                  </div>
                </div>

                {chartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                    No mission commitments recorded yet.
                  </div>
                ) : (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          unit="%"
                          tick={{ fontSize: 11, fill: '#64748B' }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={220}
                          tick={{ fontSize: 11, fill: '#334155' }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1 max-w-xs border border-slate-700">
                                  <p className="font-bold text-emerald-300">
                                    Rank #{data.rank}: {data.fullName}
                                  </p>
                                  <div className="flex items-center justify-between pt-1 border-t border-slate-700">
                                    <span className="text-slate-300">Selected By:</span>
                                    <span className="font-bold text-emerald-400">
                                      {data.percentage}% of respondents
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-300">Vote Count:</span>
                                    <span className="font-semibold text-white">{data.count} picks</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="percentage" radius={[0, 6, 6, 0]} barSize={18}>
                          {chartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                index === 0
                                  ? '#047857' // Emerald-700
                                  : index === 1
                                  ? '#059669' // Emerald-600
                                  : index === 2
                                  ? '#10B981' // Emerald-500
                                  : '#3B82F6' // Blue-500
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedOptionStats.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-4 border border-slate-200 hover:border-emerald-300 transition-all shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                            idx === 0
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                              : idx === 1
                              ? 'bg-teal-100 text-teal-900'
                              : idx === 2
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900 line-clamp-1" title={item.label}>
                          {item.label}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-100 whitespace-nowrap">
                        {item.percentage}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-emerald-600"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>{item.count} respondents chose this</span>
                      <span className="font-semibold text-slate-700">
                        {idx < 3 ? '★ Top 3 Triad' : 'Supported'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Stakeholder Group Breakdown */}
          {activeTab === 'stakeholder' && (
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Mission Endorsement by Stakeholder Category
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    How many respondents from each stakeholder group selected each mission statement
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Filter Group:</span>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-800 font-medium focus:outline-none focus:border-emerald-500"
                  >
                    <option value="all">All Stakeholder Groups Matrix</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedCategoryId === 'all' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-3 px-3">Mission Commitment Statement</th>
                        <th className="py-3 px-3 text-center bg-emerald-50 text-emerald-900">
                          Total Picks
                        </th>
                        {categories.map((c) => (
                          <th key={c.id} className="py-3 px-3 text-center whitespace-nowrap">
                            {c.label.length > 15 ? c.label.substring(0, 15) + '...' : c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedOptionStats.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900 max-w-sm">
                            {item.label}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-emerald-800 bg-emerald-50/40">
                            {item.count} ({item.percentage}%)
                          </td>
                          {categories.map((c) => {
                            const cnt = item.catCounts[c.id] || 0;
                            return (
                              <td key={c.id} className="py-3 px-3 text-center font-mono">
                                {cnt > 0 ? (
                                  <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800">
                                    {cnt}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">0</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
                    Showing mission picks cast by: <strong>{categoryMap.get(selectedCategoryId)}</strong>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sortedOptionStats.map((item) => {
                      const cnt = item.catCounts[selectedCategoryId] || 0;
                      return (
                        <div
                          key={item.id}
                          className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900">{item.label}</span>
                            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-xs font-bold text-emerald-800">
                              {cnt} picks
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Summary Matrix */}
          {activeTab === 'matrix' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Core Mission Commitments Prioritization Matrix
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Consensus ranking for formulation of final Institutional Mission Statement
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {sortedOptionStats.length} Statements Analyzed
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Mission Commitment Statement</th>
                      <th className="py-3 px-4 text-center">Votes Cast</th>
                      <th className="py-3 px-4 text-center">Respondent Share (%)</th>
                      <th className="py-3 px-4 text-center">Consensus Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedOptionStats.map((item, idx) => {
                      const tier =
                        idx < 3
                          ? { label: 'Top 3 Consensus Triad', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
                          : item.percentage >= 30
                          ? { label: 'Strong Endorsement', bg: 'bg-blue-50 text-blue-800 border-blue-200' }
                          : { label: 'Secondary Focus', bg: 'bg-slate-100 text-slate-700 border-slate-200' };

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-700">#{idx + 1}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{item.label}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">
                            {item.count}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-emerald-700">
                            {item.percentage}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${tier.bg}`}
                            >
                              {tier.label}
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
