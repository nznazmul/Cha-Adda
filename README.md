# CHA ADDA — Full-Stack Tinder-Inspired Dating Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%7C%20Auth%20%7C%20Realtime-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Vitest-12%20passed-brightgreen?style=flat&logo=vitest)](https://vitest.dev/)

**CHA ADDA** is a complete, mobile-first adult dating and matchmaking web application. Built with Next.js App Router, React 19, Tailwind CSS, and Supabase (PostgreSQL 15+, Auth, Private Storage, and Realtime pub/sub), featuring atomic mutual match detection, gesture card deck swiping, live messaging, user safety/moderation, and an administrative dashboard.

---

## 🌟 Key Features

1. **Discovery & Swipe Deck (`/discover`)**
   - Gesture dragging (swipe right to like, swipe left to pass) + accessible control buttons.
   - Dynamic stamps ("LIKE" in emerald, "PASS" in rose) responding to touch/mouse drag distance.
   - Expandable candidate details modal (multi-photo gallery, bio, lifestyle, intentions, interests).
   - Reciprocal Match celebration modal ("It's a Match!") triggered when two eligible users like each other.

2. **Atomic Mutual Matching Engine**
   - Implemented in PostgreSQL (`record_swipe` RPC) using canonical pair ordering (`user_a_id < user_b_id`) with `ON CONFLICT` guards.
   - Prevents duplicate matches and race conditions when two users swipe simultaneously.
   - Automatic reciprocal notification dispatch to both participants.

3. **Real-Time Messaging (`/chat/[matchId]`)**
   - Direct pub/sub messaging powered by Supabase Realtime channel.
   - Message timestamps, delivery badges, and multi-line message composer (Shift+Enter for newline).
   - In-chat safety actions: Unmatch (with confirmation modal), Report member, or Block member.

4. **18+ Adult Onboarding Wizard (`/onboarding`)**
   - 6-step guided wizard: Basic Info, Dating Intentions, Tag-based Interests, Bio/Details, Photo Upload/Gallery, Discovery Preferences.
   - Server-enforced 18+ age verification check.
   - Private storage of birthdate (only calculated age is exposed publicly).

5. **Safety, Moderation & Admin Dashboard (`/admin`)**
   - Real aggregated database metrics: Total registered, active accounts, completed profiles, likes, matches, messages, and pending reports.
   - User directory (`/admin/users`) with search, status filters, and one-click suspend, ban, or restore controls.
   - Moderation queue (`/admin/reports`) for investigating member reports.
   - Flagged photo review gallery (`/admin/photos`).
   - Immutable administrative audit logs (`/admin/audit-logs`).

6. **Design System & Visual Aesthetics**
   - Deep plum / near-black primary theme (`#0F0C1B`, card background `#18132B`) with coral & rose accents (`#E11D48`, `#FB7185`, `#EA580C`).
   - Warm tinted light theme with persistent toggle state.
   - Lucide React icon set (strict rule: no raw emojis used as icons).

---

## 📁 Application Routes

