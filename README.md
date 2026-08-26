# Bangalore Institute of Technology — NBA/NAAC Stakeholder Feedback System

A production-ready, fully admin-controlled **Institute Stakeholder Feedback website** built for Bangalore Institute of Technology's NBA and NAAC Accreditation Vision-Mission stakeholder feedback exercises.

The system features two primary surfaces:
1. **Public Feedback Form**: A responsive, multi-step wizard filled out by college stakeholders (Students, Faculty, Alumni, Parents, Employers, Management, Society/Community, Staff, Academic Experts).
2. **Admin Panel & CMS**: A password-protected dashboard where the IQAC administrator can control every single piece of content (dropdown options, questions, checkbox lists, wording, institute branding, color themes, form open/closed state) and view responses as interactive charts, filterable tables, and downloadable **CSV** and **PDF** reports.

---

## 🌟 Core System Features

### Public Feedback Form Wizard
- **100% Database-Driven**: Zero hardcoded questions or dropdown options in frontend components. All text, options, and question lists are fetched live from Supabase at runtime.
- **Step 0 — Landing Page**: Custom title, introduction text, IQAC structure overview, and active status check (`is_form_open`).
- **Step 1 — Combined Part A & B (Respondent Details & Institutional Priorities)**:
  - Part A: Name (optional), Phone (optional), Email (optional), Stakeholder Role dropdown (mandatory).
  - Part B: Rating scale (1 = Low Priority, 5 = Very High Priority) for 12 institutional priority items.
- **Step 2 — Part C (Mission Commitments)**: Multi-select checkbox grid enforcing **selection of exactly 3 commitments** (live counter `2/3 selected`, blocks checking more than 3). Option 15 ("Other") includes a custom text specify input field.
- **Step 3 — Part D (Stakeholder-Specific Questions)**: Dynamic questions tailored to the selected role (`checkboxes`, `paragraph`, `multiple_choice`, `multiple_choice_grid`, `rating_scale`). Auto-skipped if 0 questions are configured for the category.
- **Step 4 — Part E (Additional Recommendations)**: Optional qualitative suggestion box with anti-spam submission protection and loading state.
- **Step 5 — Thank You Page**: Completion screen displaying custom thank-you messaging.

### Admin Dashboard & CMS
- **Analytics Overview (`/admin`)**: Summary metric cards and Recharts visualizations:
  - Bar chart: Submissions per stakeholder category.
  - Pie/Donut chart: Pick counts for mission commitments.
  - Bar chart: Average rating per Part B priority item.
- **Responses Management (`/admin/responses`)**:
  - Full data table with category filter, date range filter, and search.
  - Detail View Modal displaying complete response breakdowns.
  - **Export CSV**: Downloads filtered records with flattened column headers via `papaparse`.
  - **Export Full PDF Report**: Generates an official landscape PDF document with headers, metadata, and auto-tables via `jspdf` and `jspdf-autotable`.
  - **Export Single Response PDF**: Downloads an official individual stakeholder response sheet.
  - Response Deletion with safety confirmation modal.
- **Site Settings (`/admin/settings`)**: Edit institute name ("Bangalore Institute of Technology"), logo URL, form title, intro text, closed message, thank you message, primary accent color picker, and instant form open/close toggle switch.
- **Category Manager (`/admin/stakeholders`)**: Add, edit, reorder, active toggle, soft-disable stakeholder categories.
- **Priorities Manager (`/admin/priorities`)**: Add, edit, reorder, active toggle priority rating items.
- **Mission Options Manager (`/admin/mission-options`)**: Add, edit, reorder, active toggle mission commitment options.
- **Question Builder (`/admin/questions`)**: Category-specific question builder (select category from dropdown, add question text, type, options list tag manager, required toggle, reorder, active toggle).

---

## 🛠️ Tech Stack & Connected Infrastructure

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS (Institutional Light Theme `#F8F9FB` / `#FFFFFF` with muted navy `#1F4E79`)
- **Backend & Database**: Supabase (Postgres Database + RLS)
- **Security**: Postgres Row Level Security (RLS) & `is_admin()` helper function
- **SDKs**: `@supabase/supabase-js`, `@supabase/ssr`
- **Analytics & Graphs**: Recharts
- **Forms & Validation**: `react-hook-form` + `zod`
- **CSV & PDF Exports**: `papaparse`, `jspdf`, `jspdf-autotable`
- **Icons**: `lucide-react`

---

## 📁 File Structure

```
.
├── app/
│   ├── (public)/
│   │   └── components/
│   │       ├── Header.tsx                 # Dynamic institute header & primary color accent
│   │       ├── Footer.tsx                 # IQAC footer with editable institute text
│   │       ├── StepLanding.tsx            # Step 0 landing screen & open/closed check
│   │       ├── StepCombinedPartAB.tsx     # Step 1 combined respondent details & 1-5 priority ratings
│   │       ├── StepMission.tsx            # Step 2 mission commitments (exact 3 selection + 'Other' input)
│   │       ├── StepStakeholderQuestions.tsx # Step 3 role-specific question renderer
│   │       ├── StepSuggestion.tsx         # Step 4 qualitative feedback & submit button
│   │       └── StepThankYou.tsx           # Step 5 completion screen
│   ├── admin/
│   │   ├── login/
│   │   │   └── page.tsx                   # Admin login screen
│   │   ├── page.tsx                       # Overview analytics with Recharts
│   │   ├── responses/
│   │   │   └── page.tsx                   # Data table, filters, CSV & PDF export engine
│   │   ├── settings/
│   │   │   └── page.tsx                   # Site settings, branding & form toggle
│   │   ├── stakeholders/
│   │   │   └── page.tsx                   # Stakeholder categories CRUD
│   │   ├── priorities/
│   │   │   └── page.tsx                   # Part B priority items CRUD
│   │   ├── mission-options/
│   │   │   └── page.tsx                   # Part C mission options CRUD
│   │   ├── questions/
│   │   │   └── page.tsx                   # Per-category dynamic question builder
│   │   └── components/
│   │       └── AdminNav.tsx               # Admin sticky topbar and tab navigation
│   ├── layout.tsx                         # Root Next.js layout
│   ├── page.tsx                           # Public wizard container page
│   └── globals.css                        # Tailwind directives & institutional styles
├── lib/
│   ├── supabase/
│   │   ├── client.ts                      # Supabase browser client
│   │   └── server.ts                      # Supabase SSR client helper
│   ├── types.ts                           # TypeScript models & wizard form state interfaces
│   └── validation.ts                      # Zod validation schemas
├── sql/
│   ├── schema.sql                         # Full Postgres schema, RPC function & RLS policies
│   └── seed.sql                           # NBA/NAAC institutional seed dataset
├── middleware.ts                          # Next.js server middleware for admin route protection
├── README.md                              # Complete system documentation
├── tailwind.config.js                     # Institutional color palette & typography
├── package.json                           # Dependencies & scripts
└── tsconfig.json                          # TypeScript configuration
```

---

## 🚀 Environment Variables & Vercel Deployment

Create a `.env.local` file locally, or set the environment variables in your Vercel Project Settings:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

1. Push your repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Environment Variables above under **Project Settings -> Environment Variables**.
4. Click **Deploy**.
