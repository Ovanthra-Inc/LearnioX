Locked. For your **LearnioX V1**, think of the backend as:

```text
Client Apps
├── Public Learner Web
├── Learner Dashboard
├── Academy Studio / Creator Dashboard
└── Admin Console
        ↓
Nginx Edge
        ↓
API Gateway + BFF
        ↓
Internal FastAPI Microservices
```

The rule should be:

> Frontend never directly talks to internal services.
> Frontend talks to **API Gateway/BFF** only.
> Gateway authenticates, validates, aggregates, and forwards requests to internal services.

---

# 1. High-Level Architecture

```text
┌──────────────────────────────────────────────┐
│                  Frontend                    │
│ Next.js Learner App + Academy Studio + Admin │
└───────────────────────┬──────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────┐
│                  Nginx Edge                  │
│ SSL, reverse proxy, static/media routing     │
└───────────────────────┬──────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────┐
│              API Gateway + BFF               │
│ Auth check, routing, aggregation, rate limit │
└───────┬────────┬────────┬────────┬───────────┘
        │        │        │        │
        ▼        ▼        ▼        ▼
   Auth Svc  Institution  Course   Media ...
```

---

# 2. Core Services List

For your V1, I would structure services like this:

```text
1. API Gateway / BFF Service
2. Auth & Identity Service
3. User Profile Service
4. Institution Service
5. Institution Team & RBAC Service
6. Landing Page Service
7. Course Service
8. Lesson / Content Structure Service
9. Media / Video Service
10. Enrollment & Access Service
11. Membership / Subscription Service
12. Payment & Billing Service
13. Learner Progress Service
14. Search & Discovery Service
15. Review & Rating Service
16. Doubt / Q&A Service
17. Community Service
18. Quiz / Assessment Service
19. Assignment Service
20. Certificate Service
21. Notification Service
22. Analytics / Event Tracking Service
23. AI Copilot Service
24. Marketing / Campaign Service
25. Admin / Moderation Service
26. File / Asset Service
27. Audit Log Service
```

You do not need to create 27 repos immediately, but conceptually these are the boundaries. In implementation, some can start as separate modules and later become independent services. But since you said microservice, this is the clean service split.

---

# 3. API Gateway + BFF Service

## Responsibility

This is the single entry point for all frontend apps.

It should handle:

```text
- Public API routing
- Learner dashboard aggregation
- Creator dashboard aggregation
- Admin dashboard aggregation
- Auth token validation
- Forwarding user/institution context
- Rate limiting
- Request tracing
- Service-to-service routing
- Response shaping for frontend
```

The BFF should not own business data. It composes data from internal services.

## Example responsibilities

```text
Home page = data from discovery + institution + course + media
Course detail page = course + lesson + pricing + reviews + access
Academy Studio dashboard = institution + analytics + revenue + course + doubts
```

## Endpoint List

```http
GET  /health
GET  /api/v1/public/home
GET  /api/v1/public/search
GET  /api/v1/public/institutions/{slug}
GET  /api/v1/public/courses/{course_slug}

GET  /api/v1/me/dashboard
GET  /api/v1/me/enrollments
GET  /api/v1/me/memberships
GET  /api/v1/me/progress
GET  /api/v1/me/notifications

GET  /api/v1/studio/{institution_id}/dashboard
GET  /api/v1/studio/{institution_id}/courses
GET  /api/v1/studio/{institution_id}/students
GET  /api/v1/studio/{institution_id}/analytics
GET  /api/v1/studio/{institution_id}/revenue
GET  /api/v1/studio/{institution_id}/doubts
GET  /api/v1/studio/{institution_id}/tasks

GET  /api/v1/admin/dashboard
GET  /api/v1/admin/institutions
GET  /api/v1/admin/users
GET  /api/v1/admin/moderation-queue
```

---

# 4. Auth & Identity Service

## Responsibility

Handles authentication and identity.

```text
- Signup
- Login
- Logout
- Refresh token
- OAuth login
- Email/phone verification
- Password reset
- Session management
- Token issuing
- Token blacklisting
```

This service answers:

> Who is this user?

It should not manage institution roles deeply. That belongs to RBAC/team service.

## Endpoint List

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh
POST /api/v1/auth/verify-email
POST /api/v1/auth/resend-verification
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password

GET  /api/v1/auth/me
GET  /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/{session_id}

GET  /api/v1/auth/oauth/google/start
GET  /api/v1/auth/oauth/google/callback

POST /api/v1/auth/token/introspect
POST /api/v1/auth/token/revoke

GET  /health
```

---

# 5. User Profile Service

## Responsibility

Manages learner profile and public user metadata.

```text
- Learner profile
- Avatar
- Bio
- Preferences
- Learning interests
- Language preferences
- Saved courses
- Followed institutions
```

Auth service identifies the user. Profile service stores user details.

## Endpoint List

```http
GET    /api/v1/users/me/profile
PATCH  /api/v1/users/me/profile
POST   /api/v1/users/me/avatar

GET    /api/v1/users/me/preferences
PATCH  /api/v1/users/me/preferences

GET    /api/v1/users/me/interests
PUT    /api/v1/users/me/interests

