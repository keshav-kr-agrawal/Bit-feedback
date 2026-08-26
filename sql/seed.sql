-- ============================================================
-- SEED DATA FOR BANGALORE INSTITUTE OF TECHNOLOGY FEEDBACK SYSTEM
-- ============================================================

-- 1. STAKEHOLDER CATEGORIES (Part A Dropdown Order)
insert into stakeholder_categories (label, slug, sort_order, is_active) values
  ('Management / Governing Body', 'management', 1, true),
  ('Faculty', 'faculty', 2, true),
  ('Staff', 'staff', 3, true),
  ('Student', 'student', 4, true),
  ('Alumni', 'alumni', 5, true),
  ('Parent', 'parent', 6, true),
  ('Employer / Industry', 'employer', 7, true),
  ('Academic Expert', 'academic_expert', 8, true),
  ('Society / Community', 'society', 9, true),
  ('Other', 'other', 10, true)
on conflict (slug) do nothing;

-- 2. PART B: INSTITUTIONAL PRIORITY ITEMS
insert into priority_items (label, sort_order, is_active) values
  ('Quality and outcome-based education', 1, true),
  ('Emerging Technologies', 2, true),
  ('Research and innovation', 3, true),
  ('Entrepreneurship and start-up culture', 4, true),
  ('Industry collaboration', 5, true),
  ('Employability and career readiness', 6, true),
  ('Social responsibility', 7, true),
  ('Environmental Sustainability', 8, true),
  ('Leadership & Holistic Development', 9, true),
  ('Global competence', 10, true),
  ('Lifelong learning', 11, true),
  ('Alumni Engagement', 12, true);

-- 3. MISSION CHECKBOX OPTIONS
insert into mission_options (label, sort_order, is_active) values
  ('High-quality education', 1, true),
  ('Technically competent graduates', 2, true),
  ('Practical / experiential learning', 3, true),
  ('Research & innovation', 4, true),
  ('Entrepreneurship', 5, true),
  ('Industry collaboration', 6, true),
  ('Emerging technologies', 7, true),
  ('Ethical and socially responsible professionals', 8, true),
  ('Sustainability', 9, true),
  ('Leadership & communication skills', 10, true),
  ('Lifelong learning', 11, true),
  ('Alumni engagement', 12, true),
  ('Interdisciplinary education', 13, true),
  ('Global exposure', 14, true),
  ('Other', 15, true);

-- 4. STAKEHOLDER-SPECIFIC QUESTIONS & OPTIONS SEEDING
do $$
declare
  cat_student uuid;
  cat_faculty uuid;
  cat_alumni uuid;
  cat_employer uuid;
  cat_parent uuid;
  cat_management uuid;
  cat_society uuid;

  q_id uuid;
