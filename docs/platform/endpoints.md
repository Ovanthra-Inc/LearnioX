# Phase 1 — Authentication

Base

```
/auth
```

### OAuth

```
GET    /auth/google
GET    /auth/google/callback

GET    /auth/github          (future)
GET    /auth/microsoft       (future)
```

### Session

```
POST   /auth/refresh
POST   /auth/logout
POST   /auth/logout-all

GET    /auth/me
GET    /auth/sessions

DELETE /auth/sessions/{id}
```

### User

```
GET    /users/me

PATCH  /users/me

DELETE /users/me

PATCH  /users/avatar

DELETE /users/avatar

PATCH  /users/preferences

PATCH  /users/language

PATCH  /users/theme
```

---

# Phase 2 — File Storage

```
/storage
```

Upload

```
POST /storage/upload/image

POST /storage/upload/video

POST /storage/upload/pdf

POST /storage/upload/file

POST /storage/upload/multiple
```

Read

```
GET /storage/files

GET /storage/files/{id}

GET /storage/files/{id}/download

GET /storage/files/{id}/preview
```

Update

```
PATCH /storage/files/{id}

PATCH /storage/files/{id}/move

PATCH /storage/files/{id}/rename
```

Delete

```
DELETE /storage/files/{id}
```

Folder

```
POST /storage/folders

PATCH /storage/folders/{id}

DELETE /storage/folders/{id}

GET /storage/folders
```

Storage Usage

```
GET /storage/usage

GET /storage/statistics
```

---

# Phase 3 — Institution

```
/institutions
```

Institution

```
POST

GET

GET /{id}

GET /slug/{slug}

PATCH /{id}

DELETE /{id}

PATCH /{id}/publish

PATCH /{id}/archive

PATCH /{id}/restore
```

Branding

```
PATCH /{id}/logo

PATCH /{id}/banner

PATCH /{id}/favicon
```

Settings

```
GET /{id}/settings

PATCH /{id}/settings
```

Landing Page

```
GET /{id}/landing-page

PATCH /{id}/landing-page
```

Analytics

```
GET /{id}/analytics
```

Search

```
GET /institutions/search

GET /institutions/trending

GET /institutions/popular

GET /institutions/latest
```

---

# Phase 4 — Team Members

```
/institutions/{institutionId}/members
```

```
POST

GET

GET /{memberId}

PATCH /{memberId}

DELETE /{memberId}

POST /invite

POST /invite/resend

DELETE /invite/{id}

GET /pending

PATCH /accept

PATCH /reject
```

---

# Phase 5 — Roles

```
/roles
```

```
POST

GET

GET /{id}

PATCH /{id}

DELETE /{id}
```

Permissions

```
GET /roles/{id}/permissions

PATCH /roles/{id}/permissions
```

Assign

```
POST /members/{id}/roles

DELETE /members/{id}/roles/{roleId}
```

---

# Phase 6 — Courses

```
/courses
```

CRUD

```
POST

GET

GET /{id}

PATCH /{id}

DELETE /{id}
```

Publish

```
PATCH /{id}/publish

PATCH /{id}/draft

PATCH /{id}/archive

PATCH /{id}/duplicate

PATCH /{id}/visibility
```

Thumbnail

```
PATCH /{id}/thumbnail

DELETE /{id}/thumbnail
```

Pricing

```
PATCH /{id}/pricing

PATCH /{id}/discount
```

Search

```
GET /courses/search

GET /courses/trending

GET /courses/latest

GET /courses/free

GET /courses/paid
```

---

# Phase 7 — Modules

```
/courses/{courseId}/modules
```

```
POST

GET

GET /{moduleId}

PATCH /{moduleId}

DELETE /{moduleId}

PATCH /{moduleId}/reorder
```

---

# Phase 8 — Lessons

```
/lessons
```

CRUD

```
POST

GET

GET /{id}

PATCH /{id}

DELETE /{id}
```

Video

```
PATCH /{id}/video

DELETE /{id}/video
```

Attachments

```
POST /{id}/attachments

DELETE /{id}/attachments/{fileId}
```

Lesson

```
PATCH /{id}/visibility

PATCH /{id}/publish

PATCH /{id}/draft

PATCH /{id}/reorder
```

---

# Phase 9 — Enrollment

```
/enrollments
```

```
POST

DELETE

GET

GET /my
```

Student

```
GET /students/{id}

GET /students/{id}/courses

GET /students/{id}/progress
```