GET    /api/v1/users/me/saved-courses
POST   /api/v1/users/me/saved-courses/{course_id}
DELETE /api/v1/users/me/saved-courses/{course_id}

GET    /api/v1/users/me/following/institutions
POST   /api/v1/users/me/following/institutions/{institution_id}
DELETE /api/v1/users/me/following/institutions/{institution_id}

GET    /api/v1/users/{user_id}/public-profile

GET    /health
```

---

# 6. Institution Service

## Responsibility

Manages institution identity.

```text
- Create institution
- Institution profile
- Branding
- Slug
- Logo
- Category
- Status
- Verification
- Public institution metadata
```

This service answers:

> What is this academy/institution?

## Endpoint List

```http
POST   /api/v1/institutions
GET    /api/v1/institutions
GET    /api/v1/institutions/{institution_id}
PATCH  /api/v1/institutions/{institution_id}
DELETE /api/v1/institutions/{institution_id}

GET    /api/v1/institutions/slug/{slug}
PATCH  /api/v1/institutions/{institution_id}/branding
PATCH  /api/v1/institutions/{institution_id}/settings

POST   /api/v1/institutions/{institution_id}/logo
POST   /api/v1/institutions/{institution_id}/banner

GET    /api/v1/institutions/{institution_id}/public
GET    /api/v1/institutions/{institution_id}/stats

POST   /api/v1/institutions/{institution_id}/submit-verification
GET    /api/v1/institutions/{institution_id}/verification-status

GET    /health
```

---

# 7. Institution Team & RBAC Service

## Responsibility

Manages institution members, roles, permissions, and invitations.

This is one of the most important services for your platform.

```text
- Owner
- Co-owner
- Admin
- Instructor
- Teaching assistant
- Doubt solver
- Marketing manager
- Content editor
- Support member
- Finance viewer
```

This service answers:

> What can this user do inside this institution?

## Endpoint List

```http
GET    /api/v1/institutions/{institution_id}/members
POST   /api/v1/institutions/{institution_id}/members/invite
PATCH  /api/v1/institutions/{institution_id}/members/{member_id}
DELETE /api/v1/institutions/{institution_id}/members/{member_id}

GET    /api/v1/institutions/{institution_id}/invites
POST   /api/v1/institutions/{institution_id}/invites/{invite_id}/accept
POST   /api/v1/institutions/{institution_id}/invites/{invite_id}/resend
DELETE /api/v1/institutions/{institution_id}/invites/{invite_id}

GET    /api/v1/institutions/{institution_id}/roles
POST   /api/v1/institutions/{institution_id}/roles
PATCH  /api/v1/institutions/{institution_id}/roles/{role_id}
DELETE /api/v1/institutions/{institution_id}/roles/{role_id}

GET    /api/v1/institutions/{institution_id}/permissions
GET    /api/v1/institutions/{institution_id}/users/{user_id}/permissions

POST   /api/v1/rbac/check
POST   /api/v1/rbac/bulk-check

GET    /health
```

Example internal check:

```json
{
  "user_id": "user_123",
  "institution_id": "inst_456",
  "permission": "course.update"
}
```

---

# 8. Landing Page Service

## Responsibility

Manages the independent public landing page for every institution.

```text
- Hero section
- About section
- Featured courses
- Teachers section
- Testimonials
- FAQs
- Contact section
- SEO metadata
- Theme config
- Page publishing
```

This makes every channel feel like an independent ed-tech platform.

## Endpoint List

```http
GET    /api/v1/institutions/{institution_id}/landing-page
PATCH  /api/v1/institutions/{institution_id}/landing-page

GET    /api/v1/institutions/{institution_id}/landing-page/sections
POST   /api/v1/institutions/{institution_id}/landing-page/sections
PATCH  /api/v1/institutions/{institution_id}/landing-page/sections/{section_id}
DELETE /api/v1/institutions/{institution_id}/landing-page/sections/{section_id}

PATCH  /api/v1/institutions/{institution_id}/landing-page/theme
PATCH  /api/v1/institutions/{institution_id}/landing-page/seo

POST   /api/v1/institutions/{institution_id}/landing-page/publish
POST   /api/v1/institutions/{institution_id}/landing-page/unpublish
GET    /api/v1/public/academy-sites/{slug}

GET    /health
```

---

# 9. Course Service

## Responsibility

Owns course/program metadata.

```text
- Course title
- Description
- Category
- Level
- Language
- Pricing mode
- Publish status
- Course settings
- Course instructors
- Course outcomes
```

It should not own video files directly. It references media IDs from Media Service.

## Endpoint List

```http
POST   /api/v1/institutions/{institution_id}/courses
GET    /api/v1/institutions/{institution_id}/courses
GET    /api/v1/courses/{course_id}
PATCH  /api/v1/courses/{course_id}
DELETE /api/v1/courses/{course_id}

GET    /api/v1/courses/slug/{course_slug}
PATCH  /api/v1/courses/{course_id}/pricing
PATCH  /api/v1/courses/{course_id}/settings
PATCH  /api/v1/courses/{course_id}/seo

