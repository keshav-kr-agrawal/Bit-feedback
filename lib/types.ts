export type QuestionType =
  | 'checkboxes'
  | 'paragraph'
  | 'multiple_choice'
  | 'multiple_choice_grid'
  | 'rating_scale';

export type OptionGroupType = 'option' | 'row' | 'column';

export interface SiteSettings {
  id: number;
  institute_name: string;
  logo_url: string | null;
  form_title: string;
  form_intro_text: string;
  is_form_open: boolean;
  closed_message: string;
  thank_you_message: string;
  primary_color: string;
  updated_at?: string;
}

export interface StakeholderCategory {
  id: string;
  label: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface PriorityItem {
  id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface MissionOption {
  id: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface StakeholderQuestionOption {
  id: string;
  question_id: string;
  option_label: string;
  option_group: OptionGroupType;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface StakeholderQuestion {
  id: string;
  category_id: string;
  question_text: string;
  question_type: QuestionType;
  options?: StakeholderQuestionOption[]; // options list loaded from DB
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface MissionSelectionInput {
  option_id: string;
  other_text?: string;
}

export interface FeedbackResponse {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  stakeholder_category_id: string | null;
  priority_ratings: Record<string, number>;
  mission_commitments: MissionSelectionInput[];
  stakeholder_answers: Record<string, { text?: string; selected?: any }>;
  suggestion: string | null;
  submitted_at: string;
  ip_hash?: string | null;
}

export interface AdminUser {
  user_id: string;
  created_at?: string;
}
