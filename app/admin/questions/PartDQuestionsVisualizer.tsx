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
} from 'recharts';
import {
  HelpCircle,
  Award,
  Users,
  ChevronDown,
  ChevronUp,
  Table as TableIcon,
  BarChart3,
  TrendingUp,
  Filter,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { StakeholderQuestion, StakeholderCategory, FeedbackResponse } from '@/lib/types';

interface PartDQuestionsVisualizerProps {
  questions: StakeholderQuestion[];
  categories: StakeholderCategory[];
  responses: FeedbackResponse[];
  loading?: boolean;
  onRefresh?: () => void;
  lastUpdated?: Date | null;
}

export default function PartDQuestionsVisualizer({
  questions,
  categories,
  responses,
  loading = false,
  onRefresh,
  lastUpdated,
}: PartDQuestionsVisualizerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'matrix'>('analytics');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c.label]));
  }, [categories]);

  // Questions filtered by category
  const filteredQuestions = useMemo(() => {
    if (selectedCategoryId === 'all') return questions;
    return questions.filter((q) => q.category_id === selectedCategoryId);
  }, [questions, selectedCategoryId]);

  // Answer statistics per question
  const questionAnalytics = useMemo(() => {
    return filteredQuestions.map((q) => {
      // Find responses that answered this question
      const answersForQ: any[] = [];

      responses.forEach((r) => {
        const ans = r.stakeholder_answers?.[q.id];
        if (ans !== undefined && ans !== null) {
          answersForQ.push(ans);
        }
      });

      const totalAnswered = answersForQ.length;
      const options = q.options || [];

      // If choice-based question, count option frequencies
      const optionCounts: Record<string, number> = {};
      options.forEach((opt: any) => {
        const optLabel = typeof opt === 'string' ? opt : opt.option_label || opt.id;
        optionCounts[optLabel] = 0;
      });

      answersForQ.forEach((ans) => {
        if (Array.isArray(ans)) {
          ans.forEach((val) => {
            // Find matching option label
            const matchedOpt = options.find((o: any) => (o.id && o.id === val) || o.option_label === val || o === val);
            const label = matchedOpt ? (typeof matchedOpt === 'string' ? matchedOpt : matchedOpt.option_label) : String(val);
            optionCounts[label] = (optionCounts[label] || 0) + 1;
          });
        } else if (typeof ans === 'string') {
          const matchedOpt = options.find((o: any) => (o.id && o.id === ans) || o.option_label === ans || o === ans);
          const label = matchedOpt ? (typeof matchedOpt === 'string' ? matchedOpt : matchedOpt.option_label) : ans;
          optionCounts[label] = (optionCounts[label] || 0) + 1;
        }
      });

      const chartData = Object.entries(optionCounts).map(([optLabel, count]) => {
        const pct = totalAnswered > 0 ? Number(((count / totalAnswered) * 100).toFixed(1)) : 0;
        return {
          name: optLabel.length > 30 ? optLabel.substring(0, 30) + '...' : optLabel,
          fullName: optLabel,
          count,
          percentage: pct,
        };
      }).sort((a, b) => b.count - a.count);

      return {
        id: q.id,
        category_id: q.category_id,
        categoryLabel: categoryMap.get(q.category_id) || 'General',
        question_text: q.question_text,
        question_type: q.question_type,
        totalAnswered,
        chartData,
        sampleTextAnswers: q.question_type === 'paragraph'
          ? answersForQ.filter((a) => typeof a === 'string' && a.trim().length > 0).slice(0, 5)
          : [],
      };
    });
  }, [filteredQuestions, responses, categoryMap]);

  const totalAnswersRecorded = useMemo(() => {
    return questionAnalytics.reduce((acc, q) => acc + q.totalAnswered, 0);
  }, [questionAnalytics]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 px-5 py-4 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-inner">
              <HelpCircle className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-wider uppercase bg-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded border border-indigo-400/30">
                  Part D Analytics
                </span>
                <span className="text-white/40">•</span>
                <span className="text-xs text-indigo-100 font-medium">
                  Role-Specific Feedback Question Analytics
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Real-Time Stakeholder Question Response Visualizer
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
            {/* Total Answers */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Question Answers
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{totalAnswersRecorded}</span>
                  <span className="text-xs text-slate-500">Recorded</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  Across all stakeholder categories
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              </div>
            </div>

            {/* Total Questions */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Active Question Bank
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{questions.length}</span>
                  <span className="text-xs text-slate-500">Questions</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {categories.length} Role-Specific Surveys
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            {/* Stakeholder Category Filter KPI */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Inspecting Category
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm font-bold text-slate-900 truncate">
                    {selectedCategoryId === 'all'
                      ? 'All Categories'
                      : categoryMap.get(selectedCategoryId) || 'General'}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-700 font-medium mt-0.5">
                  {filteredQuestions.length} Questions in scope
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-bold">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>

            {/* Submissions Count */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Response Pool Size
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-slate-900">{responses.length}</span>
                  <span className="text-xs text-slate-500">Submissions</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Available for Part D analytics
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </div>

          {/* Navigation & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-800 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Question Analytics & Option Distribution</span>
              </button>

              <button
                onClick={() => setActiveTab('matrix')}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  activeTab === 'matrix'
                    ? 'bg-indigo-800 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Question Bank Matrix</span>
              </button>
            </div>

            {/* Category selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                <span>Category:</span>
              </span>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500 shadow-xs"
              >
                <option value="all">All Categories ({questions.length} questions)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({questions.filter((q) => q.category_id === c.id).length})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TAB 1: Analytics per Question */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {questionAnalytics.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center text-slate-400 text-xs border border-slate-200">
                  No questions found for the selected category.
                </div>
              ) : (
                questionAnalytics.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                            {q.categoryLabel}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium capitalize">
                            {q.question_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1.5">
                          {qIdx + 1}. {q.question_text}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-100">
                          {q.totalAnswered} Respondents Answered
                        </span>
                      </div>
                    </div>

                    {/* Choice questions: Bar Chart & Distribution */}
                    {q.chartData.length > 0 ? (
                      <div className="space-y-4">
                        <div className="h-60 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              layout="vertical"
                              data={q.chartData}
                              margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
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
                                width={180}
                                tick={{ fontSize: 10, fill: '#334155' }}
                              />
                              <Tooltip
                                formatter={(val: any, name: any, item: any) => [
                                  `${val}% (${item.payload.count} selections)`,
                                  'Share',
                                ]}
                                contentStyle={{
                                  backgroundColor: '#0F172A',
                                  borderRadius: '0.75rem',
                                  color: '#FFFFFF',
                                  fontSize: '12px',
                                  border: '1px solid #334155',
                                }}
                              />
                              <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={16}>
                                {q.chartData.map((_, idx) => (
                                  <Cell
                                    key={`cell-${idx}`}
                                    fill={idx === 0 ? '#4338CA' : idx === 1 ? '#4F46E5' : '#6366F1'}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Distribution pills */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                          {q.chartData.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between"
                            >
                              <span className="font-medium text-slate-800 truncate mr-2" title={opt.fullName}>
                                {opt.fullName}
                              </span>
                              <span className="font-bold text-indigo-700 whitespace-nowrap">
                                {opt.percentage}% ({opt.count})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : q.sampleTextAnswers.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-500">Sample Qualitative Feedback Answers:</p>
                        <div className="space-y-2">
                          {q.sampleTextAnswers.map((txt, tIdx) => (
                            <div key={tIdx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800">
                              "{txt}"
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No responses submitted for this question yet.
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Matrix Table */}
          {activeTab === 'matrix' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Role-Specific Question Inventory & Completion Status
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Evaluated by stakeholders belonging to their respective categories
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {questionAnalytics.length} Questions
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Question Text</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-center">Responses</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {questionAnalytics.map((q, idx) => (
                      <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                          {q.categoryLabel}
                        </td>
                        <td className="py-3 px-4 text-slate-900 font-medium max-w-md">
                          {q.question_text}
                        </td>
                        <td className="py-3 px-4 text-slate-500 capitalize whitespace-nowrap">
                          {q.question_type.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-indigo-900">
                          {q.totalAnswered}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              q.totalAnswered > 0
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {q.totalAnswered > 0 ? 'Active Responses' : 'Awaiting Input'}
                          </span>
                        </td>
                      </tr>
                    ))}
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