POST   /api/v1/courses/{course_id}/publish
POST   /api/v1/courses/{course_id}/unpublish
POST   /api/v1/courses/{course_id}/archive

GET    /api/v1/courses/{course_id}/instructors
POST   /api/v1/courses/{course_id}/instructors
DELETE /api/v1/courses/{course_id}/instructors/{user_id}

GET    /api/v1/public/courses
GET    /api/v1/public/courses/{course_slug}

GET    /health
```

---

# 10. Lesson / Content Structure Service

## Responsibility

Manages course structure.

```text
- Modules
- Lessons
- Lesson ordering
- Lesson type
- Free preview flag
- Prerequisites
- Drip schedule
```

Lesson can be:

```text
video
text
pdf
quiz
assignment
live-class
external-link
```

## Endpoint List

```http
GET    /api/v1/courses/{course_id}/curriculum
PUT    /api/v1/courses/{course_id}/curriculum/reorder

POST   /api/v1/courses/{course_id}/modules
GET    /api/v1/courses/{course_id}/modules
PATCH  /api/v1/modules/{module_id}
DELETE /api/v1/modules/{module_id}
PUT    /api/v1/modules/{module_id}/reorder

POST   /api/v1/modules/{module_id}/lessons
GET    /api/v1/modules/{module_id}/lessons
GET    /api/v1/lessons/{lesson_id}
PATCH  /api/v1/lessons/{lesson_id}
DELETE /api/v1/lessons/{lesson_id}
PUT    /api/v1/lessons/{lesson_id}/reorder

PATCH  /api/v1/lessons/{lesson_id}/access
PATCH  /api/v1/lessons/{lesson_id}/drip-schedule
POST   /api/v1/lessons/{lesson_id}/mark-preview
POST   /api/v1/lessons/{lesson_id}/remove-preview

GET    /api/v1/public/courses/{course_id}/curriculum-preview

GET    /health
```

---

# 11. Media / Video Service

## Responsibility

Handles video upload, processing, playback, thumbnails, subtitles, and streaming metadata.

```text
- Upload video
- Store video metadata
- Generate playback URL
- Process video
- Transcode video
- Thumbnail
- Subtitle
- Duration
- Video status
```

Actual storage can be S3, Cloudflare R2, Azure Blob, or Mux/Bunny/Cloudflare Stream.

## Endpoint List

```http
POST   /api/v1/media/videos/upload-init
POST   /api/v1/media/videos/upload-complete
GET    /api/v1/media/videos/{video_id}
DELETE /api/v1/media/videos/{video_id}

GET    /api/v1/media/videos/{video_id}/playback
GET    /api/v1/media/videos/{video_id}/status
POST   /api/v1/media/videos/{video_id}/process
POST   /api/v1/media/videos/{video_id}/thumbnail

GET    /api/v1/media/videos/{video_id}/subtitles
POST   /api/v1/media/videos/{video_id}/subtitles
DELETE /api/v1/media/videos/{video_id}/subtitles/{subtitle_id}

POST   /api/v1/media/videos/{video_id}/chapters
GET    /api/v1/media/videos/{video_id}/chapters

POST   /api/v1/media/webhooks/transcoding
POST   /api/v1/media/webhooks/storage

GET    /health
```

---

# 12. File / Asset Service

## Responsibility

Handles PDFs, notes, images, banners, avatars, assignments, downloadable resources.

```text
- File upload
- Signed URL
- File metadata
- Institution assets
- Course resources
- Lesson attachments
```

## Endpoint List

```http
POST   /api/v1/assets/upload-init
POST   /api/v1/assets/upload-complete
GET    /api/v1/assets/{asset_id}
DELETE /api/v1/assets/{asset_id}

GET    /api/v1/assets/{asset_id}/download-url
GET    /api/v1/assets/{asset_id}/preview-url

POST   /api/v1/institutions/{institution_id}/assets
GET    /api/v1/institutions/{institution_id}/assets

POST   /api/v1/courses/{course_id}/resources
GET    /api/v1/courses/{course_id}/resources
DELETE /api/v1/courses/{course_id}/resources/{asset_id}

POST   /api/v1/lessons/{lesson_id}/attachments
GET    /api/v1/lessons/{lesson_id}/attachments
DELETE /api/v1/lessons/{lesson_id}/attachments/{asset_id}

GET    /health
```

---

# 13. Enrollment & Access Service

## Responsibility

This is the gatekeeper for course access.

```text
- Course enrollment
- Free enrollment
- Paid enrollment
- Access checking
- Lesson access checking
- Institution membership access
- Batch-based access
```

This service answers:

> Can this learner access this course or lesson?

## Endpoint List

```http
POST   /api/v1/courses/{course_id}/enroll
GET    /api/v1/users/me/enrollments
GET    /api/v1/users/me/enrollments/{enrollment_id}

GET    /api/v1/courses/{course_id}/enrollments
GET    /api/v1/courses/{course_id}/students

POST   /api/v1/access/course/check
POST   /api/v1/access/lesson/check
POST   /api/v1/access/bulk-check

GET    /api/v1/users/{user_id}/courses/{course_id}/access
GET    /api/v1/users/{user_id}/lessons/{lesson_id}/access