| Category | Route | Description |
|---|---|---|
| **Public** | `/` | Landing page with hero, interactive card preview, and testimonials |
| | `/login` | Email/password login with demo persona presets |
| | `/register` | 18+ adult registration with password strength meter |
| | `/forgot-password` | Password recovery request flow |
| | `/reset-password` | Secure password reset page |
| | `/safety` | Comprehensive dating safety guide |
| | `/community-guidelines` | Platform rules, dos, and prohibited behavior |
| | `/privacy` | Privacy policy & geolocation anonymity details |
| | `/terms` | Terms of Service & 18+ adult eligibility |
| **Authenticated** | `/onboarding` | 6-step profile creation wizard |
| | `/discover` | Mobile-first card swipe discovery engine |
| | `/likes` | Admirers grid (blurred teaser for free, unblurred for Gold) |
| | `/matches` | Active mutual matches list with search and chat links |
| | `/chat/[matchId]` | Real-time chat conversation with active match |
| | `/profile` | View and edit own dating profile & photo order |
| | `/profile/[userId]` | View another member's public profile |
| | `/settings` | Discovery visibility, theme, notifications, delete account |
| | `/subscription` | Premium tiers (Free, Plus, Gold, Platinum) feature matrix |
| | `/safety/report/[userId]` | Confidential report submission form |
| **Admin** | `/admin` | Metrics overview dashboard |
| | `/admin/users` | User directory, status filtering, ban/suspend controls |
| | `/admin/reports` | Moderation queue and evidence review |
| | `/admin/photos` | Photo compliance review interface |
| | `/admin/analytics` | Weekly volume charts and match conversion metrics |
| | `/admin/settings` | Platform limits (max photos, age limits, maintenance) |
| | `/admin/audit-logs` | Immutable audit trail of moderator decisions |

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16.4.3 (App Router, Turbopack, Partial Prerendering)
- **UI & Gestures**: React 19, Framer Motion, Tailwind CSS v4, Lucide React
- **Validation**: Zod
- **Backend & Database**: Supabase PostgreSQL 15+, Supabase Auth, Supabase Storage, Supabase Realtime
- **Testing**: Vitest 5.0.5

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20.0.0 or higher (v24 recommended)
- **npm**: v10.0.0 or higher

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project credentials:
```env
NEXT_PUBLIC_APP_URL=https://cha-adda-meet-swap.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```
> **Note:** If Supabase credentials are not yet configured, CHA ADDA will automatically run in **Local Dev Mode** using an in-memory transactional database adapter (`lib/services/dev-store.ts`). This allows you to evaluate swiping, mutual matching, chat, and admin moderation immediately without blockers.

### 4. Database Setup & Migrations
In your Supabase project SQL Editor, run:
1. `supabase/migrations/20261024000000_initial_schema.sql` (Creates all 12 tables, indexes, RLS policies, and atomic matching functions).
2. (Optional for local testing) `supabase/seed.sql` (Inserts safe 18+ adult development profiles).

### 5. Start Development Server
```bash
Open [https://cha-adda-meet-swap.vercel.app](https://cha-adda-meet-swap.vercel.app) in your browser (or local port).

---

## 🧪 Running Tests

To run the full unit test suite:
```bash
npm test
# or
npx vitest run
```
Test coverage includes:
- **`tests/unit/matching.test.ts`**: Verifies atomic reciprocal like matching, canonical pair ordering (`user_a < user_b`), block exclusions, and prevention of self-swipes.
- **`tests/unit/age-validation.test.ts`**: Verifies 18+ boundary calculation, leap years, and rejection of underage profiles.
- **`tests/unit/discovery.test.ts`**: Verifies candidate exclusion (swiped profiles, blocked members, undiscoverable accounts).

---

## 🔒 Security & Row Level Security (RLS)

- **Strict Server Validation**: All age constraints, profile fields, swipe requests, and reports are verified server-side.
- **Data Minimization**: Public profile projections explicitly strip private fields (date of birth, exact GPS coordinates, email, account status).
- **Conversation Isolation**: Messages can only be read and written by users who belong to that specific active match (`user_a_id = auth.uid() OR user_b_id = auth.uid()`).
- **Administrative Privileges**: Only users with `role IN ('admin', 'moderator')` can access moderation queues, audit logs, or change account statuses. Normal users cannot escalate their own role.

---

## 👥 Built-in Test Personas

When running in development or testing mode, use the Persona Switcher in the top bar or on `/login`:
- **👩 Aria Vance** (`usr-aria-01`): 26-year-old architect (User)
- **👨 Julian Ross** (`usr-julian-02`): 28-year-old product designer (Has liked Aria, ready for mutual match)
- **👨 Kaelen Miller** (`usr-kaelen-04`): 29-year-old chef (Already matched with Aria, active chat)
- **👩 Maya Lin** (`usr-maya-03`): 24-year-old curator (User)
- **🛡️ Admin Lead** (`usr-admin-lead`): Platform trust & safety lead (Full access to `/admin` console)

---

## 📄 License
MIT License. © 2026 CHA ADDA.
