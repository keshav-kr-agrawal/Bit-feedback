import { z } from 'zod';

export const stepCombinedPartABSchema = z.object({
  name: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  email: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .or(z.literal('')),
  stakeholder_category_id: z
    .string()
    .min(1, 'Please select your stakeholder category'),
});

export const siteSettingsSchema = z.object({
  institute_name: z.string().min(1, 'Institute name is required'),
  logo_url: z.string().nullable().optional(),
  form_title: z.string().min(1, 'Form title is required'),
  form_intro_text: z.string().min(1, 'Intro text is required'),
  is_form_open: z.boolean(),
  closed_message: z.string().min(1, 'Closed message is required'),
  thank_you_message: z.string().min(1, 'Thank you message is required'),
  primary_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please enter a valid hex color code (e.g. #1F4E79)'),
});

export const stakeholderCategorySchema = z.object({
  label: z.string().min(1, 'Label is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9_]+$/, 'Slug must contain only lowercase letters, numbers, and underscores'),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
});

export const priorityItemSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
});

export const missionOptionSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
});
