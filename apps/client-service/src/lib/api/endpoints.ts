export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    GOOGLE_AUTH: '/auth/google',
    GOOGLE_CALLBACK: '/auth/google/callback',
    SESSIONS: '/auth/sessions',
  },
  USERS: {
    ME: '/users/me',
    PROFILE: '/users/me/profile',
    ENROLLMENTS: '/users/me/enrollments',
  },
  COURSES: {
    LIST: '/courses',
    DETAIL: (id: string) => `/courses/${id}`,
    ENROLL: (id: string) => `/courses/${id}/enroll`,
  },
  INSTITUTIONS: {
    LIST: '/institutions',
    DETAIL: (id: string) => `/institutions/${id}`,
    BY_SLUG: (slug: string) => `/institutions/slug/${slug}`,
    MEMBERS: (id: string) => `/institutions/${id}/members`,
  },
} as const;
