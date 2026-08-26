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
-- ROW LEVEL SECURITY (RLS) ENABLEMENT & POLICIES
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

-- Drop existing policies for clean idempotency
drop policy if exists "public can read site settings" on site_settings;
drop policy if exists "public can read active stakeholder categories" on stakeholder_categories;
drop policy if exists "public can read active priority items" on priority_items;
drop policy if exists "public can read active mission options" on mission_options;
drop policy if exists "public can read active stakeholder questions" on stakeholder_questions;
drop policy if exists "public can read active question options" on stakeholder_question_options;

drop policy if exists "admin full access settings" on site_settings;
drop policy if exists "admin full access categories" on stakeholder_categories;
drop policy if exists "admin full access priorities" on priority_items;
drop policy if exists "admin full access mission options" on mission_options;
drop policy if exists "admin full access questions" on stakeholder_questions;
drop policy if exists "admin full access question options" on stakeholder_question_options;
drop policy if exists "admin read responses" on responses;
drop policy if exists "admin delete responses" on responses;
drop policy if exists "admin read admin_users" on admin_users;

-- Public READ policies for active content tables
create policy "public can read site settings" on site_settings for select using (true);
create policy "public can read active stakeholder categories" on stakeholder_categories for select using (is_active = true);
create policy "public can read active priority items" on priority_items for select using (is_active = true);
create policy "public can read active mission options" on mission_options for select using (is_active = true);
create policy "public can read active stakeholder questions" on stakeholder_questions for select using (is_active = true);
create policy "public can read active question options" on stakeholder_question_options for select using (is_active = true);

-- Public INSERT policies for feedback response tables
drop policy if exists "public can insert responses" on responses;
create policy "public can insert responses" on responses for insert with check (true);

drop policy if exists "public can insert priority ratings" on response_priority_ratings;
create policy "public can insert priority ratings" on response_priority_ratings for insert with check (true);

drop policy if exists "public can insert mission selections" on response_mission_selections;
create policy "public can insert mission selections" on response_mission_selections for insert with check (true);

drop policy if exists "public can insert answers" on response_answers;
create policy "public can insert answers" on response_answers for insert with check (true);

drop policy if exists "public can insert suggestions" on response_suggestions;
create policy "public can insert suggestions" on response_suggestions for insert with check (true);

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
-- SECURE SECURITY DEFINER RPC FUNCTION FOR PUBLIC SUBMISSIONS
-- ============================================================
create or replace function submit_stakeholder_response(p_payload jsonb)
returns jsonb as $$
declare
  v_response_id uuid;
  v_name text;
  v_phone text;
  v_email text;
  v_category_id uuid;
  v_priority_ratings jsonb;
  v_mission_selections jsonb;
  v_stakeholder_answers jsonb;
  v_suggestion text;
  v_mission_count int;
  v_item record;
  v_opt record;
  v_ans record;
  v_req_q record;
  v_provided_ans jsonb;
begin
  -- 1. Check if the feedback form is open
  if not is_form_currently_open() then
    raise exception 'This feedback form is currently closed for submissions.';
  end if;

  -- 2. Extract payload fields
  v_name := p_payload->>'name';
  v_phone := p_payload->>'phone';
  v_email := p_payload->>'email';
  v_category_id := (p_payload->>'stakeholder_category_id')::uuid;
  v_priority_ratings := p_payload->'priority_ratings';
  v_mission_selections := p_payload->'mission_selections';
  v_stakeholder_answers := p_payload->'stakeholder_answers';
  v_suggestion := p_payload->>'suggestion';

  -- 3. Validate Stakeholder Category
  if v_category_id is null or not exists (
    select 1 from stakeholder_categories where id = v_category_id and is_active = true
  ) then
    raise exception 'Please select a valid stakeholder category.';
  end if;

  -- 4. Server-Side Validation: Enforce Exactly 3 Mission Commitments Selected
  v_mission_count := jsonb_array_length(coalesce(v_mission_selections, '[]'::jsonb));
  if v_mission_count <> 3 then
    raise exception 'Please select exactly 3 mission commitments (received %).', v_mission_count;
  end if;

  -- 5. Server-Side Validation: Required Questions Answered for Category
  for v_req_q in 
    select id, question_text, question_type 
    from stakeholder_questions 
    where category_id = v_category_id and is_required = true and is_active = true
  loop
    v_provided_ans := v_stakeholder_answers->(v_req_q.id::text);
    if v_provided_ans is null or (
      v_provided_ans->>'text' is null and 
      (v_provided_ans->'selected' is null or jsonb_array_length(coalesce(v_provided_ans->'selected', '[]'::jsonb)) = 0)
    ) then
      raise exception 'Please answer the required question: "%"', v_req_q.question_text;
    end if;
  end loop;

  -- 6. Insert Parent Response
  insert into responses (name, phone, email, stakeholder_category_id)
  values (nullif(trim(v_name), ''), nullif(trim(v_phone), ''), nullif(trim(v_email), ''), v_category_id)
  returning id into v_response_id;

  -- 7. Insert Part B Priority Ratings
  if v_priority_ratings is not null then
    for v_item in select * from jsonb_each_text(v_priority_ratings) loop
      insert into response_priority_ratings (response_id, priority_item_id, rating)
      values (v_response_id, v_item.key::uuid, v_item.value::int);
    end loop;
  end if;

  -- 8. Insert Part C Mission Selections
  if v_mission_selections is not null then
    for v_opt in select * from jsonb_to_recordset(v_mission_selections) as x(option_id text, other_text text) loop
      insert into response_mission_selections (response_id, mission_option_id, other_text)
      values (
        v_response_id,
        case when v_opt.option_id is not null and v_opt.option_id ~ '^[0-9a-fA-F-]{36}$' then v_opt.option_id::uuid else null end,
        v_opt.other_text
      );
    end loop;
  end if;

  -- 9. Insert Part D Stakeholder Answers
  if v_stakeholder_answers is not null then
    for v_ans in select * from jsonb_each(v_stakeholder_answers) loop
      insert into response_answers (response_id, question_id, answer_text, selected_option_ids)
      values (
        v_response_id,
        v_ans.key::uuid,
        v_ans.value->>'text',
        v_ans.value->'selected'
      );
    end loop;
  end if;

  -- 10. Insert Part E Additional Suggestion
  if v_suggestion is not null and trim(v_suggestion) <> '' then
    insert into response_suggestions (response_id, suggestion_text)
    values (v_response_id, trim(v_suggestion));
  end if;

  return jsonb_build_object('success', true, 'response_id', v_response_id);
end;
$$ language plpgsql security definer;

-- Revoke public access and grant execute permissions to anon and authenticated
revoke all on function submit_stakeholder_response(jsonb) from public;
grant execute on function submit_stakeholder_response(jsonb) to anon, authenticated;
