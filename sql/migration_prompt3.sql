-- ============================================================
-- MIGRATION SCRIPT — PROMPT #3
-- Rename "Staff" to "Technical Staff" & Add Part D Questions for Academic Expert & Technical Staff
-- ============================================================

-- 1. Rename category "Staff" to "Technical Staff" and update sort_orders
UPDATE stakeholder_categories
SET label = 'Technical Staff',
    slug = 'technical_staff',
    sort_order = 3
WHERE slug = 'staff' OR label = 'Staff' OR id = '10000000-0000-0000-0000-000000000008';

-- Update category sort orders to match BIT hierarchy:
-- 1. Management / Governing Body
-- 2. Faculty
-- 3. Technical Staff
-- 4. Student
-- 5. Alumni
-- 6. Parent
-- 7. Employer / Industry
-- 8. Academic Expert
-- 9. Society / Community
-- 10. Other
UPDATE stakeholder_categories SET sort_order = 1 WHERE slug = 'management';
UPDATE stakeholder_categories SET sort_order = 2 WHERE slug = 'faculty';
UPDATE stakeholder_categories SET sort_order = 3 WHERE slug = 'technical_staff';
UPDATE stakeholder_categories SET sort_order = 4 WHERE slug = 'student';
UPDATE stakeholder_categories SET sort_order = 5 WHERE slug = 'alumni';
UPDATE stakeholder_categories SET sort_order = 6 WHERE slug = 'parent';
UPDATE stakeholder_categories SET sort_order = 7 WHERE slug = 'employer';
UPDATE stakeholder_categories SET sort_order = 8 WHERE slug = 'academic_expert';
UPDATE stakeholder_categories SET sort_order = 9 WHERE slug = 'society';
UPDATE stakeholder_categories SET sort_order = 10 WHERE slug = 'other';

-- Helper block to seed questions dynamically by category slug
DO $$
DECLARE
  v_acad_cat_id uuid;
  v_tech_cat_id uuid;
  v_q_acad_1 uuid;
  v_q_acad_2 uuid;
  v_q_acad_3 uuid;
  v_q_tech_1 uuid;
  v_q_tech_2 uuid;
  v_q_tech_3 uuid;
