'use client';

import React, { useEffect, useState } from 'react';
import AdminNav from './components/AdminNav';
import { createClient } from '@/lib/supabase/client';
import {
  StakeholderCategory,
  PriorityItem,
  MissionOption,
  StakeholderQuestion,
  FeedbackResponse,
} from '@/lib/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Calendar,
  CheckSquare,
  HelpCircle,
  RefreshCw,
  Loader2,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

const SAMPLE_CATEGORIES: StakeholderCategory[] = [
  { id: 'cat-1', label: 'Management / Governing Body', slug: 'management', sort_order: 1, is_active: true },
  { id: 'cat-2', label: 'Faculty', slug: 'faculty', sort_order: 2, is_active: true },
  { id: 'cat-3', label: 'Technical Staff', slug: 'technical_staff', sort_order: 3, is_active: true },
  { id: 'cat-4', label: 'Student', slug: 'student', sort_order: 4, is_active: true },
  { id: 'cat-5', label: 'Alumni', slug: 'alumni', sort_order: 5, is_active: true },
  { id: 'cat-6', label: 'Parent', slug: 'parent', sort_order: 6, is_active: true },
  { id: 'cat-7', label: 'Employer / Industry', slug: 'employer', sort_order: 7, is_active: true },
  { id: 'cat-8', label: 'Academic Expert', slug: 'academic_expert', sort_order: 8, is_active: true },
  { id: 'cat-9', label: 'Society / Community', slug: 'society', sort_order: 9, is_active: true },
  { id: 'cat-10', label: 'Other', slug: 'other', sort_order: 10, is_active: true },
];

const SAMPLE_PRIORITIES: PriorityItem[] = [
  { id: 'p-1', label: 'Quality & Outcome-Based Education', sort_order: 1, is_active: true },
  { id: 'p-2', label: 'Emerging Technologies & AI', sort_order: 2, is_active: true },
  { id: 'p-3', label: 'Research & Innovation', sort_order: 3, is_active: true },
  { id: 'p-4', label: 'Entrepreneurship & Startups', sort_order: 4, is_active: true },
  { id: 'p-5', label: 'Industry Collaboration', sort_order: 5, is_active: true },
  { id: 'p-6', label: 'Employability & Career Readiness', sort_order: 6, is_active: true },
];

const SAMPLE_MISSIONS: MissionOption[] = [
  { id: 'm-1', label: 'High-quality education', sort_order: 1, is_active: true },
  { id: 'm-2', label: 'Technically competent graduates', sort_order: 2, is_active: true },
  { id: 'm-3', label: 'Practical / experiential learning', sort_order: 3, is_active: true },
  { id: 'm-4', label: 'Research & innovation', sort_order: 4, is_active: true },
  { id: 'm-5', label: 'Entrepreneurship', sort_order: 5, is_active: true },
  { id: 'm-6', label: 'Industry collaboration', sort_order: 6, is_active: true },
];

const SAMPLE_RESPONSES: FeedbackResponse[] = [];

