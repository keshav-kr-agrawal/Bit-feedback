import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const supabase = createAdminClient();

    // 1. Try atomic RPC function submission first
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'submit_stakeholder_response',
      { p_payload: payload }
    );

    if (!rpcError) {
      return NextResponse.json({ success: true, response_id: rpcData?.response_id || 'rpc-ok' });
    }

    console.warn('RPC submission unavailable, executing direct table insert fallback:', rpcError.message);

    // 2. Direct table insertion fallback
    const { data: resp, error: parentErr } = await supabase
      .from('responses')
      .insert([
        {
          name: payload.name || null,
          phone: payload.phone || null,
          email: payload.email || null,
          stakeholder_category_id:
            payload.stakeholder_category_id && payload.stakeholder_category_id.length === 36
              ? payload.stakeholder_category_id
              : null,
          priority_ratings: payload.priority_ratings || {},
          mission_commitments: payload.mission_selections || [],
          stakeholder_answers: payload.stakeholder_answers || {},
          suggestion: payload.suggestion || null,
        },
      ])
      .select()
      .single();

    if (parentErr) {
      console.error('Parent response insert error:', parentErr.message);
      return NextResponse.json({ success: false, error: parentErr.message }, { status: 400 });
    }

    const resId = resp.id;

    // Part B Priority Ratings
    if (payload.priority_ratings) {
      const pRows = Object.entries(payload.priority_ratings)
        .filter(([pId]) => pId.length === 36)
        .map(([pId, rating]) => ({
          response_id: resId,
          priority_item_id: pId,
          rating,
        }));
      if (pRows.length > 0) {
        const { error: pErr } = await supabase.from('response_priority_ratings').insert(pRows);
        if (pErr) console.error('Priority ratings insert error:', pErr.message);
      }
    }

    // Part C Mission Selections
    if (payload.mission_selections && Array.isArray(payload.mission_selections)) {
      const mRows = payload.mission_selections.map((m: any) => ({
        response_id: resId,
        mission_option_id:
          m.option_id && m.option_id.length === 36 ? m.option_id : null,
        other_text: m.other_text || null,
      }));
      if (mRows.length > 0) {
        const { error: mErr } = await supabase.from('response_mission_selections').insert(mRows);
        if (mErr) console.error('Mission selections insert error:', mErr.message);
      }
    }

    // Part D Question Answers
    if (payload.stakeholder_answers) {
      const aRows = Object.entries(payload.stakeholder_answers).map(
        ([qId, val]: [string, any]) => ({
          response_id: resId,
          question_id: qId && qId.length === 36 ? qId : null,
          answer_text: typeof val === 'string' ? val : val.text || null,
          selected_option_ids: Array.isArray(val.selected) ? val.selected : null,
        })
      );
      if (aRows.length > 0) {
        const { error: aErr } = await supabase.from('response_answers').insert(aRows);
        if (aErr) console.error('Answers insert error:', aErr.message);
      }
    }

    // Part E Suggestion
    if (payload.suggestion && payload.suggestion.trim()) {
      const { error: sErr } = await supabase.from('response_suggestions').insert([
        {
          response_id: resId,
          suggestion_text: payload.suggestion.trim(),
        },
      ]);
      if (sErr) console.error('Suggestion insert error:', sErr.message);
    }

    return NextResponse.json({ success: true, response_id: resId });
  } catch (err: any) {
    console.error('Server error processing feedback submission:', err);
    return NextResponse.json({ success: false, error: err.message || 'Server error' }, { status: 500 });
  }
}