begin
  select id into cat_student from stakeholder_categories where slug = 'student';
  select id into cat_faculty from stakeholder_categories where slug = 'faculty';
  select id into cat_alumni from stakeholder_categories where slug = 'alumni';
  select id into cat_employer from stakeholder_categories where slug = 'employer';
  select id into cat_parent from stakeholder_categories where slug = 'parent';
  select id into cat_management from stakeholder_categories where slug = 'management';
  select id into cat_society from stakeholder_categories where slug = 'society';

  -- STUDENT QUESTIONS
  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_student, 'What do you expect most from the Institute?', 'checkboxes', true, 1) returning id into q_id;
  insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
    (q_id, 'Quality teaching', 'option', 1), (q_id, 'Practical learning', 'option', 2),
    (q_id, 'Placement', 'option', 3), (q_id, 'Internships', 'option', 4),
    (q_id, 'Industry exposure', 'option', 5), (q_id, 'Emerging tech skills', 'option', 6),
    (q_id, 'Research', 'option', 7), (q_id, 'Entrepreneurship', 'option', 8),
    (q_id, 'Higher education guidance', 'option', 9), (q_id, 'Soft skills', 'option', 10),
    (q_id, 'Ethics', 'option', 11), (q_id, 'Personality development', 'option', 12);

  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_student, 'Which skills should the Institute emphasize for your future career?', 'checkboxes', true, 2) returning id into q_id;
  insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
    (q_id, 'Technical skills', 'option', 1), (q_id, 'Problem solving', 'option', 2),
    (q_id, 'Communication', 'option', 3), (q_id, 'Teamwork', 'option', 4),
    (q_id, 'Leadership', 'option', 5), (q_id, 'Innovation', 'option', 6),
    (q_id, 'Entrepreneurship', 'option', 7), (q_id, 'Digital/AI skills', 'option', 8),
    (q_id, 'Professional ethics', 'option', 9), (q_id, 'Lifelong learning', 'option', 10);

  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_student, 'What one improvement would you like to see in the Institute in the coming years?', 'paragraph', false, 3);

  -- FACULTY QUESTIONS
  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_faculty, 'Which areas should the Institute strengthen to achieve academic excellence?', 'checkboxes', true, 1) returning id into q_id;
  insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
    (q_id, 'Teaching-learning process', 'option', 1), (q_id, 'Research', 'option', 2),
    (q_id, 'Sponsored projects', 'option', 3), (q_id, 'Consultancy', 'option', 4),
    (q_id, 'Innovation', 'option', 5), (q_id, 'FDP', 'option', 6),
    (q_id, 'Industry collaboration', 'option', 7), (q_id, 'Interdisciplinary activities', 'option', 8),
    (q_id, 'Digital technologies', 'option', 9), (q_id, 'International collaboration', 'option', 10),
    (q_id, 'Entrepreneurship', 'option', 11), (q_id, 'Infrastructure', 'option', 12);

  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_faculty, 'What institutional support would help faculty contribute more effectively?', 'paragraph', false, 2);

  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_faculty, 'What major theme should be reflected in the future Vision?', 'paragraph', false, 3);

  -- ALUMNI QUESTIONS
  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_alumni, 'Based on your professional experience, which areas should the Institute strengthen?', 'checkboxes', true, 1) returning id into q_id;
  insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
    (q_id, 'Technical competency', 'option', 1), (q_id, 'Practical knowledge', 'option', 2),
    (q_id, 'Industry exposure', 'option', 3), (q_id, 'Communication', 'option', 4),
    (q_id, 'Leadership', 'option', 5), (q_id, 'Research', 'option', 6),
    (q_id, 'Innovation', 'option', 7), (q_id, 'Entrepreneurship', 'option', 8),
    (q_id, 'Ethics', 'option', 9), (q_id, 'Emerging technologies', 'option', 10),
    (q_id, 'Global exposure', 'option', 11), (q_id, 'Alumni interaction', 'option', 12);

  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_alumni, 'Which competencies gained during your studies have helped you most in your career?', 'paragraph', false, 2);

  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_alumni, 'How would you like the Institute to be recognized in the next 10–15 years?', 'paragraph', false, 3);

  -- EMPLOYER QUESTIONS
  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_employer, 'Which qualities do you expect from graduates of our Institute?', 'multiple_choice_grid', true, 1) returning id into q_id;
  -- Grid Rows
  insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
    (q_id, 'Strong technical knowledge', 'row', 1), (q_id, 'Problem solving', 'row', 2),
    (q_id, 'Practical skills', 'row', 3), (q_id, 'Communication', 'row', 4),
    (q_id, 'Teamwork', 'row', 5), (q_id, 'Leadership', 'row', 6),
    (q_id, 'Adaptability', 'row', 7), (q_id, 'Emerging technologies', 'row', 8),
    (q_id, 'Innovation', 'row', 9), (q_id, 'Professional ethics', 'row', 10),
    (q_id, 'Lifelong learning', 'row', 11);
  -- Grid Columns
  insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
    (q_id, 'Not Important', 'column', 1), (q_id, 'Somewhat Important', 'column', 2),
    (q_id, 'Important', 'column', 3), (q_id, 'Very Important', 'column', 4);

  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_employer, 'Which areas should the Institute strengthen to improve industry readiness?', 'checkboxes', true, 2) returning id into q_id;
  insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
    (q_id, 'Industry-oriented curriculum', 'option', 1), (q_id, 'Internships', 'option', 2),
    (q_id, 'Industry projects', 'option', 3), (q_id, 'Professional certifications', 'option', 4),
    (q_id, 'Emerging technology training', 'option', 5), (q_id, 'Soft skills', 'option', 6),
    (q_id, 'Entrepreneurship', 'option', 7), (q_id, 'Research collaboration', 'option', 8),
    (q_id, 'Industry mentoring', 'option', 9);

  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_employer, 'What should be the major focus of the Institute over the next decade?', 'paragraph', false, 3);

  -- PARENT QUESTIONS
  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_parent, 'What are your major expectations from the Institute?', 'checkboxes', true, 1) returning id into q_id;
  insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
    (q_id, 'Quality education', 'option', 1), (q_id, 'Career opportunities', 'option', 2),
    (q_id, 'Discipline', 'option', 3), (q_id, 'Safe learning environment', 'option', 4),
    (q_id, 'Technical competence', 'option', 5), (q_id, 'Communication skills', 'option', 6),
    (q_id, 'Ethical values', 'option', 7), (q_id, 'Personality development', 'option', 8),
    (q_id, 'Higher education opportunities', 'option', 9), (q_id, 'Entrepreneurship', 'option', 10),
    (q_id, 'Social responsibility', 'option', 11);

  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_parent, 'What qualities would you like students to develop by the time they graduate?', 'paragraph', false, 2);

  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_parent, 'What should the Institute prioritize for its future development?', 'paragraph', false, 3);

  -- MANAGEMENT QUESTIONS
  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_management, 'Which areas are most important for the long-term growth of the Institute?', 'checkboxes', true, 1) returning id into q_id;
  insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
    (q_id, 'Academic excellence', 'option', 1), (q_id, 'Research excellence', 'option', 2),
    (q_id, 'Institutional reputation', 'option', 3), (q_id, 'Innovation', 'option', 4),
    (q_id, 'Entrepreneurship', 'option', 5), (q_id, 'Industry collaboration', 'option', 6),
    (q_id, 'Global recognition', 'option', 7), (q_id, 'Emerging technologies', 'option', 8),
    (q_id, 'Sustainability', 'option', 9), (q_id, 'Social responsibility', 'option', 10),
    (q_id, 'Governance', 'option', 11), (q_id, 'Infrastructure development', 'option', 12);

  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_management, 'Where should the Institute position itself in the next 10–15 years?', 'paragraph', false, 2);

  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_management, 'Which institutional values are most important for achieving academic excellence and societal responsibility?', 'paragraph', false, 3);

  -- SOCIETY QUESTIONS
  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_society, 'What contributions do you expect from an engineering institution to society?', 'checkboxes', true, 1) returning id into q_id;
  insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
    (q_id, 'Ethical professionals', 'option', 1), (q_id, 'Sustainable solutions', 'option', 2),
    (q_id, 'Community service', 'option', 3), (q_id, 'Environmental responsibility', 'option', 4),
    (q_id, 'Technology for societal problems', 'option', 5), (q_id, 'Inclusive development', 'option', 6),
    (q_id, 'Innovation for social benefit', 'option', 7), (q_id, 'Employment generation', 'option', 8),
    (q_id, 'National development', 'option', 9);

  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_society, 'Which social responsibilities should be reflected in the Institute Mission?', 'paragraph', false, 2);

  insert into stakeholder_questions (category_id, question_text, question_type, is_required, sort_order)
  values (cat_society, 'What should graduates contribute to society?', 'paragraph', false, 3);

end $$;