---

# Phase 10 — Progress

```
/progress
```

```
POST /watch

POST /complete

PATCH /resume

GET /course/{courseId}

GET /lesson/{lessonId}

GET /me
```

---

# Phase 11 — Wishlist

```
POST /wishlist

DELETE /wishlist/{courseId}

GET /wishlist
```

---

# Phase 12 — Notes

```
POST /notes

GET /notes

GET /notes/{id}

PATCH /notes/{id}

DELETE /notes/{id}
```

---

# Phase 13 — Quiz

```
POST /quizzes

GET /quizzes

PATCH /quizzes/{id}

DELETE /quizzes/{id}

POST /quizzes/{id}/submit

GET /quizzes/{id}/result
```

Question

```
POST /questions

PATCH /questions/{id}

DELETE /questions/{id}
```

---

# Phase 14 — Assignment

```
POST /assignments

PATCH /assignments/{id}

DELETE /assignments/{id}

POST /assignments/{id}/submit

PATCH /assignments/{id}/review

GET /assignments/submissions
```

---

# Phase 15 — Membership

```
POST /membership-plans

GET

PATCH

DELETE
```

Subscription

```
POST /subscriptions

DELETE /subscriptions/{id}

GET /subscriptions

PATCH /subscriptions/{id}
```

---

# Phase 16 — Certificates

```
GET /certificates

GET /certificates/{id}

POST /certificates/generate

PATCH /certificates/template

DELETE /certificates/{id}
```

---

# Phase 17 — Reviews

```
POST /reviews

GET /reviews

PATCH /reviews/{id}

DELETE /reviews/{id}
```

---

# Phase 18 — Comments & Doubts

```
POST /comments

PATCH /comments/{id}

DELETE /comments/{id}

GET /lessons/{id}/comments
```

Replies

```
POST /comments/{id}/reply
```

---

# Phase 19 — Notifications

```
GET /notifications

PATCH /notifications/read

PATCH /notifications/read-all

DELETE /notifications/{id}
```

---

# Phase 20 — Search

```
GET /search

GET /search/courses

GET /search/institutions

GET /search/users

GET /search/teachers

GET /search/categories
```

---

# Phase 21 — Analytics

Institution

```
GET /analytics/dashboard

GET /analytics/revenue

GET /analytics/watch-time

GET /analytics/engagement

GET /analytics/completion

GET /analytics/retention

GET /analytics/enrollments
```

Course

```
GET /analytics/course/{id}
```

Lesson

```
GET /analytics/lesson/{id}
```

Student

```
GET /analytics/student/{id}
```

---

# Phase 22 — Categories

```
POST /categories

GET /categories

PATCH /categories/{id}

DELETE /categories/{id}
```

---

# Phase 23 — Tags

```
POST /tags

GET /tags

PATCH /tags/{id}

DELETE /tags/{id}
```

---

# Phase 24 — Admin APIs

```
GET /admin/dashboard

GET /admin/users

PATCH /admin/users/{id}

DELETE /admin/users/{id}

GET /admin/institutions

DELETE /admin/institutions/{id}

GET /admin/courses

DELETE /admin/courses/{id}

GET /admin/storage

GET /admin/logs

GET /admin/analytics
```

---

# Phase 25 — AI (Future)

```
POST /ai/course-outline

POST /ai/course-description

POST /ai/video-summary

POST /ai/quiz

POST /ai/assignment

POST /ai/notes

POST /ai/transcript

POST /ai/doubt-answer

POST /ai/marketing-copy

POST /ai/seo

POST /ai/thumbnail-idea

POST /ai/course-title
```

---

# Phase 26 — Platform APIs

```
GET /home

GET /featured

GET /trending

GET /popular

GET /recommended

GET /latest

GET /stats
```

---

## Estimated Backend Size

| Phase                       |  Approx. Endpoints |
| --------------------------- | -----------------: |
| Authentication              |                 15 |
| Storage                     |                 20 |
| Institution                 |                 20 |
| Team & Roles                |                 25 |
| Courses                     |                 25 |
| Modules & Lessons           |                 30 |
| Enrollment & Progress       |                 20 |
| Notes, Quizzes, Assignments |                 40 |
| Membership & Certificates   |                 20 |
| Reviews & Comments          |                 20 |
| Search & Analytics          |                 25 |
| Admin                       |                 20 |
| AI                          |                 15 |
| **Total**                   | **~295 endpoints** |