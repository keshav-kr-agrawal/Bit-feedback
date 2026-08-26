-- ============================================================
-- BANGALORE INSTITUTE OF TECHNOLOGY — FEEDBACK SYSTEM SCHEMA
-- ============================================================

create extension if not exists "uuid-ossp";

-- 1. SITE SETTINGS (singleton row)
create table if not exists site_settings (
  id int primary key default 1,
  institute_name text not null default 'Bangalore Institute of Technology',
  logo_url text,
  form_title text not null default 'Stakeholder Feedback for Institute Vision & Mission',
  form_intro_text text not null default 'Your feedback will help shape the future Vision and Mission of Bangalore Institute of Technology.',
  is_form_open boolean not null default true,
  closed_message text not null default 'This feedback form is currently closed. Thank you for your interest.',
  thank_you_message text not null default 'Thank you for your valuable feedback. Your response has been recorded and will help shape the future Vision and Mission of Bangalore Institute of Technology.',
  primary_color text not null default '#1F4E79',
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

insert into site_settings (id) 
values (1) 
on conflict (id) do nothing;

-- 2. STAKEHOLDER CATEGORIES
create table if not exists stakeholder_categories (
  id uuid primary key default uuid_generate_v4(),
  label text not null,
  slug text not null unique,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 3. PART B: INSTITUTIONAL PRIORITY ITEMS
create table if not exists priority_items (
  id uuid primary key default uuid_generate_v4(),
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 4. MISSION CHECKBOX OPTIONS
create table if not exists mission_options (
  id uuid primary key default uuid_generate_v4(),
  label text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 5. STAKEHOLDER-SPECIFIC QUESTIONS
create table if not exists stakeholder_questions (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid not null references stakeholder_categories(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('checkboxes','paragraph','multiple_choice','multiple_choice_grid','rating_scale')),
  is_required boolean not null default true,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 6. QUESTION OPTIONS & GRID STRUCTURE
create table if not exists stakeholder_question_options (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references stakeholder_questions(id) on delete cascade,
  option_label text not null,
  option_group text not null default 'option', -- 'option', 'row', or 'column'
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 7. RESPONSES PARENT TABLE
create table if not exists responses (
  id uuid primary key default uuid_generate_v4(),
  name text,
  phone text,
  email text,
  stakeholder_category_id uuid references stakeholder_categories(id),
  submitted_at timestamptz not null default now(),
  ip_hash text
);

-- 8. RESPONSE PRIORITY RATINGS (Part B)
create table if not exists response_priority_ratings (
  id uuid primary key default uuid_generate_v4(),
  response_id uuid not null references responses(id) on delete cascade,
  priority_item_id uuid not null references priority_items(id),
  rating int not null check (rating >= 1 and rating <= 5)
);

-- 9. RESPONSE MISSION SELECTIONS (Part C)
create table if not exists response_mission_selections (
  id uuid primary key default uuid_generate_v4(),
  response_id uuid not null references responses(id) on delete cascade,
  mission_option_id uuid references mission_options(id),
  other_text text
);

-- 10. RESPONSE ANSWERS (Part D)
create table if not exists response_answers (
  id uuid primary key default uuid_generate_v4(),
  response_id uuid not null references responses(id) on delete cascade,
  question_id uuid not null references stakeholder_questions(id),
  answer_text text,
  selected_option_ids jsonb
);

-- 11. RESPONSE SUGGESTIONS (Part E)
create table if not exists response_suggestions (
  id uuid primary key default uuid_generate_v4(),
  response_id uuid not null references responses(id) on delete cascade,
  suggestion_text text
);

-- 12. ADMIN USERS MARKER
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table site_settings enable row level security;
alter table stakeholder_categories enable row level security;
alter table priority_items enable row level security;
alter table mission_options enable row level security;
alter table stakeholder_questions enable row level security;
alter table stakeholder_question_options enable row level security;
alter table responses enable row level security;
alter table response_priority_ratings enable row level security;
alter table response_mission_selections enable row level security;
alter table response_answers enable row level security;
alter table response_suggestions enable row level security;
alter table admin_users enable row level security;

-- Helper function: is the current user an admin?
create or replace function is_admin() returns boolean as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$ language sql security definer stable;

-- Helper function: is the form currently open for submissions?
create or replace function is_form_currently_open() returns boolean as $$
  select coalesce((select is_form_open from site_settings where id = 1), true);
$$ language sql security definer stable;

-- Drop existing policies if re-running
drop policy if exists "public read settings" on site_settings;
drop policy if exists "public read active categories" on stakeholder_categories;
drop policy if exists "public read active priorities" on priority_items;
drop policy if exists "public read active mission options" on mission_options;
drop policy if exists "public read active questions" on stakeholder_questions;
drop policy if exists "public read active question options" on stakeholder_question_options;
drop policy if exists "public insert responses" on responses;
drop policy if exists "public insert response_priority_ratings" on response_priority_ratings;
drop policy if exists "public insert response_mission_selections" on response_mission_selections;
drop policy if exists "public insert response_answers" on response_answers;
drop policy if exists "public insert response_suggestions" on response_suggestions;

drop policy if exists "admin full access settings" on site_settings;
drop policy if exists "admin full access categories" on stakeholder_categories;
drop policy if exists "admin full access priorities" on priority_items;
drop policy if exists "admin full access mission options" on mission_options;
drop policy if exists "admin full access questions" on stakeholder_questions;
drop policy if exists "admin full access question options" on stakeholder_question_options;
drop policy if exists "admin read responses" on responses;
drop policy if exists "admin delete responses" on responses;

-- Public READ policies
create policy "public read settings" on site_settings for select using (true);
create policy "public read active categories" on stakeholder_categories for select using (is_active = true);
create policy "public read active priorities" on priority_items for select using (is_active = true);
create policy "public read active mission options" on mission_options for select using (is_active = true);
create policy "public read active questions" on stakeholder_questions for select using (is_active = true);
create policy "public read active question options" on stakeholder_question_options for select using (is_active = true);

-- Public INSERT policies (blocked if form is closed)
create policy "public insert responses" on responses for insert with check (is_form_currently_open());
create policy "public insert response_priority_ratings" on response_priority_ratings for insert with check (is_form_currently_open());
create policy "public insert response_mission_selections" on response_mission_selections for insert with check (is_form_currently_open());
create policy "public insert response_answers" on response_answers for insert with check (is_form_currently_open());
create policy "public insert response_suggestions" on response_suggestions for insert with check (is_form_currently_open());

-- Admin FULL ACCESS policies
create policy "admin full access settings" on site_settings for all using (is_admin()) with check (is_admin());
create policy "admin full access categories" on stakeholder_categories for all using (is_admin()) with check (is_admin());
create policy "admin full access priorities" on priority_items for all using (is_admin()) with check (is_admin());
create policy "admin full access mission options" on mission_options for all using (is_admin()) with check (is_admin());
create policy "admin full access questions" on stakeholder_questions for all using (is_admin()) with check (is_admin());
create policy "admin full access question options" on stakeholder_question_options for all using (is_admin()) with check (is_admin());
create policy "admin read responses" on responses for select using (is_admin());
create policy "admin delete responses" on responses for delete using (is_admin());
create policy "admin read admin_users" on admin_users for select using (is_admin());

-- ============================================================
-- ATOMIC RESPONSE SUBMISSION RPC FUNCTION
-- ============================================================
create or replace function submit_feedback_response(
  p_name text,
  p_phone text,
  p_email text,
  p_stakeholder_category_id uuid,
  p_priority_ratings jsonb,       -- { "<priority_item_id>": rating }
  p_mission_selections jsonb,     -- [ { "option_id": "...", "other_text": "..." } ]
  p_stakeholder_answers jsonb,   -- { "<question_id>": { "text": "...", "selected": [...] } }
  p_suggestion text
) returns uuid as $$
declare
  v_response_id uuid;
  v_item record;
  v_opt record;
  v_ans record;
begin
  if not is_form_currently_open() then
    raise exception 'The feedback form is currently closed for submissions.';
  end if;

  -- 1. Insert Parent Response
  insert into responses (name, phone, email, stakeholder_category_id)
  values (p_name, p_phone, p_email, p_stakeholder_category_id)
  returning id into v_response_id;

  -- 2. Insert Priority Ratings (Part B)
  if p_priority_ratings is not null then
    for v_item in select * from jsonb_each_text(p_priority_ratings) loop
      insert into response_priority_ratings (response_id, priority_item_id, rating)
      values (v_response_id, v_item.key::uuid, v_item.value::int);
    end loop;
  end if;

  -- 3. Insert Mission Selections (Part C)
  if p_mission_selections is not null then
    for v_opt in select * from jsonb_to_recordset(p_mission_selections) as x(option_id text, other_text text) loop
      insert into response_mission_selections (response_id, mission_option_id, other_text)
      values (
        v_response_id,
        case when v_opt.option_id is not null and v_opt.option_id ~ '^[0-9a-fA-F-]{36}$' then v_opt.option_id::uuid else null end,
        v_opt.other_text
      );
    end loop;
  end if;

  -- 4. Insert Question Answers (Part D)
  if p_stakeholder_answers is not null then
    for v_ans in select * from jsonb_each(p_stakeholder_answers) loop
      insert into response_answers (response_id, question_id, answer_text, selected_option_ids)
      values (
        v_response_id,
        v_ans.key::uuid,
        v_ans.value->>'text',
        v_ans.value->'selected'
      );
    end loop;
  end if;

  -- 5. Insert Suggestion (Part E)
  if p_suggestion is not null and trim(p_suggestion) <> '' then
    insert into response_suggestions (response_id, suggestion_text)
    values (v_response_id, p_suggestion);
  end if;

  return v_response_id;
end;
$$ language plpgsql security definer;
