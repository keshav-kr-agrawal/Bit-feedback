import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');

    const supabase = createClient();

    let query = supabase
      .from('stakeholder_questions')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const [questionsRes, optionsRes] = await Promise.all([
      query,
      supabase
        .from('stakeholder_question_options')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ]);

    if (questionsRes.error) {
      return NextResponse.json({ error: questionsRes.error.message }, { status: 500 });
    }

    const questionsList = questionsRes.data || [];
    const optionsList = optionsRes.data || [];

    const merged = questionsList.map((q: any) => ({
      ...q,
      options: optionsList
        .filter((o: any) => o.question_id === q.id)
        .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)),
    }));

    return NextResponse.json({ questions: merged });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