POST   /api/v1/enrollments/{enrollment_id}/cancel
POST   /api/v1/enrollments/{enrollment_id}/expire
POST   /api/v1/enrollments/{enrollment_id}/reactivate

GET    /health
```

---

# 14. Membership / Subscription Service

## Responsibility

Handles YouTube paid-member-like course/institution access.

```text
- Institution membership plans
- Course bundles
- Monthly plans
- Yearly plans
- Subscription status
- Membership benefits
```

## Endpoint List

```http
POST   /api/v1/institutions/{institution_id}/membership-plans
GET    /api/v1/institutions/{institution_id}/membership-plans
GET    /api/v1/membership-plans/{plan_id}
PATCH  /api/v1/membership-plans/{plan_id}
DELETE /api/v1/membership-plans/{plan_id}

POST   /api/v1/membership-plans/{plan_id}/benefits
GET    /api/v1/membership-plans/{plan_id}/benefits
PATCH  /api/v1/membership-plans/{plan_id}/benefits/{benefit_id}
DELETE /api/v1/membership-plans/{plan_id}/benefits/{benefit_id}

POST   /api/v1/users/me/subscriptions
GET    /api/v1/users/me/subscriptions
GET    /api/v1/subscriptions/{subscription_id}
POST   /api/v1/subscriptions/{subscription_id}/cancel
POST   /api/v1/subscriptions/{subscription_id}/resume

GET    /api/v1/institutions/{institution_id}/subscribers
GET    /api/v1/users/{user_id}/institutions/{institution_id}/membership-status

GET    /health
```

---

# 15. Payment & Billing Service

## Responsibility

Handles money.

```text
- Course purchases
- Membership payments
- Invoices
- Refunds
- Coupons
- Revenue split
- Institution payouts
- Payment gateway webhooks
```

Use this separately from Membership Service. Membership decides plan/access. Payment handles transactions.

## Endpoint List

```http
POST   /api/v1/payments/checkout/course
POST   /api/v1/payments/checkout/membership
POST   /api/v1/payments/checkout/live-batch

GET    /api/v1/payments/{payment_id}
GET    /api/v1/users/me/payments
GET    /api/v1/institutions/{institution_id}/payments

POST   /api/v1/payments/{payment_id}/verify
POST   /api/v1/payments/{payment_id}/refund

POST   /api/v1/coupons
GET    /api/v1/institutions/{institution_id}/coupons
PATCH  /api/v1/coupons/{coupon_id}
DELETE /api/v1/coupons/{coupon_id}
POST   /api/v1/coupons/validate

GET    /api/v1/institutions/{institution_id}/revenue
GET    /api/v1/institutions/{institution_id}/payouts
POST   /api/v1/institutions/{institution_id}/payouts/request

POST   /api/v1/payments/webhooks/razorpay
POST   /api/v1/payments/webhooks/stripe

GET    /health
```

---

# 16. Learner Progress Service

## Responsibility

Tracks learner activity and progress.

```text
- Lesson completion
- Watch progress
- Course percentage
- Last watched lesson
- Resume learning
- Learning streak
```

## Endpoint List

```http
GET   /api/v1/users/me/progress
GET   /api/v1/users/me/courses/{course_id}/progress
GET   /api/v1/users/me/lessons/{lesson_id}/progress

POST  /api/v1/progress/lessons/{lesson_id}/watch
POST  /api/v1/progress/lessons/{lesson_id}/complete
POST  /api/v1/progress/lessons/{lesson_id}/uncomplete

GET   /api/v1/courses/{course_id}/progress-summary
GET   /api/v1/institutions/{institution_id}/progress/learners
GET   /api/v1/institutions/{institution_id}/progress/courses/{course_id}

GET   /api/v1/users/me/continue-learning
GET   /api/v1/users/me/streak

GET   /health
```

---

# 17. Search & Discovery Service

## Responsibility

Handles marketplace discovery.

```text
- Course search
- Institution search
- Teacher search
- Category pages
- Trending courses
- Recommendations
- Public home feed
```

This can use PostgreSQL full-text initially, then Elasticsearch/OpenSearch/Meilisearch later.

## Endpoint List

```http
GET  /api/v1/search
GET  /api/v1/search/courses
GET  /api/v1/search/institutions
GET  /api/v1/search/instructors
GET  /api/v1/search/suggestions

GET  /api/v1/discovery/home
GET  /api/v1/discovery/trending-courses
GET  /api/v1/discovery/trending-institutions
GET  /api/v1/discovery/categories
GET  /api/v1/discovery/categories/{category_slug}
GET  /api/v1/discovery/free-courses
GET  /api/v1/discovery/live-batches
GET  /api/v1/discovery/recommended

POST /api/v1/search/index/course
POST /api/v1/search/index/institution
POST /api/v1/search/reindex

GET  /health
```

---

# 18. Review & Rating Service

## Responsibility

Handles course and institution social proof.

```text
- Course reviews
- Institution reviews
- Ratings
- Testimonials
- Review moderation
```

## Endpoint List

```http
POST   /api/v1/courses/{course_id}/reviews
GET    /api/v1/courses/{course_id}/reviews
PATCH  /api/v1/reviews/{review_id}
DELETE /api/v1/reviews/{review_id}

