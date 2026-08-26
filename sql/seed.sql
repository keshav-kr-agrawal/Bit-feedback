-- ============================================================
-- BANGALORE INSTITUTE OF TECHNOLOGY — VERBATIM SEED DATASET
-- ============================================================

-- Clean existing seed data
truncate table stakeholder_categories cascade;
truncate table priority_items cascade;
truncate table mission_options cascade;

-- 1. STAKEHOLDER CATEGORIES (10 categories)
insert into stakeholder_categories (id, label, slug, sort_order, is_active) values
('10000000-0000-0000-0000-000000000001', 'Management / Governing Body', 'management', 1, true),
('10000000-0000-0000-0000-000000000002', 'Faculty', 'faculty', 2, true),
('10000000-0000-0000-0000-000000000003', 'Employer / Industry', 'employer', 3, true),
('10000000-0000-0000-0000-000000000004', 'Student', 'student', 4, true),
('10000000-0000-0000-0000-000000000005', 'Alumni', 'alumni', 5, true),
('10000000-0000-0000-0000-000000000006', 'Parent', 'parent', 6, true),
('10000000-0000-0000-0000-000000000007', 'Society / Community', 'society', 7, true),
('10000000-0000-0000-0000-000000000008', 'Staff', 'staff', 8, true),
('10000000-0000-0000-0000-000000000009', 'Academic Expert', 'academic_expert', 9, true),
('10000000-0000-0000-0000-000000000010', 'Other', 'other', 10, true);

-- 2. PART B: INSTITUTIONAL PRIORITY ITEMS (12 items)
insert into priority_items (id, label, sort_order, is_active) values
('20000000-0000-0000-0000-000000000001', 'Academic Excellence & Outcome-Based Education', 1, true),
('20000000-0000-0000-0000-000000000002', 'Research, Innovation & Intellectual Property (Patents)', 2, true),
('20000000-0000-0000-0000-000000000003', 'Industry Collaboration, Internships & Placements', 3, true),
('20000000-0000-0000-0000-000000000004', 'Entrepreneurship & Startup Incubation Ecosystem', 4, true),
('20000000-0000-0000-0000-000000000005', 'Infrastructure Development & State-of-the-Art Labs', 5, true),
('20000000-0000-0000-0000-000000000006', 'Faculty Development & Continuous Skill Upgradation', 6, true),
('20000000-0000-0000-0000-000000000007', 'Student Holistic Growth, Leadership & Ethics', 7, true),
('20000000-0000-0000-0000-000000000008', 'Global Exposure & International Academic Partnerships', 8, true),
('20000000-0000-0000-0000-000000000009', 'Emerging Technologies Integration (AI, Data Science, IoT)', 9, true),
('20000000-0000-0000-0000-000000000010', 'Social Responsibility, Sustainability & Community Impact', 10, true),
('20000000-0000-0000-0000-000000000011', 'Alumni Engagement & Professional Mentorship Network', 11, true),
('20000000-0000-0000-0000-000000000012', 'Governance, Transparency & Accreditation Standards (NBA/NAAC)', 12, true);

-- 3. PART C: MISSION CHECKBOX OPTIONS (15 options)
insert into mission_options (id, label, sort_order, is_active) values
('30000000-0000-0000-0000-000000000001', 'Imparting high-quality technical education through modern pedagogical methods', 1, true),
('30000000-0000-0000-0000-000000000002', 'Fostering a vibrant research culture, innovation, and consultancy', 2, true),
('30000000-0000-0000-0000-000000000003', 'Strengthening industry-institute interaction, practical training, and placements', 3, true),
('30000000-0000-0000-0000-000000000004', 'Nurturing entrepreneurship, incubation, and leadership qualities', 4, true),
('30000000-0000-0000-0000-000000000005', 'Instilling human values, professional ethics, and environmental awareness', 5, true),
('30000000-0000-0000-0000-000000000006', 'Developing state-of-the-art infrastructure and digital learning environments', 6, true),
('30000000-0000-0000-0000-000000000007', 'Promoting lifelong learning, multidisciplinary skills, and critical thinking', 7, true),
('30000000-0000-0000-0000-000000000008', 'Encouraging community engagement, social responsibility, and national development', 8, true),
('30000000-0000-0000-0000-000000000009', 'Integrating emerging technologies (AI, Robotics, IoT, Green Tech) across disciplines', 9, true),
('30000000-0000-0000-0000-000000000010', 'Building strategic global tie-ups and international student exchange programs', 10, true),
('30000000-0000-0000-0000-000000000011', 'Empowering faculty with continuous research grants, FDPs, and industrial sabbaticals', 11, true),
('30000000-0000-0000-0000-000000000012', 'Cultivating strong alumni networks for mentorship, funding, and career guidance', 12, true),
('30000000-0000-0000-0000-000000000013', 'Ensuring inclusive education, gender diversity, and student support systems', 13, true),
('30000000-0000-0000-0000-000000000014', 'Adopting sustainable campus practices, energy efficiency, and waste management', 14, true),
('30000000-0000-0000-0000-000000000015', 'Other (Please Specify below)', 15, true);

