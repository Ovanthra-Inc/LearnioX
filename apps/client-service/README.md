# LearnioX Client Service (`client-service`)

The **Client Service** is the web application user interface for the **LearnioX** platform. Built using Next.js 14 (App Router), React 18, Tailwind CSS, Shadcn UI Radix primitives, Redux Toolkit (RTK), TanStack React Query v5, and Sonner toast notifications.

---

## 🎨 Tech Stack & Architecture

- **Framework**: Next.js 14 (App Router, Standalone output)
- **UI Library**: Shadcn UI (Radix UI primitives + Tailwind CSS utility classes)
- **Theming**: Dark & Light Mode (`next-themes` / ThemeProvider) with dark mode default
- **State Management**: Redux Toolkit (RTK) (`@reduxjs/toolkit`, `react-redux`) for global app state (auth session, user profile)
- **Data Fetching**: TanStack React Query (v5) (`@tanstack/react-query`)
- **HTTP Client**: Centralized Axios instance (`apiClient`) targeting `/api/v1` (Nginx Ingress/Gateway), equipped with automatic JWT Bearer injection and 401 token rotation interceptors
- **Notifications**: Sonner (`sonner`) toast notification system

---

## 🧭 Pages & Routes

| Route | Page Component | Description |
| :--- | :--- | :--- |
| `/` | `src/app/page.tsx` | Platform landing page with hero banner & featured courses |
| `/auth/login` | `src/app/auth/login/page.tsx` | Google OAuth 2.0 & Developer bypass authentication |
| `/courses` | `src/app/courses/page.tsx` | Course catalog with real-time keyword search and level filtering |
| `/courses/[id]` | `src/app/courses/[id]/page.tsx` | Course detail view, curriculum modules, pricing, coupon input, purchase & auto-enrollment |
| `/dashboard` | `src/app/dashboard/page.tsx` | Student learning dashboard, active course progress, certificate tracking |
| `/institution` | `src/app/institution/page.tsx` | Multi-tenant organization creation, owned institutions list, team & course authoring controls |

---

## 🚀 Running Locally

```bash
# Install dependencies
npm install --legacy-peer-deps

# Development server
npm run dev

# Standalone Production Build
npm run build
```
