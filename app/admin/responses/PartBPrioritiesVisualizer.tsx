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
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  Table as TableIcon,
} from 'lucide-react';
import { PriorityItem, StakeholderCategory, FeedbackResponse } from '@/lib/types';

interface PartBPrioritiesVisualizerProps {
  responses: FeedbackResponse[];
  filteredResponses: FeedbackResponse[];
  priorityItems: PriorityItem[];
  categories: StakeholderCategory[];
  loading?: boolean;
  onRefresh?: () => void;
  lastUpdated?: Date | null;
}

export default function PartBPrioritiesVisualizer({
  responses,
  filteredResponses,
  priorityItems,
  categories,
  loading = false,
  onRefresh,
  lastUpdated,
}: PartBPrioritiesVisualizerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'ranking' | 'distribution' | 'stakeholder' | 'matrix'>('ranking');
  const [useFilteredScope, setUseFilteredScope] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine active dataset
  const activeResponses = useMemo(() => {
    return useFilteredScope ? filteredResponses : responses;
  }, [useFilteredScope, filteredResponses, responses]);

  // Compute category map
  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.label]));
  }, [categories]);

  // Filter responses that have at least one priority rating
  const ratedResponses = useMemo(() => {
    return activeResponses.filter(
      (r) => r.priority_ratings && Object.keys(r.priority_ratings).length > 0
    );
  }, [activeResponses]);

  // Detailed statistics for each Priority Item
  const priorityStats = useMemo(() => {
    if (!priorityItems || priorityItems.length === 0) return [];

    return priorityItems.map((item) => {
      // Collect valid numeric ratings
      const itemRatings: number[] = [];
      const catRatingsMap: Record<string, number[]> = {};

      ratedResponses.forEach((r) => {
        const rating = r.priority_ratings?.[item.id];
        if (typeof rating === 'number' && rating >= 1 && rating <= 5) {
          itemRatings.push(rating);
          if (r.stakeholder_category_id) {
            if (!catRatingsMap[r.stakeholder_category_id]) {
              catRatingsMap[r.stakeholder_category_id] = [];
            }
            catRatingsMap[r.stakeholder_category_id].push(rating);
          }
        }
      });

      const count = itemRatings.length;
      const sum = itemRatings.reduce((acc, val) => acc + val, 0);
      const avg = count > 0 ? Number((sum / count).toFixed(2)) : 0;

      // Distribution [1..5]
      const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      itemRatings.forEach((val) => {
        const rounded = Math.round(val);
        if (dist[rounded as 1 | 2 | 3 | 4 | 5] !== undefined) {
          dist[rounded as 1 | 2 | 3 | 4 | 5]++;
        }
      });

      const highPriorityCount = dist[4] + dist[5];
      const highPriorityPercent = count > 0 ? Math.round((highPriorityCount / count) * 100) : 0;

      // Category averages for this priority item
      const categoryAverages: Record<string, number> = {};
      Object.entries(catRatingsMap).forEach(([catId, ratingsArr]) => {
        if (ratingsArr.length > 0) {
          const catSum = ratingsArr.reduce((a, b) => a + b, 0);
          categoryAverages[catId] = Number((catSum / ratingsArr.length).toFixed(2));
        }
      });

      return {
        id: item.id,
        label: item.label,
        shortLabel: item.label.length > 32 ? item.label.substring(0, 32) + '...' : item.label,
        sort_order: item.sort_order,
        count,
        sum,
        avg,
        dist,
        highPriorityCount,
        highPriorityPercent,
        categoryAverages,
      };
    });
  }, [priorityItems, ratedResponses]);

  // Priority stats sorted by Average Rating (descending)
  const sortedPriorityStats = useMemo(() => {
    return [...priorityStats].sort((a, b) => b.avg - a.avg || b.highPriorityPercent - a.highPriorityPercent);
  }, [priorityStats]);

  // Global KPIs
  const totalSubmissions = activeResponses.length;
  const totalPartBCompleted = ratedResponses.length;
  const completionRate =
    totalSubmissions > 0 ? Math.round((totalPartBCompleted / totalSubmissions) * 100) : 0;

  const totalVotesAcrossAll = useMemo(() => {
    return priorityStats.reduce((acc, item) => acc + item.count, 0);
  }, [priorityStats]);

  const globalAvgRating = useMemo(() => {
    if (totalVotesAcrossAll === 0) return 0;
    const globalSum = priorityStats.reduce((acc, item) => acc + item.sum, 0);
    return Number((globalSum / totalVotesAcrossAll).toFixed(2));
  }, [priorityStats, totalVotesAcrossAll]);

  const topPriority = sortedPriorityStats[0];

  // Chart data for Ranking tab
  const rankingChartData = useMemo(() => {
    return sortedPriorityStats.map((item, index) => {
      const mobileName = item.label.length > 15 ? item.label.substring(0, 15) + '…' : item.label;
      return {
        name: isMobile ? mobileName : item.shortLabel,
        fullName: item.label,
        avg: item.avg,
        count: item.count,
        highPriorityPercent: item.highPriorityPercent,
        rank: index + 1,
      };
    });
  }, [sortedPriorityStats, isMobile]);

  // Chart data for Distribution tab (Stacked percentage)
  const distributionChartData = useMemo(() => {
    return sortedPriorityStats.map((item) => {
      const c = item.count || 1;
      const mobileName = item.label.length > 15 ? item.label.substring(0, 15) + '…' : item.label;
      return {
        name: isMobile ? mobileName : item.shortLabel,
        fullName: item.label,
        '5 - Very High': Number(((item.dist[5] / c) * 100).toFixed(1)),
        '4 - High': Number(((item.dist[4] / c) * 100).toFixed(1)),
        '3 - Moderate': Number(((item.dist[3] / c) * 100).toFixed(1)),
        '2 - Low': Number(((item.dist[2] / c) * 100).toFixed(1)),
        '1 - Very Low': Number(((item.dist[1] / c) * 100).toFixed(1)),
        totalCount: item.count,
      };
    });
  }, [sortedPriorityStats, isMobile]);

  // Dynamic bar colors based on score
  const getRatingColor = (avg: number) => {
    if (avg >= 4.5) return '#1F4E79'; // BIT Primary Navy
    if (avg >= 4.0) return '#2563EB'; // Royal Blue
    if (avg >= 3.5) return '#0284C7'; // Sky Blue
    if (avg >= 3.0) return '#D97706'; // Amber
    return '#DC2626'; // Rose
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#1F4E79] px-5 py-4 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-inner">
              <BarChart3 className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase bg-blue-500/20 text-blue-200 px-2 py-0.5 rounded border border-blue-400/30">
                  Part B Analytics
                </span>
                <span className="text-white/40">•</span>
                <span className="text-xs text-blue-100 font-medium">
                  Institutional Priorities (1–5 Evaluation)
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Real-Time Institutional Priorities Visualization
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
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

            {/* Scope Selector: Filtered vs All */}
            <button
              onClick={() => setUseFilteredScope(!useFilteredScope)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                useFilteredScope
                  ? 'bg-blue-600/40 border-blue-400/50 text-white'
                  : 'bg-white/10 border-white/20 text-slate-200 hover:bg-white/20'
              }`}
              title={
                useFilteredScope
                  ? 'Currently visualizing active filtered responses. Click to visualize all submissions.'
                  : 'Currently visualizing all submissions. Click to sync with table filters.'
              }
            >
              <Filter className="w-3 h-3" />
              <span>
                {useFilteredScope
                  ? `Filtered View (${filteredResponses.length})`
                  : `All Submissions (${responses.length})`}
              </span>
            </button>

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
        <div className="p-3.5 sm:p-6 space-y-5 sm:space-y-6 bg-[#FAFBFD]">
          {/* Key Metric Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Overall Score */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Overall Priority Index
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {globalAvgRating > 0 ? `${globalAvgRating}` : '—'}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">/ 5.00</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  {globalAvgRating >= 4.0 ? 'High Institutional Consensus' : 'Active Evaluation'}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5 text-[#1F4E79]" />
              </div>
            </div>

            {/* Top Priority */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Top Ranked Focus Area
                </p>
                <p className="text-xs font-bold text-slate-900 mt-1 truncate" title={topPriority?.label}>
                  {topPriority ? topPriority.label : 'None'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px] font-bold">
                    Rank #1
                  </span>
                  <span className="text-xs font-bold text-[#1F4E79]">
                    {topPriority ? `${topPriority.avg} ★` : ''}
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
            </div>

            {/* High Priority Consensus % */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  High Priority Consensus (4–5★)
                </p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {sortedPriorityStats.length > 0
                      ? `${Math.round(
                          sortedPriorityStats.reduce((acc, i) => acc + i.highPriorityPercent, 0) /
                            sortedPriorityStats.length
                        )}%`
                      : '—'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Responses marked High or Very High
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            {/* Responses Sample */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Part B Submissions
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{totalPartBCompleted}</span>
                  <span className="text-xs text-slate-500">/ {totalSubmissions} Total</span>
                </div>
                <p className="text-[11px] text-blue-800 font-medium mt-0.5">
                  {completionRate}% Completion Rate
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Navigation Tabs for Different Visualizations */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 sm:mx-0 sm:px-0">
              <button
                onClick={() => setActiveTab('ranking')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'ranking'
                    ? 'bg-[#1F4E79] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Priority Area Rankings</span>
              </button>

              <button
                onClick={() => setActiveTab('distribution')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'distribution'
                    ? 'bg-[#1F4E79] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>1–5 Rating Distribution</span>
              </button>

              <button
                onClick={() => setActiveTab('stakeholder')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'stakeholder'
                    ? 'bg-[#1F4E79] text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Stakeholder Comparison</span>
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

            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 self-start sm:self-auto">
              <span>Scale: 1 = Low</span>
              <span>•</span>
              <span>3 = Moderate</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">5 = Very High Priority</span>
            </div>
          </div>

          {/* TAB 1: Priority Area Rankings */}
          {activeTab === 'ranking' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Institutional Priority Areas Ranked by Average Rating
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Items ordered from highest to lowest mean score (1.00 to 5.00 scale)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="inline-block w-3 h-3 rounded bg-[#1F4E79]"></span>
                    <span className="text-slate-600">≥ 4.5 Very High</span>
                    <span className="inline-block w-3 h-3 rounded bg-[#2563EB] ml-2"></span>
                    <span className="text-slate-600">4.0–4.49 High</span>
                  </div>
                </div>

                {rankingChartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                    No priority ratings recorded yet.
                  </div>
                ) : (
                  <div className="h-80 sm:h-96 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={rankingChartData}
                        margin={{ top: 5, right: isMobile ? 12 : 30, left: isMobile ? 0 : 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                        <XAxis
                          type="number"
                          domain={[0, 5]}
                          ticks={[0, 1, 2, 3, 4, 5]}
                          tick={{ fontSize: isMobile ? 10 : 11, fill: '#64748B' }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={isMobile ? 100 : 190}
                          tick={{ fontSize: isMobile ? 9 : 11, fill: '#334155' }}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1 max-w-xs border border-slate-700">
                                  <p className="font-bold text-blue-200">
                                    Rank #{data.rank}: {data.fullName}
                                  </p>
                                  <div className="flex items-center justify-between pt-1 border-t border-slate-700">
                                    <span className="text-slate-300">Average Rating:</span>
                                    <span className="font-bold text-amber-300">
                                      {data.avg.toFixed(2)} / 5.00
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-300">Total Evaluators:</span>
                                    <span className="font-semibold text-white">{data.count}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-300">Consensus (4–5★):</span>
                                    <span className="font-semibold text-emerald-400">
                                      {data.highPriorityPercent}%
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine
                          x={4.0}
                          stroke="#E11D48"
                          strokeDasharray="4 4"
                          label={{
                            value: '4.0 High Priority Mark',
                            position: 'insideTopRight',
                            fill: '#E11D48',
                            fontSize: 10,
                            fontWeight: 'bold',
                          }}
                        />
                        <Bar dataKey="avg" radius={[0, 6, 6, 0]} barSize={18}>
                          {rankingChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getRatingColor(entry.avg)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Ranked Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedPriorityStats.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-300 transition-all shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : idx === 1
                              ? 'bg-slate-200 text-slate-800'
                              : idx === 2
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-900 line-clamp-1" title={item.label}>
                          {item.label}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-[#1F4E79] text-xs font-black border border-blue-100 whitespace-nowrap">
                        {item.avg.toFixed(2)} ★
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(item.avg / 5) * 100}%`,
                          backgroundColor: getRatingColor(item.avg),
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>{item.count} responses evaluated</span>
                      <span className="font-semibold text-emerald-700">
                        {item.highPriorityPercent}% High/Very High
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: 1-5 Rating Distribution */}
          {activeTab === 'distribution' && (
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Rating Distribution Breakdown Across Institutional Priorities
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Percentage of respondents giving each rating score (1 = Low to 5 = Very High)
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#1F4E79]"></span>
                    <span className="text-slate-600">5 - Very High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#3B82F6]"></span>
                    <span className="text-slate-600">4 - High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#F59E0B]"></span>
                    <span className="text-slate-600">3 - Moderate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#FB923C]"></span>
                    <span className="text-slate-600">2 - Low</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#EF4444]"></span>
                    <span className="text-slate-600">1 - Very Low</span>
                  </div>
                </div>
              </div>

              {distributionChartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
                  No ratings data available for distribution.
                </div>
              ) : (
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={distributionChartData}
                      margin={{ top: 5, right: isMobile ? 10 : 20, left: isMobile ? 0 : 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        unit="%"
                        tick={{ fontSize: isMobile ? 10 : 11, fill: '#64748B' }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={isMobile ? 100 : 190}
                        tick={{ fontSize: isMobile ? 9 : 11, fill: '#334155' }}
                      />
                      <Tooltip
                        formatter={(value: any, name: any) => [`${value}%`, name]}
                        labelFormatter={(label) => `Priority: ${label}`}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '0.75rem',
                          color: '#FFFFFF',
                          fontSize: '12px',
                          border: '1px solid #334155',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="5 - Very High" stackId="a" fill="#1F4E79" />
                      <Bar dataKey="4 - High" stackId="a" fill="#3B82F6" />
                      <Bar dataKey="3 - Moderate" stackId="a" fill="#F59E0B" />
                      <Bar dataKey="2 - Low" stackId="a" fill="#FB923C" />
                      <Bar dataKey="1 - Very Low" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Stakeholder Group Comparison */}
          {activeTab === 'stakeholder' && (
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Comparative Evaluation by Stakeholder Group
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Compare how Faculty, Students, Industry, Alumni, and Management prioritize each area
                  </p>
                </div>

                {/* Filter pill selector for individual category focus */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Group Focus:</span>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Stakeholder Groups Combined</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedCategoryId === 'all' ? (
                <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
                  <table className="w-full min-w-[550px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-3 px-3">Institutional Priority Area</th>
                        <th className="py-3 px-3 text-center bg-blue-50/50 text-[#1F4E79]">
                          Overall Avg
                        </th>
                        {categories.map((c) => (
                          <th key={c.id} className="py-3 px-3 text-center whitespace-nowrap">
                            {c.label.length > 15 ? c.label.substring(0, 15) + '...' : c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedPriorityStats.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-semibold text-slate-900 max-w-xs">
                            {item.label}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-[#1F4E79] bg-blue-50/30">
                            {item.avg.toFixed(2)}
                          </td>
                          {categories.map((c) => {
                            const catScore = item.categoryAverages[c.id];
                            return (
                              <td key={c.id} className="py-3 px-3 text-center">
                                {catScore !== undefined ? (
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded font-semibold ${
                                      catScore >= 4.5
                                        ? 'bg-emerald-50 text-emerald-800 font-bold'
                                        : catScore >= 4.0
                                        ? 'bg-blue-50 text-blue-800'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {catScore.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
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
                // Focused Stakeholder Group View
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-medium">
                    Showing priorities evaluated specifically by:{' '}
                    <strong>{categoryMap.get(selectedCategoryId)}</strong>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {sortedPriorityStats.map((item) => {
                      const score = item.categoryAverages[selectedCategoryId];
                      return (
                        <div
                          key={item.id}
                          className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-900">{item.label}</span>
                            <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-xs font-bold text-[#1F4E79]">
                              {score !== undefined ? `${score.toFixed(2)} ★` : 'No rating'}
                            </span>
                          </div>
                          {score !== undefined && (
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-[#1F4E79] rounded-full"
                                style={{ width: `${(score / 5) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Summary Matrix Table */}
          {activeTab === 'matrix' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Institutional Priorities Strategic Evaluation Matrix
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Prepared for IQAC / NBA Criterion 1 & NAAC Institutional Quality Framework
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {priorityStats.length} Institutional Priority Areas
                </span>
              </div>

              <div className="overflow-x-auto -mx-1 px-1 sm:mx-0 sm:px-0">
                <table className="w-full min-w-[550px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Priority Dimension / Area</th>
                      <th className="py-3 px-4 text-center">Average Score (1–5)</th>
                      <th className="py-3 px-4 text-center">Consensus (4–5★)</th>
                      <th className="py-3 px-4 text-center">Total Votes</th>
                      <th className="py-3 px-4 text-center">Institutional Priority Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedPriorityStats.map((item, idx) => {
                      const tier =
                        item.avg >= 4.5
                          ? { label: 'Tier 1: Critical Focus', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
                          : item.avg >= 4.0
                          ? { label: 'Tier 2: Core Priority', bg: 'bg-blue-50 text-blue-800 border-blue-200' }
                          : { label: 'Tier 3: Secondary Priority', bg: 'bg-amber-50 text-amber-800 border-amber-200' };

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-700">#{idx + 1}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{item.label}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-900 font-black">
                              {item.avg.toFixed(2)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-emerald-700">
                            {item.highPriorityPercent}%
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600 font-mono">
                            {item.count}
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
