# LearnioX Client — Full Implementation Plan

## Background

LearnioX is a **multi-institution ed-tech operating system** — think YouTube + Udemy + Graphy + AI. It has four distinct surfaces:
1. **Public Platform** — discovery, search, course/institution browsing (no login required)
2. **Learner App** — authenticated learner dashboard (my courses, notes, doubts, quizzes, certs)
3. **Academy Studio** — institution creator dashboard (course builder, students, analytics, AI copilot)
4. **Platform Admin** — super-admin panel (users, institutions, moderation, payments)

The design system is a **strict B&W minimalist architecture** using Inter font, flat (no border-radius), 1px black borders, grayscale palette, with uppercase tracking labels. Inconsistencies across design files are minimal (border-color tone differences; Studio uses `border-on-surface-variant`, Learner uses `border-primary`). We will normalize this to `border-border` using CSS variables in dark/light mode.

---

## Design Analysis Summary

### 118 Design Pages Mapped to 4 Zones

**Zone 1: Public Platform (No Auth)**
| Page | Route |
|------|-------|
| Homepage | `/` |
| Search Results | `/search` |
| Category (e.g. Coding) | `/category/[slug]` |
| Course Detail | `/course/[slug]` |
| Video Watch Page | `/watch/[videoId]` |
| Free Videos Discovery | `/free-videos` |
| Live Batches Listing | `/live-batches` |
| Institution Landing | `/c/[institutionSlug]` |
| Institution Course Catalog | `/c/[slug]/courses` |
| Institution Teachers | `/c/[slug]/teachers` |
| Institution Community | `/c/[slug]/community` |
| Institution Membership | `/c/[slug]/membership` |
| Institution Reviews | `/c/[slug]/reviews` |
| Institution Directory | `/institutions` |
| Instructor Profile | `/instructor/[id]` |
| Course Comparison | `/compare` |
| Learning Path Page | `/path/[id]` |
| Pricing Page | `/pricing` |
| About Page | `/about` |
| Help Center | `/help` |
| Help Article | `/help/[articleSlug]` |
| Support Contact | `/support` |
| Login | `/auth/login` |
| Signup | `/auth/signup` |
| Certificate Verification | `/verify/[certId]` |
| 404 Error | `/*` |

**Zone 2: Learner App (Authenticated)**
| Page | Route |
|------|-------|
| Learner Dashboard | `/learn/dashboard` |
| My Courses | `/learn/courses` |
| Video Watch (enrolled) | `/learn/watch/[lessonId]` |
| My Notes | `/learn/notes` |
| My Doubts | `/learn/doubts` |
| Tests/Quizzes | `/learn/tests` |
| Quiz Taking | `/learn/quiz/[quizId]` |
| Assignments | `/learn/assignments` |
| Assignment Detail | `/learn/assignments/[id]` |
| Certificates | `/learn/certificates` |
| Memberships | `/learn/memberships` |
| Saved Courses | `/learn/saved` |
| Followed Institutions | `/learn/following` |
| Notifications | `/learn/notifications` |
| Billing & Payments | `/learn/billing` |
| Profile Settings | `/learn/settings/profile` |
| Checkout | `/checkout/[courseId]` |
| Payment Success | `/payment/success` |
| Payment Failed | `/payment/failed` |