POST   /api/v1/institutions/{institution_id}/reviews
GET    /api/v1/institutions/{institution_id}/reviews

POST   /api/v1/reviews/{review_id}/report
POST   /api/v1/reviews/{review_id}/helpful

GET    /api/v1/courses/{course_id}/rating-summary
GET    /api/v1/institutions/{institution_id}/rating-summary

GET    /api/v1/admin/reviews/moderation
POST   /api/v1/admin/reviews/{review_id}/approve
POST   /api/v1/admin/reviews/{review_id}/reject

GET    /health
```

---

# 19. Doubt / Q&A Service

## Responsibility

Handles learner doubts under courses and lessons.

```text
- Ask doubt
- Answer doubt
- Instructor reply
- AI draft reply
- Mark resolved
- Upvote
- Internal assignment to instructor/doubt solver
```

## Endpoint List

```http
POST   /api/v1/lessons/{lesson_id}/doubts
GET    /api/v1/lessons/{lesson_id}/doubts
GET    /api/v1/doubts/{doubt_id}
PATCH  /api/v1/doubts/{doubt_id}
DELETE /api/v1/doubts/{doubt_id}

POST   /api/v1/doubts/{doubt_id}/answers
GET    /api/v1/doubts/{doubt_id}/answers
PATCH  /api/v1/doubt-answers/{answer_id}
DELETE /api/v1/doubt-answers/{answer_id}

POST   /api/v1/doubts/{doubt_id}/resolve
POST   /api/v1/doubts/{doubt_id}/reopen
POST   /api/v1/doubts/{doubt_id}/upvote
POST   /api/v1/doubts/{doubt_id}/assign

GET    /api/v1/institutions/{institution_id}/doubts
GET    /api/v1/institutions/{institution_id}/doubts/pending
GET    /api/v1/users/me/doubts

POST   /api/v1/doubts/{doubt_id}/ai-draft-answer

GET    /health
```

---

# 20. Community Service

## Responsibility

Handles institution-level community.

```text
- Institution announcements
- Discussion posts
- Comments
- Community spaces
- Course groups
```

## Endpoint List

```http
POST   /api/v1/institutions/{institution_id}/community/spaces
GET    /api/v1/institutions/{institution_id}/community/spaces
PATCH  /api/v1/community/spaces/{space_id}
DELETE /api/v1/community/spaces/{space_id}

POST   /api/v1/community/spaces/{space_id}/posts
GET    /api/v1/community/spaces/{space_id}/posts
GET    /api/v1/community/posts/{post_id}
PATCH  /api/v1/community/posts/{post_id}
DELETE /api/v1/community/posts/{post_id}

POST   /api/v1/community/posts/{post_id}/comments
GET    /api/v1/community/posts/{post_id}/comments
PATCH  /api/v1/community/comments/{comment_id}
DELETE /api/v1/community/comments/{comment_id}

POST   /api/v1/community/posts/{post_id}/like
DELETE /api/v1/community/posts/{post_id}/like

POST   /api/v1/institutions/{institution_id}/announcements
GET    /api/v1/institutions/{institution_id}/announcements

GET    /health
```

---

# 21. Quiz / Assessment Service

## Responsibility

Handles quizzes, tests, questions, submissions, scoring.

```text
- Quiz builder
- Question bank
- MCQ
- Descriptive questions
- Attempts
- Auto scoring
- Result analysis
```

## Endpoint List

```http
POST   /api/v1/courses/{course_id}/quizzes
GET    /api/v1/courses/{course_id}/quizzes
GET    /api/v1/quizzes/{quiz_id}
PATCH  /api/v1/quizzes/{quiz_id}
DELETE /api/v1/quizzes/{quiz_id}

POST   /api/v1/quizzes/{quiz_id}/questions
GET    /api/v1/quizzes/{quiz_id}/questions
PATCH  /api/v1/questions/{question_id}
DELETE /api/v1/questions/{question_id}

POST   /api/v1/quizzes/{quiz_id}/publish
POST   /api/v1/quizzes/{quiz_id}/unpublish

POST   /api/v1/quizzes/{quiz_id}/attempts
GET    /api/v1/quiz-attempts/{attempt_id}
POST   /api/v1/quiz-attempts/{attempt_id}/submit
GET    /api/v1/quiz-attempts/{attempt_id}/result

GET    /api/v1/users/me/quiz-attempts
GET    /api/v1/courses/{course_id}/quiz-analytics
GET    /api/v1/institutions/{institution_id}/quiz-analytics

GET    /health
```

---

# 22. Assignment Service

## Responsibility

Handles assignments and manual review.

```text
- Assignment creation
- File/text submission
- Instructor review
- Marks
- Feedback
- Resubmission
```

## Endpoint List

```http
POST   /api/v1/courses/{course_id}/assignments
GET    /api/v1/courses/{course_id}/assignments
GET    /api/v1/assignments/{assignment_id}
PATCH  /api/v1/assignments/{assignment_id}
DELETE /api/v1/assignments/{assignment_id}

POST   /api/v1/assignments/{assignment_id}/publish
POST   /api/v1/assignments/{assignment_id}/unpublish