BEGIN
  -- Retrieve Category UUIDs
  SELECT id INTO v_acad_cat_id FROM stakeholder_categories WHERE slug = 'academic_expert' LIMIT 1;
  SELECT id INTO v_tech_cat_id FROM stakeholder_categories WHERE slug = 'technical_staff' LIMIT 1;

  -- 2. ACADEMIC EXPERT QUESTIONS (cat-academic_expert)
  IF v_acad_cat_id IS NOT NULL THEN
    -- Delete existing questions for academic_expert if any, to ensure clean idempotent insert
    DELETE FROM stakeholder_questions WHERE category_id = v_acad_cat_id;

    -- Question 1: Multiple choice grid (mandatory)
    INSERT INTO stakeholder_questions (category_id, question_text, question_type, is_required, sort_order, is_active)
    VALUES (v_acad_cat_id, 'Which academic and professional qualities should graduates of our Institute possess?', 'multiple_choice_grid', true, 1, true)
    RETURNING id INTO v_q_acad_1;

    INSERT INTO stakeholder_question_options (question_id, option_label, option_group, sort_order) VALUES
    (v_q_acad_1, 'Strong technical knowledge', 'row', 1),
    (v_q_acad_1, 'Problem-solving ability', 'row', 2),
    (v_q_acad_1, 'Practical skills', 'row', 3),
    (v_q_acad_1, 'Communication skills', 'row', 4),
    (v_q_acad_1, 'Teamwork', 'row', 5),
    (v_q_acad_1, 'Leadership', 'row', 6),
    (v_q_acad_1, 'Adaptability', 'row', 7),
    (v_q_acad_1, 'Research aptitude', 'row', 8),
    (v_q_acad_1, 'Innovation', 'row', 9),
    (v_q_acad_1, 'Professional ethics', 'row', 10),
    (v_q_acad_1, 'Lifelong learning', 'row', 11),
    (v_q_acad_1, 'Not Important', 'column', 1),
    (v_q_acad_1, 'Somewhat Important', 'column', 2),
    (v_q_acad_1, 'Important', 'column', 3),
    (v_q_acad_1, 'Very Important', 'column', 4);

    -- Question 2: Checkboxes (mandatory)
    INSERT INTO stakeholder_questions (category_id, question_text, question_type, is_required, sort_order, is_active)
    VALUES (v_acad_cat_id, 'Which areas should the Institute strengthen to enhance academic quality and graduate readiness?', 'checkboxes', true, 2, true)
    RETURNING id INTO v_q_acad_2;

    INSERT INTO stakeholder_question_options (question_id, option_label, option_group, sort_order) VALUES
    (v_q_acad_2, 'Curriculum aligned with emerging technologies', 'option', 1),
    (v_q_acad_2, 'Outcome-Based Education', 'option', 2),
    (v_q_acad_2, 'Research and innovation', 'option', 3),
    (v_q_acad_2, 'Industry–academia collaboration', 'option', 4),
    (v_q_acad_2, 'Internships/projects', 'option', 5),
    (v_q_acad_2, 'Professional certifications', 'option', 6),
    (v_q_acad_2, 'Entrepreneurship', 'option', 7),
    (v_q_acad_2, 'Faculty development', 'option', 8),
    (v_q_acad_2, 'Interdisciplinary learning', 'option', 9),
    (v_q_acad_2, 'Skill development', 'option', 10);

    -- Question 3: Paragraph (optional)
    INSERT INTO stakeholder_questions (category_id, question_text, question_type, is_required, sort_order, is_active)
    VALUES (v_acad_cat_id, 'What should be the major academic focus of the Institute over the next decade?', 'paragraph', false, 3, true)
    RETURNING id INTO v_q_acad_3;
  END IF;

  -- 3. TECHNICAL STAFF QUESTIONS (cat-technical_staff)
  IF v_tech_cat_id IS NOT NULL THEN
    -- Delete existing questions for technical_staff if any, to ensure clean idempotent insert
    DELETE FROM stakeholder_questions WHERE category_id = v_tech_cat_id;

    -- Question 1: Checkboxes (mandatory)
    INSERT INTO stakeholder_questions (category_id, question_text, question_type, is_required, sort_order, is_active)
    VALUES (v_tech_cat_id, 'Which areas should be improved for effective functioning of laboratories?', 'checkboxes', true, 1, true)
    RETURNING id INTO v_q_tech_1;

    INSERT INTO stakeholder_question_options (question_id, option_label, option_group, sort_order) VALUES
    (v_q_tech_1, 'Laboratory equipment', 'option', 1),
    (v_q_tech_1, 'Software/tools', 'option', 2),
    (v_q_tech_1, 'Maintenance', 'option', 3),
    (v_q_tech_1, 'Safety', 'option', 4),
    (v_q_tech_1, 'Technical training', 'option', 5),
    (v_q_tech_1, 'Student support', 'option', 6),
    (v_q_tech_1, 'Emerging technologies', 'option', 7);

    -- Question 2: Paragraph (optional)
    INSERT INTO stakeholder_questions (category_id, question_text, question_type, is_required, sort_order, is_active)
    VALUES (v_tech_cat_id, 'What improvements or support from the Institute would help you contribute more effectively to laboratory activities?', 'paragraph', false, 2, true)
    RETURNING id INTO v_q_tech_2;

    -- Question 3: Paragraph (optional)
    INSERT INTO stakeholder_questions (category_id, question_text, question_type, is_required, sort_order, is_active)
    VALUES (v_tech_cat_id, 'What major practical or technical focus should be reflected in the future Department Vision and Mission?', 'paragraph', false, 3, true)
    RETURNING id INTO v_q_tech_3;
  END IF;

END $$;