-- 4. PART D: STAKEHOLDER-SPECIFIC QUESTIONS

-- STUDENT (cat-4)
insert into stakeholder_questions (id, category_id, question_text, question_type, is_required, sort_order, is_active) values
('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'What do you expect most from the Institute?', 'checkboxes', true, 1, true),
('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'Which skills should the Institute emphasize for your future career?', 'checkboxes', true, 2, true),
('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'What one improvement would you like to see in the Institute in the coming years?', 'paragraph', false, 3, true);

insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
('40000000-0000-0000-0000-000000000001', 'Quality teaching', 'option', 1),
('40000000-0000-0000-0000-000000000001', 'Practical learning', 'option', 2),
('40000000-0000-0000-0000-000000000001', 'Placement', 'option', 3),
('40000000-0000-0000-0000-000000000001', 'Internships', 'option', 4),
('40000000-0000-0000-0000-000000000001', 'Industry exposure', 'option', 5),
('40000000-0000-0000-0000-000000000001', 'Emerging tech skills', 'option', 6),
('40000000-0000-0000-0000-000000000001', 'Research', 'option', 7),
('40000000-0000-0000-0000-000000000001', 'Entrepreneurship', 'option', 8),
('40000000-0000-0000-0000-000000000001', 'Higher education guidance', 'option', 9),
('40000000-0000-0000-0000-000000000001', 'Soft skills', 'option', 10),
('40000000-0000-0000-0000-000000000001', 'Ethics', 'option', 11),
('40000000-0000-0000-0000-000000000001', 'Personality development', 'option', 12),

('40000000-0000-0000-0000-000000000002', 'Technical skills', 'option', 1),
('40000000-0000-0000-0000-000000000002', 'Problem solving', 'option', 2),
('40000000-0000-0000-0000-000000000002', 'Communication', 'option', 3),
('40000000-0000-0000-0000-000000000002', 'Teamwork', 'option', 4),
('40000000-0000-0000-0000-000000000002', 'Leadership', 'option', 5),
('40000000-0000-0000-0000-000000000002', 'Innovation', 'option', 6),
('40000000-0000-0000-0000-000000000002', 'Entrepreneurship', 'option', 7),
('40000000-0000-0000-0000-000000000002', 'Digital/AI skills', 'option', 8),
('40000000-0000-0000-0000-000000000002', 'Professional ethics', 'option', 9),
('40000000-0000-0000-0000-000000000002', 'Lifelong learning', 'option', 10);

-- FACULTY (cat-2)
insert into stakeholder_questions (id, category_id, question_text, question_type, is_required, sort_order, is_active) values
('40000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Which areas should the Institute strengthen to achieve academic excellence?', 'checkboxes', true, 1, true),
('40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'What institutional support would help faculty contribute more effectively?', 'paragraph', false, 2, true),
('40000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'What major theme should be reflected in the future Vision?', 'paragraph', false, 3, true);

insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
('40000000-0000-0000-0000-000000000004', 'Teaching-learning process', 'option', 1),
('40000000-0000-0000-0000-000000000004', 'Research', 'option', 2),
('40000000-0000-0000-0000-000000000004', 'Sponsored projects', 'option', 3),
('40000000-0000-0000-0000-000000000004', 'Consultancy', 'option', 4),
('40000000-0000-0000-0000-000000000004', 'Innovation', 'option', 5),
('40000000-0000-0000-0000-000000000004', 'FDP', 'option', 6),
('40000000-0000-0000-0000-000000000004', 'Industry collaboration', 'option', 7),
('40000000-0000-0000-0000-000000000004', 'Interdisciplinary activities', 'option', 8),
('40000000-0000-0000-0000-000000000004', 'Digital technologies', 'option', 9),
('40000000-0000-0000-0000-000000000004', 'International collaboration', 'option', 10),
('40000000-0000-0000-0000-000000000004', 'Entrepreneurship', 'option', 11),
('40000000-0000-0000-0000-000000000004', 'Infrastructure', 'option', 12);

-- ALUMNI (cat-5)
insert into stakeholder_questions (id, category_id, question_text, question_type, is_required, sort_order, is_active) values
('40000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000005', 'Based on your professional experience, which areas should the Institute strengthen?', 'checkboxes', true, 1, true),
('40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000005', 'Which competencies gained during your studies have helped you most in your career?', 'paragraph', false, 2, true),
('40000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000005', 'How would you like the Institute to be recognized in the next 10–15 years?', 'paragraph', false, 3, true);

insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
('40000000-0000-0000-0000-000000000007', 'Technical competency', 'option', 1),
('40000000-0000-0000-0000-000000000007', 'Practical knowledge', 'option', 2),
('40000000-0000-0000-0000-000000000007', 'Industry exposure', 'option', 3),
('40000000-0000-0000-0000-000000000007', 'Communication', 'option', 4),
('40000000-0000-0000-0000-000000000007', 'Leadership', 'option', 5),
('40000000-0000-0000-0000-000000000007', 'Research', 'option', 6),
('40000000-0000-0000-0000-000000000007', 'Innovation', 'option', 7),
('40000000-0000-0000-0000-000000000007', 'Entrepreneurship', 'option', 8),
('40000000-0000-0000-0000-000000000007', 'Ethics', 'option', 9),
('40000000-0000-0000-0000-000000000007', 'Emerging technologies', 'option', 10),
('40000000-0000-0000-0000-000000000007', 'Global exposure', 'option', 11),
('40000000-0000-0000-0000-000000000007', 'Alumni interaction', 'option', 12);

-- EMPLOYER / INDUSTRY (cat-3)
insert into stakeholder_questions (id, category_id, question_text, question_type, is_required, sort_order, is_active) values
('40000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000003', 'Which qualities do you expect from graduates of our Institute?', 'multiple_choice_grid', true, 1, true),
('40000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000003', 'Which areas should the Institute strengthen to improve industry readiness?', 'checkboxes', true, 2, true),
('40000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000003', 'What should be the major focus of the Institute over the next decade?', 'paragraph', false, 3, true);

-- Employer Grid Rows & Columns
insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
('40000000-0000-0000-0000-000000000010', 'Strong technical knowledge', 'row', 1),
('40000000-0000-0000-0000-000000000010', 'Problem solving', 'row', 2),
('40000000-0000-0000-0000-000000000010', 'Practical skills', 'row', 3),
('40000000-0000-0000-0000-000000000010', 'Communication', 'row', 4),
('40000000-0000-0000-0000-000000000010', 'Teamwork', 'row', 5),
('40000000-0000-0000-0000-000000000010', 'Leadership', 'row', 6),
('40000000-0000-0000-0000-000000000010', 'Adaptability', 'row', 7),
('40000000-0000-0000-0000-000000000010', 'Emerging technologies', 'row', 8),
('40000000-0000-0000-0000-000000000010', 'Innovation', 'row', 9),
('40000000-0000-0000-0000-000000000010', 'Professional ethics', 'row', 10),
('40000000-0000-0000-0000-000000000010', 'Lifelong learning', 'row', 11),

('40000000-0000-0000-0000-000000000010', 'Not Important', 'column', 1),
('40000000-0000-0000-0000-000000000010', 'Somewhat Important', 'column', 2),
('40000000-0000-0000-0000-000000000010', 'Important', 'column', 3),
('40000000-0000-0000-0000-000000000010', 'Very Important', 'column', 4),

('40000000-0000-0000-0000-000000000011', 'Industry-oriented curriculum', 'option', 1),
('40000000-0000-0000-0000-000000000011', 'Internships', 'option', 2),
('40000000-0000-0000-0000-000000000011', 'Industry projects', 'option', 3),
('40000000-0000-0000-0000-000000000011', 'Professional certifications', 'option', 4),
('40000000-0000-0000-0000-000000000011', 'Emerging technology training', 'option', 5),
('40000000-0000-0000-0000-000000000011', 'Soft skills', 'option', 6),
('40000000-0000-0000-0000-000000000011', 'Entrepreneurship', 'option', 7),
('40000000-0000-0000-0000-000000000011', 'Research collaboration', 'option', 8),
('40000000-0000-0000-0000-000000000011', 'Industry mentoring', 'option', 9);

-- PARENT (cat-6)
insert into stakeholder_questions (id, category_id, question_text, question_type, is_required, sort_order, is_active) values
('40000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000006', 'What are your major expectations from the Institute?', 'checkboxes', true, 1, true),
('40000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000006', 'What qualities would you like students to develop by the time they graduate?', 'paragraph', false, 2, true),
('40000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000006', 'What should the Institute prioritize for its future development?', 'paragraph', false, 3, true);

insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
('40000000-0000-0000-0000-000000000013', 'Quality education', 'option', 1),
('40000000-0000-0000-0000-000000000013', 'Career opportunities', 'option', 2),
('40000000-0000-0000-0000-000000000013', 'Discipline', 'option', 3),
('40000000-0000-0000-0000-000000000013', 'Safe learning environment', 'option', 4),
('40000000-0000-0000-0000-000000000013', 'Technical competence', 'option', 5),
('40000000-0000-0000-0000-000000000013', 'Communication skills', 'option', 6),
('40000000-0000-0000-0000-000000000013', 'Ethical values', 'option', 7),
('40000000-0000-0000-0000-000000000013', 'Personality development', 'option', 8),
('40000000-0000-0000-0000-000000000013', 'Higher education opportunities', 'option', 9),
('40000000-0000-0000-0000-000000000013', 'Entrepreneurship', 'option', 10),
('40000000-0000-0000-0000-000000000013', 'Social responsibility', 'option', 11);

-- MANAGEMENT / GOVERNING BODY (cat-1)
insert into stakeholder_questions (id, category_id, question_text, question_type, is_required, sort_order, is_active) values
('40000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000001', 'Which areas are most important for the long-term growth of the Institute?', 'checkboxes', true, 1, true),
('40000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000001', 'Where should the Institute position itself in the next 10–15 years?', 'paragraph', false, 2, true),
('40000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000001', 'Which institutional values are most important for achieving academic excellence and societal responsibility?', 'paragraph', false, 3, true);

insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
('40000000-0000-0000-0000-000000000016', 'Academic excellence', 'option', 1),
('40000000-0000-0000-0000-000000000016', 'Research excellence', 'option', 2),
('40000000-0000-0000-0000-000000000016', 'Institutional reputation', 'option', 3),
('40000000-0000-0000-0000-000000000016', 'Innovation', 'option', 4),
('40000000-0000-0000-0000-000000000016', 'Entrepreneurship', 'option', 5),
('40000000-0000-0000-0000-000000000016', 'Industry collaboration', 'option', 6),
('40000000-0000-0000-0000-000000000016', 'Global recognition', 'option', 7),
('40000000-0000-0000-0000-000000000016', 'Emerging technologies', 'option', 8),
('40000000-0000-0000-0000-000000000016', 'Sustainability', 'option', 9),
('40000000-0000-0000-0000-000000000016', 'Social responsibility', 'option', 10),
('40000000-0000-0000-0000-000000000016', 'Governance', 'option', 11),
('40000000-0000-0000-0000-000000000016', 'Infrastructure development', 'option', 12);

-- SOCIETY / COMMUNITY (cat-7)
insert into stakeholder_questions (id, category_id, question_text, question_type, is_required, sort_order, is_active) values
('40000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000007', 'What contributions do you expect from an engineering institution to society?', 'checkboxes', true, 1, true),
('40000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000007', 'Which social responsibilities should be reflected in the Institute Mission?', 'paragraph', false, 2, true),
('40000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000007', 'What should graduates contribute to society?', 'paragraph', false, 3, true);

insert into stakeholder_question_options (question_id, option_label, option_group, sort_order) values
('40000000-0000-0000-0000-000000000019', 'Ethical professionals', 'option', 1),
('40000000-0000-0000-0000-000000000019', 'Sustainable solutions', 'option', 2),
('40000000-0000-0000-0000-000000000019', 'Community service', 'option', 3),
('40000000-0000-0000-0000-000000000019', 'Environmental responsibility', 'option', 4),
('40000000-0000-0000-0000-000000000019', 'Technology for societal problems', 'option', 5),
('40000000-0000-0000-0000-000000000019', 'Inclusive development', 'option', 6),
('40000000-0000-0000-0000-000000000019', 'Innovation for social benefit', 'option', 7),
('40000000-0000-0000-0000-000000000019', 'Employment generation', 'option', 8),
('40000000-0000-0000-0000-000000000019', 'National development', 'option', 9);