POST   /api/v1/assignments/{assignment_id}/submissions
GET    /api/v1/assignments/{assignment_id}/submissions
GET    /api/v1/assignment-submissions/{submission_id}
PATCH  /api/v1/assignment-submissions/{submission_id}

POST   /api/v1/assignment-submissions/{submission_id}/review
POST   /api/v1/assignment-submissions/{submission_id}/return
POST   /api/v1/assignment-submissions/{submission_id}/request-resubmission

GET    /api/v1/users/me/assignments
GET    /api/v1/institutions/{institution_id}/assignment-review-queue

GET    /health
```

---

# 23. Certificate Service

## Responsibility

Handles certificates.

```text
- Certificate templates
- Certificate eligibility
- Certificate generation
- Public verification
```

## Endpoint List

```http
POST   /api/v1/institutions/{institution_id}/certificate-templates
GET    /api/v1/institutions/{institution_id}/certificate-templates
PATCH  /api/v1/certificate-templates/{template_id}
DELETE /api/v1/certificate-templates/{template_id}

POST   /api/v1/courses/{course_id}/certificate-settings
GET    /api/v1/courses/{course_id}/certificate-settings

POST   /api/v1/courses/{course_id}/certificates/generate
GET    /api/v1/users/me/certificates
GET    /api/v1/certificates/{certificate_id}
GET    /api/v1/certificates/{certificate_id}/download

GET    /api/v1/certificates/verify/{verification_code}

GET    /health
```

---

# 24. Notification Service

## Responsibility

Handles notifications across the platform.

```text
- In-app notifications
- Email
- SMS
- WhatsApp
- Push notifications
- Notification templates
```

## Endpoint List

```http
GET    /api/v1/notifications/me
POST   /api/v1/notifications/mark-read
POST   /api/v1/notifications/{notification_id}/read
DELETE /api/v1/notifications/{notification_id}

POST   /api/v1/notifications/send
POST   /api/v1/notifications/bulk-send

GET    /api/v1/notification-preferences/me
PATCH  /api/v1/notification-preferences/me

POST   /api/v1/institutions/{institution_id}/notification-templates
GET    /api/v1/institutions/{institution_id}/notification-templates
PATCH  /api/v1/notification-templates/{template_id}
DELETE /api/v1/notification-templates/{template_id}

POST   /api/v1/notifications/webhooks/email
POST   /api/v1/notifications/webhooks/sms

GET    /health
```

---

# 25. Analytics / Event Tracking Service

## Responsibility

Tracks everything.

```text
- Page views
- Course views
- Video watch events
- Search events
- Enrollment funnel
- Revenue analytics
- Learner engagement
- Institution dashboard metrics
```

This service powers the creator dashboard.

## Endpoint List

```http
POST /api/v1/events/track
POST /api/v1/events/batch

GET  /api/v1/analytics/institutions/{institution_id}/overview
GET  /api/v1/analytics/institutions/{institution_id}/courses
GET  /api/v1/analytics/institutions/{institution_id}/learners
GET  /api/v1/analytics/institutions/{institution_id}/revenue
GET  /api/v1/analytics/institutions/{institution_id}/engagement
GET  /api/v1/analytics/institutions/{institution_id}/funnel

GET  /api/v1/analytics/courses/{course_id}/overview
GET  /api/v1/analytics/courses/{course_id}/lessons
GET  /api/v1/analytics/courses/{course_id}/dropoff
GET  /api/v1/analytics/courses/{course_id}/completion

GET  /api/v1/analytics/platform/overview
GET  /api/v1/analytics/platform/growth
GET  /api/v1/analytics/platform/revenue

GET  /health
```

---

# 26. AI Copilot Service

## Responsibility

This is your biggest differentiator.

It helps a single person run an institution.

```text
- Generate course outline
- Generate lesson plan
- Generate quiz
- Generate notes
- Generate video summary
- Generate timestamps
- Generate doubt answer drafts
- Generate marketing copy
- Analyze course performance
- Suggest improvements
```

## Endpoint List

```http
POST /api/v1/ai/course-outline
POST /api/v1/ai/lesson-plan
POST /api/v1/ai/course-description
POST /api/v1/ai/course-outcomes

POST /api/v1/ai/video/transcribe
POST /api/v1/ai/video/summary
POST /api/v1/ai/video/chapters
POST /api/v1/ai/video/notes
POST /api/v1/ai/video/quiz

POST /api/v1/ai/doubts/{doubt_id}/draft-answer
POST /api/v1/ai/quizzes/generate
POST /api/v1/ai/assignments/generate

POST /api/v1/ai/marketing/landing-copy
POST /api/v1/ai/marketing/email
POST /api/v1/ai/marketing/social-post
POST /api/v1/ai/marketing/ad-copy

POST /api/v1/ai/analytics/course-insights
POST /api/v1/ai/analytics/dropoff-analysis
POST /api/v1/ai/analytics/recommend-actions

GET  /api/v1/ai/jobs/{job_id}
GET  /api/v1/ai/institutions/{institution_id}/usage

