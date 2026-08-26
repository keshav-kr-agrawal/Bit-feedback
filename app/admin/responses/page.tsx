'use client';

import React, { useEffect, useState } from 'react';
import AdminNav from '../components/AdminNav';
import { createClient } from '@/lib/supabase/client';
import {
  StakeholderCategory,
  PriorityItem,
  MissionOption,
  StakeholderQuestion,
  FeedbackResponse,
  SiteSettings,
} from '@/lib/types';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Search,
  Download,
  Trash2,
  Eye,
  Filter,
  RefreshCw,
  Loader2,
  Calendar,
  X,
  AlertTriangle,
  FileText,
  Printer,
} from 'lucide-react';

export default function AdminResponsesPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<FeedbackResponse[]>([]);
  const [categories, setCategories] = useState<StakeholderCategory[]>([]);
  const [priorityItems, setPriorityItems] = useState<PriorityItem[]>([]);
  const [missionOptions, setMissionOptions] = useState<MissionOption[]>([]);
  const [questions, setQuestions] = useState<StakeholderQuestion[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected response for Detail Modal
  const [selectedResponse, setSelectedResponse] = useState<FeedbackResponse | null>(null);

  // Response ID selected for Deletion Confirmation
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        responsesRes,
        categoriesRes,
        prioritiesRes,
        missionRes,
        questionsRes,
        settingsRes,
      ] = await Promise.all([
        supabase
          .from('responses')
          .select(
            '*, priority_ratings_list:response_priority_ratings(priority_item_id, rating), mission_selections_list:response_mission_selections(mission_option_id, other_text), answers_list:response_answers(question_id, answer_text, selected_option_ids), suggestion_list:response_suggestions(suggestion_text)'
          )
          .order('submitted_at', { ascending: false }),
        supabase.from('stakeholder_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('priority_items').select('*').order('sort_order', { ascending: true }),
        supabase.from('mission_options').select('*').order('sort_order', { ascending: true }),
        supabase.from('stakeholder_questions').select('*').order('sort_order', { ascending: true }),
        supabase.from('site_settings').select('*').eq('id', 1).single(),
      ]);

      if (responsesRes.data) {
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
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (prioritiesRes.data) setPriorityItems(prioritiesRes.data);
      if (missionRes.data) setMissionOptions(missionRes.data);
      if (questionsRes.data) setQuestions(questionsRes.data);
      if (settingsRes.data) setSettings(settingsRes.data);
    } catch (err) {
      console.error('Error loading responses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Category lookup maps
  const categoryMap = new Map(categories.map((c) => [c.id, c.label]));
  const priorityMap = new Map(priorityItems.map((p) => [p.id, p.label]));
  const missionMap = new Map(missionOptions.map((m) => [m.id, m.label]));
  const questionMap = new Map(questions.map((q) => [q.id, q.question_text]));

  // Filtering Logic
  const filteredResponses = responses.filter((r) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const nameMatch = r.name ? r.name.toLowerCase().includes(q) : false;
      const emailMatch = r.email ? r.email.toLowerCase().includes(q) : false;
      const phoneMatch = r.phone ? r.phone.includes(q) : false;
      if (!nameMatch && !emailMatch && !phoneMatch) return false;
    }

    if (categoryFilter && r.stakeholder_category_id !== categoryFilter) {
      return false;
    }

    if (startDate) {
      const submitted = new Date(r.submitted_at).getTime();
      const start = new Date(startDate).getTime();
      if (submitted < start) return false;
    }

    if (endDate) {
      const submitted = new Date(r.submitted_at).getTime();
      const end = new Date(endDate).getTime() + 86400000;
      if (submitted > end) return false;
    }

    return true;
  });

  // Handle Response Deletion
  const handleDeleteResponse = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('responses').delete().eq('id', deleteTargetId);
      if (error) throw error;

      setResponses((prev) => prev.filter((r) => r.id !== deleteTargetId));
      if (selectedResponse?.id === deleteTargetId) {
        setSelectedResponse(null);
      }
      setDeleteTargetId(null);
    } catch (err: any) {
      alert(`Failed to delete response: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle CSV Export
  const handleExportCSV = () => {
    if (filteredResponses.length === 0) {
      alert('No responses available to export with current filters.');
      return;
    }

    const flattenedData = filteredResponses.map((r) => {
      const row: Record<string, any> = {
        'Response ID': r.id,
        'Submitted At': new Date(r.submitted_at).toLocaleString(),
        'Full Name': r.name,
        'Phone Number': r.phone,
        'Email Address': r.email,
        'Stakeholder Category': categoryMap.get(r.stakeholder_category_id || '') || 'N/A',
      };

      // Flatten Priority Ratings (Part B)
      priorityItems.forEach((pItem) => {
        const rating = r.priority_ratings?.[pItem.id];
        row[`[Priority] ${pItem.label}`] = rating !== undefined ? rating : 'N/A';
      });

      // Flatten Mission Commitments (Part C)
      const selectedMissions = (r.mission_commitments || [])
        .map((m: any) => {
          const mId = typeof m === 'object' && m !== null ? m.option_id : m;
          const label = missionMap.get(mId) || mId;
          const other = typeof m === 'object' && m !== null && m.other_text ? ` (${m.other_text})` : '';
          return `${label}${other}`;
        })
        .join('; ');
      row['Mission Commitments Picked (Exactly 3)'] = selectedMissions;

      // Flatten Stakeholder Questions (Part D)
      questions.forEach((q) => {
        const answer = r.stakeholder_answers?.[q.id];
        let answerStr = 'N/A';
        if (answer !== undefined && answer !== null) {
          if (Array.isArray(answer)) {
            answerStr = answer.join('; ');
          } else if (typeof answer === 'object') {
            answerStr = JSON.stringify(answer);
          } else {
            answerStr = String(answer);
          }
        }
        row[`[Question] ${q.question_text}`] = answerStr;
      });

      row['Final Suggestion / Comments'] = r.suggestion || 'N/A';

      return row;
    });

    const csvString = Papa.unparse(flattenedData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stakeholder_feedback_responses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Full PDF Report Export
  const handleExportPDF = () => {
    if (filteredResponses.length === 0) {
      alert('No responses available to export with current filters.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const instituteName = settings?.institute_name || 'Institute Name';
    const formTitle = settings?.form_title || 'Stakeholder Feedback for Institute Vision & Mission';

    // PDF Title & Institutional Header
    doc.setFillColor(31, 78, 121); // #1F4E79
    doc.rect(0, 0, doc.internal.pageSize.width, 50, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(instituteName, 40, 28);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('IQAC • NBA / NAAC Accreditation Feedback Report', 40, 42);

    // Subtitle & Export Metadata
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Report: ${formTitle}`, 40, 75);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Generated on: ${new Date().toLocaleString()} | Total Records: ${filteredResponses.length}`,
      40,
      90
    );

    // Prepare AutoTable columns and rows
    const tableColumns = [
      { header: '#', dataKey: 'index' },
      { header: 'Submitted Date', dataKey: 'date' },
      { header: 'Name', dataKey: 'name' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Phone', dataKey: 'phone' },
      { header: 'Category', dataKey: 'category' },
      { header: 'Mission Commitments (Picked 3)', dataKey: 'mission' },
      { header: 'Final Suggestion', dataKey: 'suggestion' },
    ];

    const tableRows = filteredResponses.map((r, idx) => {
      const catLabel = categoryMap.get(r.stakeholder_category_id || '') || 'N/A';
      const selectedMissions = (r.mission_commitments || [])
        .map((m: any) => {
          const mId = typeof m === 'object' && m !== null ? m.option_id : m;
          const label = missionMap.get(mId) || mId;
          const other = typeof m === 'object' && m !== null && m.other_text ? ` (${m.other_text})` : '';
          return `${label}${other}`;
        })
        .join(', ');

      return {
        index: idx + 1,
        date: new Date(r.submitted_at).toLocaleDateString(),
        name: r.name || 'N/A',
        email: r.email || 'N/A',
        phone: r.phone || 'N/A',
        category: catLabel,
        mission: selectedMissions || 'N/A',
        suggestion: r.suggestion ? (r.suggestion.length > 50 ? r.suggestion.substring(0, 50) + '...' : r.suggestion) : 'N/A',
      };
    });

    autoTable(doc, {
      startY: 105,
      columns: tableColumns,
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [31, 78, 121],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59],
      },
      alternateRowStyles: {
        fillColor: [248, 249, 251],
      },
      margin: { left: 40, right: 40 },
    });

    doc.save(`stakeholder_feedback_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Handle Single Response PDF Export
  const handleExportSingleResponsePDF = (response: FeedbackResponse) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const instituteName = settings?.institute_name || 'Institute Name';
    const formTitle = settings?.form_title || 'Stakeholder Feedback for Institute Vision & Mission';
    const catLabel = categoryMap.get(response.stakeholder_category_id || '') || 'N/A';

    // Header banner
    doc.setFillColor(31, 78, 121);
    doc.rect(0, 0, doc.internal.pageSize.width, 60, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(instituteName, 40, 32);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('IQAC Official Stakeholder Feedback Record', 40, 48);

    let y = 85;

    // Document Title
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`Official Submission Record`, 40, y);
    y += 18;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Submitted Date: ${new Date(response.submitted_at).toLocaleString()} | ID: ${response.id}`, 40, y);
    y += 25;

    // Respondent Details Table
    autoTable(doc, {
      startY: y,
      head: [['Field', 'Respondent Details']],
      body: [
        ['Full Name', response.name],
        ['Stakeholder Category', catLabel],
        ['Email Address', response.email],
        ['Phone Number', response.phone],
      ],
      theme: 'plain',
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
      margin: { left: 40, right: 40 },
    });

    y = (doc as any).lastAutoTable.finalY + 20;

    // Part B Priorities Table
    const priorityRows = priorityItems.map((p) => {
      const rating = response.priority_ratings?.[p.id];
      return [p.label, rating !== undefined ? `${rating} / 5` : 'N/A'];
    });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Part B — Institutional Priorities Evaluation', 40, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [['Priority Area', 'Rating (1=Low, 5=Very High)']],
      body: priorityRows,
      theme: 'grid',
      headStyles: { fillColor: [31, 78, 121], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      margin: { left: 40, right: 40 },
    });

    y = (doc as any).lastAutoTable.finalY + 20;

    // Part C Mission Commitments
    const selectedMissions = (response.mission_commitments || []).map((m: any) => {
      const mId = typeof m === 'object' && m !== null ? m.option_id : m;
      const label = missionMap.get(mId) || mId;
      const other = typeof m === 'object' && m !== null && m.other_text ? ` (${m.other_text})` : '';
      return [`${label}${other}`];
    });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Part C — Core Mission Commitments (Selected 3)', 40, y);
    y += 10;

    autoTable(doc, {
      startY: y,
      head: [['Selected Mission Commitment Option']],
      body: selectedMissions.length > 0 ? selectedMissions : [['None Selected']],
      theme: 'grid',
      headStyles: { fillColor: [46, 125, 50], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      margin: { left: 40, right: 40 },
    });

    y = (doc as any).lastAutoTable.finalY + 20;

    // Part D Role Specific Answers
    const questionRows = Object.entries(response.stakeholder_answers || {}).map(([qId, ans]) => {
      const qText = questionMap.get(qId) || qId;
      let formatted = 'N/A';
      if (Array.isArray(ans)) formatted = ans.join(', ');
      else if (typeof ans === 'object') formatted = JSON.stringify(ans);
      else formatted = String(ans);
      return [qText, formatted];
    });

    if (questionRows.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Part D — Role Specific Question Answers', 40, y);
      y += 10;

      autoTable(doc, {
        startY: y,
        head: [['Question', 'Answer']],
        body: questionRows,
        theme: 'grid',
        headStyles: { fillColor: [31, 78, 121], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        margin: { left: 40, right: 40 },
      });

      y = (doc as any).lastAutoTable.finalY + 20;
    }

    // Part E Suggestion
    if (response.suggestion) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Part E — Additional Recommendations', 40, y);
      y += 10;

      autoTable(doc, {
        startY: y,
        head: [['Final Suggestion / Comments']],
        body: [[response.suggestion]],
        theme: 'grid',
        headStyles: { fillColor: [100, 116, 139], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
        margin: { left: 40, right: 40 },
      });
    }

    doc.save(`feedback_record_${(response.name || 'Respondent').replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <AdminNav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header & Export Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Stakeholder Responses
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              View, search, inspect detail breakdowns, and export feedback records as CSV or PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-700 text-xs font-semibold flex items-center gap-2 hover:bg-slate-50 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF Report</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-500"
            />
          </div>

          {/* Category filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-500"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-500"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-800" />
              <p className="text-sm font-medium">Loading Responses Data Table...</p>
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No response records match your current search and filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Submitted Date</th>
                    <th className="py-3.5 px-4">Respondent</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Contact</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredResponses.map((res) => {
                    const catLabel =
                      categoryMap.get(res.stakeholder_category_id || '') || 'Unspecified';

                    return (
                      <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-xs font-medium">
                          {new Date(res.submitted_at).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{res.name}</div>
                          <div className="text-xs text-slate-500">{res.email}</div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {catLabel}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                          {res.phone}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedResponse(res)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                              title="View Full Breakdown"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleExportSingleResponsePDF(res)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Download Single Response PDF"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeleteTargetId(res.id)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                              title="Delete Response"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Response Detail View */}
        {selectedResponse && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Response Breakdown
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Submitted on {new Date(selectedResponse.submitted_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportSingleResponsePDF(selectedResponse)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => setSelectedResponse(null)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Respondent summary */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Full Name</span>
                  <span className="font-semibold text-slate-900">{selectedResponse.name}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Category</span>
                  <span className="font-semibold text-slate-900">
                    {categoryMap.get(selectedResponse.stakeholder_category_id || '') || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Email</span>
                  <span className="text-slate-800">{selectedResponse.email}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Phone</span>
                  <span className="text-slate-800">{selectedResponse.phone}</span>
                </div>
              </div>

              {/* Part B: Priority Ratings */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Part B — Institutional Priorities (1–5 Ratings)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {priorityItems.map((p) => {
                    const rating = selectedResponse.priority_ratings?.[p.id];
                    return (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between"
                      >
                        <span className="text-slate-700 font-medium truncate mr-2">
                          {p.label}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-bold">
                          {rating !== undefined ? rating : '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Part C: Mission Commitments */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Part C — Selected 3 Mission Commitments
                </h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {(selectedResponse.mission_commitments || []).map((m: any, idx: number) => {
                    const mId = typeof m === 'object' && m !== null ? m.option_id : m;
                    const label = missionMap.get(mId) || mId;
                    const other = typeof m === 'object' && m !== null && m.other_text ? ` (${m.other_text})` : '';
                    return (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold"
                      >
                        {label}{other}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Part D: Stakeholder Specific Answers */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Part D — Role Specific Answers
                </h3>
                <div className="space-y-3">
                  {Object.entries(selectedResponse.stakeholder_answers || {}).map(
                    ([qId, ans]) => {
                      const qText = questionMap.get(qId) || qId;
                      let formatted = 'N/A';
                      if (Array.isArray(ans)) formatted = ans.join(', ');
                      else if (typeof ans === 'object') formatted = JSON.stringify(ans, null, 2);
                      else formatted = String(ans);

                      return (
                        <div
                          key={qId}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1"
                        >
                          <p className="text-xs font-semibold text-slate-700">{qText}</p>
                          <p className="text-xs text-slate-900 font-medium whitespace-pre-wrap">
                            {formatted}
                          </p>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Part E: Suggestion */}
              {selectedResponse.suggestion && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                    Part E — Final Suggestion
                  </h3>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 leading-relaxed whitespace-pre-wrap">
                    {selectedResponse.suggestion}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Delete Confirmation */}
        {deleteTargetId && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Delete Response Record?
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  This action is permanent and cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteTargetId(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeleteResponse}
                  disabled={isDeleting}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Confirm Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
