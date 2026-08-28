import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('stakeholder_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mappedCategories = (data || []).map((c: any) =>
      c.label.trim() === 'Staff' || c.slug === 'staff'
        ? { ...c, label: 'Technical Staff', slug: 'technical_staff' }
        : c
    );

    return NextResponse.json({ categories: mappedCategories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