GET  /health
```

---

# 27. Marketing / Campaign Service

## Responsibility

Helps institutions promote courses.

```text
- Coupons
- Campaigns
- Email campaigns
- WhatsApp campaigns
- Referral links
- UTM tracking
- Lead capture
```

Coupons may live in Payment Service, but marketing owns campaign logic.

## Endpoint List

```http
POST   /api/v1/institutions/{institution_id}/campaigns
GET    /api/v1/institutions/{institution_id}/campaigns
GET    /api/v1/campaigns/{campaign_id}
PATCH  /api/v1/campaigns/{campaign_id}
DELETE /api/v1/campaigns/{campaign_id}

POST   /api/v1/campaigns/{campaign_id}/launch
POST   /api/v1/campaigns/{campaign_id}/pause
POST   /api/v1/campaigns/{campaign_id}/resume

POST   /api/v1/institutions/{institution_id}/lead-forms
GET    /api/v1/institutions/{institution_id}/lead-forms
POST   /api/v1/lead-forms/{form_id}/submit
GET    /api/v1/institutions/{institution_id}/leads

POST   /api/v1/institutions/{institution_id}/referral-programs
GET    /api/v1/institutions/{institution_id}/referral-programs
POST   /api/v1/referrals/track
GET    /api/v1/referrals/{referral_code}

GET    /api/v1/campaigns/{campaign_id}/analytics

GET    /health
```

---

# 28. Admin / Moderation Service

## Responsibility

Platform owner/admin controls.

```text
- Manage users
- Manage institutions
- Approve/reject institutions
- Moderate content
- Handle reports
- Platform settings
```

## Endpoint List

```http
GET   /api/v1/admin/users
GET   /api/v1/admin/users/{user_id}
PATCH /api/v1/admin/users/{user_id}
POST  /api/v1/admin/users/{user_id}/suspend
POST  /api/v1/admin/users/{user_id}/unsuspend

GET   /api/v1/admin/institutions
GET   /api/v1/admin/institutions/{institution_id}
POST  /api/v1/admin/institutions/{institution_id}/approve
POST  /api/v1/admin/institutions/{institution_id}/reject
POST  /api/v1/admin/institutions/{institution_id}/suspend

GET   /api/v1/admin/content/reports
POST  /api/v1/admin/content/reports/{report_id}/resolve

GET   /api/v1/admin/courses
POST  /api/v1/admin/courses/{course_id}/feature
POST  /api/v1/admin/courses/{course_id}/unfeature

GET   /api/v1/admin/platform/settings
PATCH /api/v1/admin/platform/settings

GET   /health
```

---

# 29. Audit Log Service

## Responsibility

Stores important actions.

```text
- Login events
- Role changes
- Course publish events
- Payment actions
- Admin actions
- Security-sensitive activity
```

This is very important for institution-level trust.

## Endpoint List

```http
POST /api/v1/audit/events
GET  /api/v1/audit/events

GET  /api/v1/audit/institutions/{institution_id}
GET  /api/v1/audit/users/{user_id}
GET  /api/v1/audit/admin

GET  /api/v1/audit/events/{event_id}

GET  /health
```

---

# 30. Service Ownership Summary

Use this as your reference table.

| Service              | Owns                             |
| -------------------- | -------------------------------- |
| API Gateway/BFF      | Frontend-facing API composition  |
| Auth Service         | Login, token, sessions           |
| User Profile Service | Learner profile, interests       |
| Institution Service  | Academy identity                 |
| RBAC Service         | Team, roles, permissions         |
| Landing Page Service | Institution mini-site            |
| Course Service       | Course metadata                  |
| Lesson Service       | Modules, lessons, curriculum     |
| Media Service        | Video upload/playback            |
| Asset Service        | PDFs, images, files              |
| Enrollment Service   | Course access                    |
| Membership Service   | Institution/course subscriptions |
| Payment Service      | Transactions, refunds, payouts   |
| Progress Service     | Learning progress                |
| Search Service       | Discovery/search                 |
| Review Service       | Ratings/testimonials             |
| Doubt Service        | Q&A                              |
| Community Service    | Posts, comments, announcements   |
| Quiz Service         | Tests and attempts               |
| Assignment Service   | Submissions and review           |
| Certificate Service  | Certificates                     |
| Notification Service | Email, push, in-app              |
| Analytics Service    | Event tracking and dashboards    |
| AI Copilot Service   | AI automation                    |
| Marketing Service    | Campaigns, referrals, leads      |
| Admin Service        | Platform governance              |
| Audit Service        | Action logs                      |

---

# 31. Suggested Internal Communication Pattern

For V1, use REST between services.

```text
Frontend
↓
Gateway/BFF
↓ REST
Internal Services
```

For async operations, use events later:

```text
Video Uploaded
↓
Media Service emits event
↓
AI Service generates transcript/summary/quiz
↓
Notification Service notifies creator
```

You can start with REST and add message queue later.

Recommended event examples:

```text
user.registered
institution.created
course.created
course.published
lesson.completed
course.enrolled
payment.success
payment.failed
membership.activated
video.uploaded
video.processed
doubt.created
certificate.generated
```

---

# 32. Recommended Folder Structure

For each FastAPI service:

```text
services/
└── course_service/
    ├── app/
    │   ├── main.py
    │   ├── api/
    │   │   └── v1/
    │   │       ├── routes.py
    │   │       └── endpoints/
    │   ├── core/
    │   │   ├── config.py
    │   │   ├── security.py
    │   │   └── logging.py
    │   ├── db/
    │   │   ├── session.py
    │   │   └── base.py
    │   ├── models/
    │   ├── schemas/
    │   ├── repositories/
    │   ├── services/
    │   ├── clients/
    │   └── utils/
    ├── alembic/
    ├── tests/
    ├── Dockerfile
    └── pyproject.toml