**Zone 3: Academy Studio (Institution Creator)**
| Page | Route |
|------|-------|
| Studio Dashboard | `/studio/dashboard` |
| Course Management | `/studio/courses` |
| Course Builder | `/studio/courses/[id]/build` |
| Curriculum Builder | `/studio/courses/[id]/curriculum` |
| Course Publish Checklist | `/studio/courses/[id]/publish` |
| Course Resources | `/studio/courses/[id]/resources` |
| Course Analytics | `/studio/courses/[id]/analytics` |
| Course Announcements | `/studio/courses/[id]/announcements` |
| Course Reviews | `/studio/courses/[id]/reviews` |
| Bulk Lesson Upload | `/studio/courses/[id]/bulk-upload` |
| Course Import | `/studio/courses/import` |
| Media Library | `/studio/media` |
| Students Management | `/studio/students` |
| Student Detail | `/studio/students/[id]` |
| Doubts Queue | `/studio/doubts` |
| Quiz Builder | `/studio/quizzes` |
| Tests Dashboard | `/studio/tests` |
| Assignment Builder | `/studio/assignments` |
| Assignment Review Queue | `/studio/assignments/review` |
| Certificates Dashboard | `/studio/certificates` |
| Certificate Templates | `/studio/certificates/templates` |
| Live Classes | `/studio/live-classes` |
| Live Class Detail | `/studio/live-classes/[id]` |
| Membership Management | `/studio/memberships` |
| Payments & Revenue | `/studio/payments` |
| Analytics Dashboard | `/studio/analytics` |
| Marketing Dashboard | `/studio/marketing` |
| Coupon Management | `/studio/coupons` |
| Lead Management | `/studio/leads` |
| Referral Program | `/studio/referrals` |
| Landing Page Builder | `/studio/landing-page` |
| Community Management | `/studio/community` |
| Team & Permissions | `/studio/team` |
| AI Copilot Workspace | `/studio/ai-copilot` |
| AI Job Detail | `/studio/ai-jobs/[id]` |
| AI Usage & Credits | `/studio/ai-credits` |
| Notification Templates | `/studio/notifications` |
| Data Export | `/studio/data-export` |
| Developer Settings | `/studio/developer` |
| Institution Settings | `/studio/settings` |
| Institution Onboarding | `/studio/onboarding` |
| Institution Verification | `/studio/verification` |

**Zone 4: Platform Admin**
| Page | Route |
|------|-------|
| Admin Dashboard | `/admin/dashboard` |
| Users Management | `/admin/users` |
| Institutions Management | `/admin/institutions` |
| Institution Verification | `/admin/institutions/verification` |
| Courses Admin | `/admin/courses` |
| Moderation Queue | `/admin/moderation` |
| Payments Dashboard | `/admin/payments` |
| Featured Content | `/admin/featured` |
| Platform Settings | `/admin/settings` |
| Audit Logs | `/admin/audit-logs` |

---

## Design System Observations & Inconsistencies