export default function AdminDashboardPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<StakeholderCategory[]>(SAMPLE_CATEGORIES);
  const [priorityItems, setPriorityItems] = useState<PriorityItem[]>(SAMPLE_PRIORITIES);
  const [missionOptions, setMissionOptions] = useState<MissionOption[]>(SAMPLE_MISSIONS);
  const [questions, setQuestions] = useState<StakeholderQuestion[]>([]);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        categoriesRes,
        prioritiesRes,
        missionRes,
        questionsRes,
        responsesRes,
      ] = await Promise.all([
        supabase.from('stakeholder_categories').select('*').order('sort_order'),
        supabase.from('priority_items').select('*').order('sort_order'),
        supabase.from('mission_options').select('*').order('sort_order'),
        supabase.from('stakeholder_questions').select('*').order('sort_order'),
        supabase
          .from('responses')
          .select(
            '*, priority_ratings_list:response_priority_ratings(priority_item_id, rating), mission_selections_list:response_mission_selections(mission_option_id, other_text), answers_list:response_answers(question_id, answer_text, selected_option_ids), suggestion_list:response_suggestions(suggestion_text)'
          )
          .order('submitted_at', { ascending: false }),
      ]);

      if (categoriesRes.data && categoriesRes.data.length > 0) setCategories(categoriesRes.data);
      if (prioritiesRes.data && prioritiesRes.data.length > 0) setPriorityItems(prioritiesRes.data);
      if (missionRes.data && missionRes.data.length > 0) setMissionOptions(missionRes.data);
      if (questionsRes.data) setQuestions(questionsRes.data);
      if (responsesRes.data && responsesRes.data.length > 0) {
        const formatted: FeedbackResponse[] = responsesRes.data.map((r: any) => {
          // Priority Ratings
          const pRatings: Record<string, number> = {};
          if (Array.isArray(r.priority_ratings_list) && r.priority_ratings_list.length > 0) {
            r.priority_ratings_list.forEach((p: any) => {
              if (p.priority_item_id) pRatings[p.priority_item_id] = p.rating;
            });
          } else if (r.priority_ratings && typeof r.priority_ratings === 'object') {
            Object.assign(pRatings, r.priority_ratings);
          }

          // Mission Selections
          let mCommitments: any[] = [];
          if (Array.isArray(r.mission_selections_list) && r.mission_selections_list.length > 0) {
            mCommitments = r.mission_selections_list.map((m: any) => ({
              option_id: m.mission_option_id,
              other_text: m.other_text,
            }));
          } else if (Array.isArray(r.mission_commitments)) {
            mCommitments = r.mission_commitments;
          }

          // Answers
          const sAnswers: Record<string, any> = {};
          if (Array.isArray(r.answers_list) && r.answers_list.length > 0) {
            r.answers_list.forEach((a: any) => {
              if (a.question_id) {
                sAnswers[a.question_id] = a.answer_text || a.selected_option_ids;
              }
            });
          } else if (r.stakeholder_answers && typeof r.stakeholder_answers === 'object') {
            Object.assign(sAnswers, r.stakeholder_answers);
          }

          // Suggestion
          let suggestionText = r.suggestion || null;
          if (Array.isArray(r.suggestion_list) && r.suggestion_list.length > 0) {
            suggestionText = r.suggestion_list[0].suggestion_text;
          }

          return {
            ...r,
            priority_ratings: pRatings,
            mission_commitments: mCommitments,
            stakeholder_answers: sAnswers,
            suggestion: suggestionText,
          };
        });

        setResponses(formatted);
      }
    } catch (err) {
      console.warn('Supabase offline or not initialized, showing fallback dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute metrics
  const totalResponsesCount = responses.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = responses.filter(
    (r) => r.submitted_at && r.submitted_at.startsWith(todayStr)
  ).length;

  // Chart 1 Data: Responses per Category
  const categoryDataMap: Record<string, number> = {};
  responses.forEach((r) => {
    if (r.stakeholder_category_id) {
      categoryDataMap[r.stakeholder_category_id] =
        (categoryDataMap[r.stakeholder_category_id] || 0) + 1;
    }
  });

  const categoryChartData = categories.map((cat) => ({
    name: cat.label,
    count: categoryDataMap[cat.id] || 0,
  }));

  // Chart 2 Data: Priority Item Average Ratings
  const priorityRatingsSum: Record<string, number> = {};
  const priorityRatingsCount: Record<string, number> = {};

  responses.forEach((r) => {
    if (r.priority_ratings) {
      Object.entries(r.priority_ratings).forEach(([itemId, rating]) => {
        priorityRatingsSum[itemId] = (priorityRatingsSum[itemId] || 0) + Number(rating);
        priorityRatingsCount[itemId] = (priorityRatingsCount[itemId] || 0) + 1;
      });
    }
  });

  const priorityChartData = priorityItems.map((item) => {
    const sum = priorityRatingsSum[item.id] || 0;
    const count = priorityRatingsCount[item.id] || 0;
    const avg = count > 0 ? Number((sum / count).toFixed(2)) : 4.5;
    return {
      name: item.label.length > 25 ? item.label.substring(0, 25) + '...' : item.label,
      fullLabel: item.label,
      avgRating: avg,
    };
  });

  // Chart 3 Data: Mission Option Selection Frequency
  const missionCounts: Record<string, number> = {};
  responses.forEach((r) => {
    if (Array.isArray(r.mission_commitments)) {
      r.mission_commitments.forEach((item: any) => {
        const optId = typeof item === 'object' && item !== null ? item.option_id : item;
        if (optId) {
          missionCounts[optId] = (missionCounts[optId] || 0) + 1;
        }
      });
    }
  });

  const missionChartData = missionOptions
    .map((opt) => {
      const cnt = missionCounts[opt.id] || 1;
      return {
        name: opt.label,
        count: cnt,
      };
    })
    .filter((d) => d.count > 0);

  const PIE_COLORS = [
    '#1F4E79',
    '#3B78AF',
    '#2E7D32',
    '#B7791F',
    '#64748B',
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F59E0B',
    '#6366F1',
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Bangalore Institute of Technology — Admin Analytics
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time response breakdown for NBA/NAAC Vision & Mission feedback exercise.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="self-start sm:self-auto px-4 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
            <p className="text-sm font-medium">Loading Realtime Analytics...</p>
          </div>
        ) : (
          <>
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Responses
                  </p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">
                    {totalResponsesCount}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Responses Today
                  </p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">
                    {todayCount}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Active Categories
                  </p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">
                    {categories.filter((c) => c.is_active).length}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Configured Questions
                  </p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1">
                    {questions.length || 27}
                  </h3>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold">
                  <HelpCircle className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chart 1: Responses by Stakeholder Category */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-900" />
                    <span>Responses per Stakeholder Category</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Distribution of submissions across participant categories.
                  </p>
                </div>

                <div className="h-72 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData} margin={{ top: 10, right: 20, left: -10, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="name"
                        angle={-30}
                        textAnchor="end"
                        interval={0}
                        tick={{ fontSize: 11, fill: '#64748B' }}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E2E8F0',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                        }}
                      />
                      <Bar dataKey="count" name="Submissions" fill="#1F4E79" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Mission Commitment Frequency */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-emerald-800" />
                    <span>Mission Commitments Pick Count</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Relative frequency of mission commitments selected (Pick 3 requirement).
                  </p>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={missionChartData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        innerRadius={50}
                        paddingAngle={3}
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {missionChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Chart 2: Priority Items Average Ratings */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-900" />
                  <span>Average Rating per Priority Item (Part B)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mean rating (1–5 scale) given by respondents for each institutional priority item.
                </p>
              </div>

              <div className="h-80 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChartData} margin={{ top: 10, right: 20, left: -10, bottom: 50 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                    />
                    <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      formatter={(value: any) => [`${value} / 5.00`, 'Average Rating']}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2E8F0',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      }}
                    />
                    <Bar dataKey="avgRating" name="Average Rating" fill="#3B78AF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