```

For the whole repo:

```text
learniox-platform/
├── apps/
│   ├── web/
│   ├── studio/
│   └── admin/
├── services/
│   ├── api_gateway/
│   ├── auth_service/
│   ├── user_service/
│   ├── institution_service/
│   ├── rbac_service/
│   ├── course_service/
│   ├── lesson_service/
│   ├── media_service/
│   ├── enrollment_service/
│   ├── membership_service/
│   ├── payment_service/
│   ├── progress_service/
│   ├── search_service/
│   ├── doubt_service/
│   ├── quiz_service/
│   ├── ai_service/
│   ├── notification_service/
│   └── analytics_service/
├── packages/
│   ├── shared-types/
│   ├── python-common/
│   └── openapi-clients/
├── infra/
│   ├── nginx/
│   ├── docker-compose.yml
│   └── k8s/
└── docs/
```

---

# 33. Nginx Responsibility

Nginx should sit before the API Gateway.

```text
Nginx responsibilities:
- SSL termination
- Reverse proxy
- Request size limits
- Static file routing
- CDN/cache headers
- Basic rate limiting
- Forward headers
- Route frontend and API separately
```

Example route structure:

```text
learniox.com              → Next.js public web
studio.learniox.com       → Next.js academy studio
admin.learniox.com        → Admin console
api.learniox.com          → API Gateway
media.learniox.com        → Media/CDN origin
```

---

# 34. API Gateway Route Mapping

The gateway can expose clean routes and forward internally.

```text
/api/v1/auth/*              → auth_service
/api/v1/users/*             → user_service
/api/v1/institutions/*      → institution_service / rbac / landing
/api/v1/courses/*           → course_service / lesson_service
/api/v1/media/*             → media_service
/api/v1/enrollments/*       → enrollment_service
/api/v1/memberships/*       → membership_service
/api/v1/payments/*          → payment_service
/api/v1/search/*            → search_service
/api/v1/doubts/*            → doubt_service
/api/v1/quizzes/*           → quiz_service
/api/v1/ai/*                → ai_service
/api/v1/analytics/*         → analytics_service
/api/v1/notifications/*     → notification_service
/api/v1/admin/*             → admin_service
```

---

# 35. Most Important V1 Build Order

Because this is V1, not MVP, still build in dependency order.

```text
Phase 1: Platform Foundation
1. Nginx
2. API Gateway/BFF
3. Auth Service
4. User Profile Service
5. Institution Service
6. RBAC Service

Phase 2: Core Learning Engine
7. Course Service
8. Lesson Service
9. Media Service
10. Asset Service
11. Enrollment & Access Service
12. Progress Service

Phase 3: Monetization
13. Membership Service
14. Payment Service
15. Coupon/Payout logic

Phase 4: Institution Experience
16. Landing Page Service
17. Studio Dashboard BFF
18. Analytics Service
19. Notification Service

Phase 5: Learning Engagement
20. Doubt Service
21. Quiz Service
22. Assignment Service
23. Certificate Service
24. Community Service

Phase 6: Growth + Automation
25. Search & Discovery Service
26. Review Service
27. Marketing Service
28. AI Copilot Service

Phase 7: Platform Governance
29. Admin Service
30. Audit Log Service
```

---

# 36. Final Recommended Service Set for First Implementation

Even though the product V1 is big, your first backend skeleton should include these services from day one:

```text
api_gateway
auth_service
user_service
institution_service
rbac_service
course_service
lesson_service
media_service
enrollment_service
membership_service
payment_service
progress_service
search_service
analytics_service
notification_service
ai_service
admin_service
audit_service
```

Then add these after the base is stable:

```text
landing_page_service
doubt_service
quiz_service
assignment_service
certificate_service
community_service
review_service
marketing_service
asset_service
```

My honest recommendation: keep **asset_service with media_service initially** if you want faster development. Later split asset and video when storage complexity grows.

Final architecture name:

```text
LearnioX Microservice Architecture V1

Edge:
- Nginx

Public API:
- API Gateway + BFF

Core Domain:
- Auth
- User
- Institution
- RBAC
- Course
- Lesson
- Media
- Enrollment
- Membership
- Payment
- Progress

Experience:
- Landing Page
- Search
- Doubt
- Community
- Quiz
- Assignment
- Certificate
- Review

Operations:
- Notification
- Analytics
- AI Copilot
- Marketing
- Admin
- Audit
```

This structure perfectly fits your idea:

> One platform, many institutions, each institution as an independent ed-tech business, with YouTube-like discovery and paid learning memberships.