> [!WARNING]
> **Design Inconsistency Found**: Some design files use `border-on-surface-variant` (#7e7576) and others use `border-primary` (#000000) for section dividers in dashboard layouts. We will normalize using Tailwind `border-border` CSS variable so dark mode works properly.

> [!NOTE]
> The design uses 0px border-radius everywhere (flat/square corners). This is intentional. We will override shadcn/ui components to use `rounded-none` globally.

> [!NOTE]
> Color palette is strictly grayscale in the design, but for dark mode we need proper dark equivalents. We'll map: `surface` → `background`, `on-surface` → `foreground`, `primary` → black/white inversed.

---

## Tech Stack (User Specified)

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 App Router (already installed) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Icons | Lucide React |
| UI Library | shadcn/ui (already installed) |
| Global State | Redux Toolkit |
| Server State | TanStack React Query v4 |
| Form Validation | Zod + React Hook Form |
| Theme | next-themes (dark/light mode) |
| Mock Data | Centralized `@/lib/mock-data` module |
| Charts | Recharts |

---

## Architecture Design

### Folder Structure

```
src/
├── app/
│   ├── (public)/          # Public zone — no auth, public navbar
│   │   ├── layout.tsx     # Public layout with TopNavBar + Footer
│   │   ├── page.tsx       # Homepage /
│   │   ├── search/page.tsx
│   │   ├── category/[slug]/page.tsx
│   │   ├── course/[slug]/page.tsx
│   │   ├── watch/[videoId]/page.tsx
│   │   ├── free-videos/page.tsx
│   │   ├── live-batches/page.tsx
│   │   ├── institutions/page.tsx
│   │   ├── c/[slug]/layout.tsx     # Institution layout (tabs nav)
│   │   ├── c/[slug]/page.tsx
│   │   ├── c/[slug]/courses/page.tsx
│   │   ├── c/[slug]/teachers/page.tsx
│   │   ├── c/[slug]/community/page.tsx
│   │   ├── c/[slug]/membership/page.tsx
│   │   ├── c/[slug]/reviews/page.tsx
│   │   ├── instructor/[id]/page.tsx
│   │   ├── compare/page.tsx
│   │   ├── path/[id]/page.tsx
│   │   ├── pricing/page.tsx
│   │   ├── about/page.tsx
│   │   ├── help/page.tsx
│   │   ├── help/[articleSlug]/page.tsx
│   │   ├── support/page.tsx
│   │   └── verify/[certId]/page.tsx
│   │
│   ├── auth/              # Auth pages — minimal layout
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   │
│   ├── (learner)/         # Learner zone — sidebar layout
│   │   ├── layout.tsx     # Learner sidebar layout
│   │   ├── learn/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── courses/page.tsx
│   │   │   ├── watch/[lessonId]/page.tsx
│   │   │   ├── notes/page.tsx
│   │   │   ├── doubts/page.tsx
│   │   │   ├── tests/page.tsx
│   │   │   ├── quiz/[quizId]/page.tsx
│   │   │   ├── assignments/page.tsx
│   │   │   ├── assignments/[id]/page.tsx
│   │   │   ├── certificates/page.tsx
│   │   │   ├── memberships/page.tsx
│   │   │   ├── saved/page.tsx
│   │   │   ├── following/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── billing/page.tsx
│   │   ├── checkout/[courseId]/page.tsx
│   │   ├── payment/success/page.tsx
│   │   └── payment/failed/page.tsx
│   │
│   ├── (studio)/          # Academy Studio — studio sidebar layout
│   │   ├── layout.tsx     # Studio sidebar layout
│   │   └── studio/
│   │       ├── dashboard/page.tsx
│   │       ├── onboarding/page.tsx
│   │       ├── courses/page.tsx
│   │       ├── courses/[id]/
│   │       │   ├── build/page.tsx
│   │       │   ├── curriculum/page.tsx
│   │       │   ├── publish/page.tsx
│   │       │   ├── resources/page.tsx
│   │       │   ├── analytics/page.tsx
│   │       │   ├── announcements/page.tsx
│   │       │   └── reviews/page.tsx
│   │       ├── courses/import/page.tsx
│   │       ├── media/page.tsx
│   │       ├── students/page.tsx
│   │       ├── students/[id]/page.tsx
│   │       ├── doubts/page.tsx
│   │       ├── quizzes/page.tsx
│   │       ├── tests/page.tsx
│   │       ├── assignments/page.tsx
│   │       ├── assignments/review/page.tsx
│   │       ├── certificates/page.tsx
│   │       ├── certificates/templates/page.tsx
│   │       ├── live-classes/page.tsx
│   │       ├── live-classes/[id]/page.tsx
│   │       ├── memberships/page.tsx
│   │       ├── payments/page.tsx
│   │       ├── analytics/page.tsx
│   │       ├── marketing/page.tsx
│   │       ├── coupons/page.tsx
│   │       ├── leads/page.tsx
│   │       ├── referrals/page.tsx
│   │       ├── landing-page/page.tsx
│   │       ├── community/page.tsx
│   │       ├── team/page.tsx
│   │       ├── ai-copilot/page.tsx
│   │       ├── ai-credits/page.tsx
│   │       ├── notifications/page.tsx
│   │       ├── data-export/page.tsx
│   │       ├── developer/page.tsx
│   │       └── settings/page.tsx
│   │
│   ├── (admin)/           # Platform Admin — admin sidebar layout
│   │   ├── layout.tsx
│   │   └── admin/
│   │       ├── dashboard/page.tsx
│   │       ├── users/page.tsx
│   │       ├── institutions/page.tsx
│   │       ├── courses/page.tsx
│   │       ├── moderation/page.tsx
│   │       ├── payments/page.tsx
│   │       ├── featured/page.tsx
│   │       ├── settings/page.tsx
│   │       └── audit-logs/page.tsx
│   │
│   ├── layout.tsx         # Root layout (providers)
│   ├── globals.css        # Design tokens + global styles
│   └── not-found.tsx      # 404 page
│
├── components/
│   ├── ui/                # shadcn/ui base components
│   ├── layout/            # Layout-level components
│   │   ├── public-navbar.tsx
│   │   ├── public-footer.tsx
│   │   ├── learner-sidebar.tsx
│   │   ├── studio-sidebar.tsx
│   │   ├── admin-sidebar.tsx
│   │   ├── top-app-bar.tsx
│   │   └── mobile-nav.tsx
│   ├── shared/            # Reusable cross-zone components
│   │   ├── course-card.tsx
│   │   ├── institution-card.tsx
│   │   ├── stat-card.tsx
│   │   ├── section-header.tsx
│   │   ├── page-header.tsx
│   │   ├── data-table.tsx
│   │   ├── empty-state.tsx
│   │   ├── loading-skeleton.tsx
│   │   ├── badge-status.tsx
│   │   ├── avatar.tsx
│   │   ├── progress-bar.tsx
│   │   └── theme-toggle.tsx
│   ├── public/            # Public zone specific
│   │   ├── hero-section.tsx
│   │   ├── trending-courses.tsx
│   │   ├── category-grid.tsx
│   │   ├── institution-hero.tsx
│   │   └── search-filters.tsx
│   ├── learner/           # Learner zone specific
│   │   ├── continue-learning.tsx
│   │   ├── enrolled-course-card.tsx
│   │   ├── upcoming-class-card.tsx
│   │   └── certificate-card.tsx
│   ├── studio/            # Studio zone specific
│   │   ├── stats-grid.tsx
│   │   ├── revenue-chart.tsx
│   │   ├── doubts-queue.tsx
│   │   ├── ai-suggestions.tsx
│   │   ├── course-builder-sidebar.tsx
│   │   └── curriculum-editor.tsx
│   └── admin/             # Admin zone specific
│       ├── users-table.tsx
│       └── moderation-queue.tsx
│
├── lib/
│   ├── utils.ts           # cn(), formatDate(), formatCurrency()
│   ├── mock-data/         # All mock data organized by domain
│   │   ├── index.ts       # Barrel export
│   │   ├── courses.ts
│   │   ├── institutions.ts
│   │   ├── users.ts
│   │   ├── learner.ts
│   │   ├── studio.ts
│   │   ├── admin.ts
│   │   ├── analytics.ts
│   │   └── notifications.ts
│   └── validations/       # Zod schemas
│       ├── auth.ts
│       ├── course.ts
│       ├── institution.ts
│       └── common.ts
│
├── store/                 # Redux Toolkit
│   ├── index.ts           # Store configuration
│   ├── hooks.ts           # useAppDispatch, useAppSelector
│   └── slices/
│       ├── auth.slice.ts
│       ├── ui.slice.ts     # sidebar open/close, theme
│       ├── institution.slice.ts  # selected institution context
│       └── player.slice.ts      # video player state
│
├── hooks/                 # Custom React hooks
│   ├── use-auth.ts
│   ├── use-courses.ts
│   ├── use-institution.ts
│   ├── use-studio.ts
│   └── use-mobile.ts
│
├── providers/             # Context providers
│   ├── app-providers.tsx  # Wraps all providers
│   ├── query-client.tsx   # TanStack Query
│   ├── redux-provider.tsx
│   └── theme-provider.tsx
│
└── types/                 # TypeScript types
    ├── course.ts
    ├── institution.ts
    ├── user.ts
    ├── enrollment.ts
    └── analytics.ts
```

---

## Layout Strategy (Key Decision)

Three distinct layout-level sidebars. Each uses Next.js Route Groups `(group)` to share layout without affecting URL:

| Group | Layout | Sidebar |
|-------|---------|---------|
| `(public)` | TopNavBar + Footer | None |
| `(learner)` | TopAppBar + LearnerSidebar | `LearnerSidebar` |
| `(studio)` | TopAppBar + StudioSidebar | `StudioSidebar` |
| `(admin)` | TopAppBar + AdminSidebar | `AdminSidebar` |
| `auth` | Minimal centered | None |

Each sidebar is a layout-level server component with active route detection via `usePathname()`.

---

## Design Tokens (globals.css)

Mapping design's B&W palette to CSS variables for dark/light mode:

```css
:root {
  /* Light mode */
  --background: 0 0% 100%;         /* #FFFFFF */
  --foreground: 0 0% 10%;          /* #1A1C1C on-surface */
  --surface: 0 0% 98%;             /* #F9F9F9 */
  --surface-container: 0 0% 93%;   /* #EEEEEE */
  --border: 0 0% 88%;              /* #E0E0E0 - normalized */
  --border-strong: 0 0% 0%;        /* #000000 - primary borders */
  --muted: 0 0% 37%;               /* #5E5E5E secondary */
  --muted-foreground: 0 0% 30%;
  --primary: 0 0% 0%;              /* #000000 */
  --primary-foreground: 0 0% 100%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 10%;
}
.dark {
  --background: 0 0% 10%;
  --foreground: 0 0% 95%;
  --surface: 0 0% 13%;
  --surface-container: 0 0% 18%;
  --border: 0 0% 25%;
  --border-strong: 0 0% 60%;
  --primary: 0 0% 95%;
  --primary-foreground: 0 0% 5%;
  --card: 0 0% 13%;
  --card-foreground: 0 0% 95%;
}
```

---

## Redux Toolkit Slices

| Slice | State |
|-------|-------|
| `auth` | `user`, `isAuthenticated`, `role`, `token` |
| `ui` | `sidebarOpen`, `mobileMenuOpen` |
| `institution` | `selectedInstitutionId`, `selectedInstitution` |
| `player` | `currentLesson`, `progress`, `isPlaying` |

---

## React Query Hooks (Mock-backed)

All queries will use mock data but simulate loading/error states:

```ts
// Example hook pattern
export function useCourses(filters) {
  return useQuery({
    queryKey: ['courses', filters],
    queryFn: () => fetchMockCourses(filters),
    staleTime: 1000 * 60 * 5,
  });
}
```

---

## Implementation Phases

### Phase 1 — Foundation (Install & Setup)
- Install missing packages (next-themes, @tanstack/react-query devtools, zod, react-hook-form, recharts)
- Setup Redux store + providers
- Setup TanStack Query client
- Setup next-themes for dark/light
- Configure globals.css with full design token system
- Set border-radius to 0 globally via shadcn config
- Install additional shadcn components needed

### Phase 2 — Layout Components
- `RootLayout` (root providers)
- `(public)` layout: PublicNavbar + PublicFooter
- `(learner)` layout: LearnerSidebar + TopAppBar
- `(studio)` layout: StudioSidebar + TopAppBar
- `(admin)` layout: AdminSidebar + TopAppBar
- `auth` layout: Centered card layout

### Phase 3 — Shared Components
- CourseCard, InstitutionCard, StatCard
- SectionHeader, PageHeader
- DataTable (TanStack Table)
- EmptyState, LoadingSkeleton
- ProgressBar, BadgeStatus, ThemeToggle

### Phase 4 — Mock Data Layer
- Full typed mock data for all 4 zones
- Zod schemas for validation
- React Query hooks per domain

### Phase 5 — Page Implementation (Priority Order)
1. **Public**: Homepage, Course Detail, Search
2. **Auth**: Login, Signup
3. **Learner**: Dashboard, My Courses, Video Watch
4. **Studio**: Dashboard, Course Management, Course Builder
5. **Admin**: Dashboard, Users, Institutions
6. Remaining pages in each zone

---

## Verification Plan

### Running Locally
```bash
cd client && npm run dev
```

### Manual Verification
- Navigate to `/` — public homepage renders
- Navigate to `/auth/login` — auth layout, no sidebar
- Navigate to `/learn/dashboard` — learner sidebar visible
- Navigate to `/studio/dashboard` — studio sidebar visible
- Navigate to `/admin/dashboard` — admin sidebar visible
- Toggle dark mode — all zones respond correctly
- Mobile responsive check — sidebars collapse

---

## Open Questions

> [!IMPORTANT]
> **Question 1**: The design uses 0px border-radius throughout. Should shadcn/ui components (e.g., Dialog, Dropdown) also be strictly square? Or can modals/popups have slight rounding?

> [!IMPORTANT]
> **Question 2**: For the `learner` route group, some pages (like `/checkout`, `/payment/success`) don't need the sidebar. Should these be in a separate layout without the sidebar?

> [!NOTE]
> **Question 3**: The current `package.json` is missing several required packages: `zod`, `react-hook-form`, `@hookform/resolvers`, `next-themes`, `recharts`, `@tanstack/react-table`. I'll install all of these in Phase 1.

> [!NOTE]
> **Question 4**: The design shows institution slugs like `/c/physics-masterclass`. Should the Studio also use an institution context switcher in the header (as shown in the design), or should each studio URL embed the institution ID?
