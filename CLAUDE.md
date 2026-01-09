# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
npm run dev          # Start development server (Vite)
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Supabase Edge Functions

```bash
supabase login                                    # Authenticate CLI
supabase link --project-ref <PROJECT_REF>         # Link to project
supabase functions deploy <function-name>         # Deploy a function
supabase functions logs <function-name> --follow  # View logs
supabase secrets set OPENAI_API_KEY=sk-xxx        # Set secrets
```

## Architecture Overview

### Frontend Stack
- **React 18 + TypeScript + Vite** with SWC for fast builds
- **Tailwind CSS** with shadcn/ui components (Radix primitives in `src/components/ui/`)
- **TanStack React Query** for server state management
- **React Router DOM** for routing

### Backend
- **Supabase** for auth, PostgreSQL database, and edge functions
- **OpenAI API** (GPT-4 Vision, GPT-4 Turbo) for AI-powered plan analysis

### Key Directories

- `src/contexts/` - React contexts for global state
  - `AuthContext.tsx` - Authentication state, subscription info, sign in/out
  - `AppContext.tsx` - Sidebar state, organization switching
- `src/pages/` - Route page components
- `src/components/` - Reusable components
  - `ui/` - shadcn/ui primitives
  - `admin/` - Admin-specific components
  - `organization/` - Multi-tenant organization components
- `src/lib/` - Utilities and API clients
  - `supabase.ts` - Supabase client initialization
- `src/hooks/` - Custom React hooks
- `supabase/functions/` - Deno edge functions (deployed to Supabase)
- `supabase/migrations/` - SQL migrations

### Core Data Flow

1. **Authentication**: `AuthContext` manages Supabase auth, loads user profile from `user_profiles` table including subscription status
2. **License Guard**: `LicenseGuard` component wraps all routes, enforcing license validation
3. **Organization Context**: `AppContext` handles multi-tenant organization switching, stores active org in localStorage
4. **AI Analysis**: Frontend calls Supabase edge functions (e.g., `analyze-construction-plans`) which use OpenAI Vision API and store results in `takeoff_data` table

### Edge Function Pattern

Edge functions in `supabase/functions/` follow this pattern:
- Verify JWT from `Authorization` header using Supabase client
- Check resource ownership (e.g., `plan.user_id === user.id`)
- Call OpenAI API with appropriate model
- Store results in database
- Return JSON response with CORS headers

### Database Tables (Key)
- `user_profiles` - User info, subscription tier/status
- `organizations` / `organization_members` - Multi-tenancy
- `plans` - Uploaded construction plans
- `takeoff_data` - Extracted items from plans (walls, doors, windows, specs)
- `ocr_extracted_text` - OCR text from plan pages
- `plan_conversations` - AI chat history per plan

## Multi-Tenancy

The app supports both personal and organization contexts:
- `activeOrganization` in `AppContext` controls data scoping
- RLS policies on tables filter by `user_id` or `organization_id`
- Super admin role has elevated permissions (checked via `user_profiles.user_type`)
