Below is the **service-level folder and file responsibility map** for **LearnioX V1 FastAPI microservices**.

Use this as the structure your coding agent should follow.

---

# 1. Common Structure for Every Service

Every service should follow this pattern:

```text
services/{service_name}/
├── app/
│   ├── main.py
│   ├── api/
│   │   └── v1/
│   │       ├── router.py
│   │       └── endpoints/
│   ├── core/
│   │   ├── config.py
│   │   ├── logging.py
│   │   ├── exceptions.py
│   │   ├── security.py
│   │   └── constants.py
│   ├── db/
│   │   ├── base.py
│   │   ├── session.py
│   │   └── init_db.py
│   ├── models/
│   ├── schemas/
│   ├── repositories/
│   ├── services/
│   ├── clients/
│   ├── utils/
│   ├── dependencies/
│   │   ├── auth.py
│   │   ├── db.py
│   │   └── pagination.py
│   └── workers/
├── alembic/
├── tests/
├── .env.example
├── Dockerfile
└── pyproject.toml
```

---

# 2. Common Folder Responsibilities

| Folder              | Responsibility                                                  |
| ------------------- | --------------------------------------------------------------- |
| `api/v1/endpoints/` | FastAPI route handlers only. No business logic.                 |
| `models/`           | SQLAlchemy database tables.                                     |
| `schemas/`          | Pydantic request/response DTOs.                                 |
| `repositories/`     | Raw database operations.                                        |
| `services/`         | Business logic and orchestration.                               |
| `clients/`          | Calls to other microservices or third-party APIs.               |
| `utils/`            | Pure helper functions.                                          |
| `core/`             | Config, security, logging, constants, exception setup.          |
| `dependencies/`     | FastAPI dependencies like current user, DB session, pagination. |
| `workers/`          | Background task definitions.                                    |

Important rule:

```text
endpoint → service → repository → database

endpoint → service → client → external/internal service
```

Endpoints should not directly call repositories unless the endpoint is extremely simple.

---

# 3. API Gateway / BFF Service

```text
services/api_gateway/app/
```

## `api/v1/endpoints/`

| File              | Responsibility                                                        |
| ----------------- | --------------------------------------------------------------------- |
| `health.py`       | Gateway health check.                                                 |
| `public.py`       | Public home, public course page, public institution page aggregation. |
| `auth_proxy.py`   | Proxy auth routes to auth service when needed.                        |
| `learner_bff.py`  | Learner dashboard aggregation.                                        |
| `studio_bff.py`   | Creator/institution dashboard aggregation.                            |
| `admin_bff.py`    | Admin dashboard aggregation.                                          |
| `search_bff.py`   | Public search aggregation.                                            |
| `checkout_bff.py` | Course/membership checkout aggregation.                               |
| `media_bff.py`    | Playback/access-safe media routes.                                    |

## `models/`

| File                | Responsibility                  |
| ------------------- | ------------------------------- |
| `request_log.py`    | Optional gateway request logs.  |
| `rate_limit_log.py` | Optional rate limit/audit logs. |

## `schemas/`

| File          | Responsibility                                   |
| ------------- | ------------------------------------------------ |
| `public.py`   | Public page request/response models.             |
| `learner.py`  | Learner dashboard response models.               |
| `studio.py`   | Studio dashboard response models.                |
| `admin.py`    | Admin dashboard response models.                 |
| `checkout.py` | Checkout BFF request/response models.            |
| `proxy.py`    | Generic proxy response/error models.             |
| `common.py`   | Shared API envelope, pagination, error response. |

## `repositories/`

| File                        | Responsibility                      |
| --------------------------- | ----------------------------------- |
| `request_log_repository.py` | Save gateway request logs.          |
| `rate_limit_repository.py`  | Optional DB-backed rate limit logs. |

## `services/`

| File                      | Responsibility                                |
| ------------------------- | --------------------------------------------- |
| `public_bff_service.py`   | Compose public home/course/institution pages. |
| `learner_bff_service.py`  | Compose learner dashboard.                    |
| `studio_bff_service.py`   | Compose institution studio dashboard.         |
| `admin_bff_service.py`    | Compose platform admin dashboard.             |
| `checkout_bff_service.py` | Orchestrate checkout flow.                    |
| `proxy_service.py`        | Generic reverse proxy logic.                  |
| `auth_context_service.py` | Extract and validate user context.            |
| `rate_limit_service.py`   | Gateway-level request throttling.             |

## `clients/`

| File                     | Responsibility                   |
| ------------------------ | -------------------------------- |
| `base_client.py`         | Shared HTTPX client wrapper.     |
| `auth_client.py`         | Auth service calls.              |
| `user_client.py`         | User service calls.              |
| `institution_client.py`  | Institution service calls.       |
| `rbac_client.py`         | Permission check calls.          |
| `course_client.py`       | Course service calls.            |
| `lesson_client.py`       | Curriculum/lesson service calls. |
| `media_client.py`        | Video/playback service calls.    |
| `enrollment_client.py`   | Access/enrollment service calls. |
| `membership_client.py`   | Membership service calls.        |
| `payment_client.py`      | Payment service calls.           |
| `progress_client.py`     | Progress service calls.          |
| `search_client.py`       | Search service calls.            |
| `analytics_client.py`    | Analytics service calls.         |
| `notification_client.py` | Notification service calls.      |
| `ai_client.py`           | AI service calls.                |

## `utils/`

| File            | Responsibility                                    |
| --------------- | ------------------------------------------------- |
| `headers.py`    | Forward safe headers and inject internal headers. |
| `routing.py`    | Gateway route mapping helpers.                    |
| `response.py`   | Normalize upstream responses.                     |
| `errors.py`     | Convert upstream errors to public errors.         |
| `request_id.py` | Generate request/correlation IDs.                 |

---

# 4. Auth Service

```text
services/auth_service/app/
```

## `api/v1/endpoints/`

| File              | Responsibility                                        |
| ----------------- | ----------------------------------------------------- |
| `auth.py`         | Register, login, logout, refresh.                     |
| `oauth.py`        | Google OAuth start/callback.                          |
| `password.py`     | Forgot/reset password.                                |
| `verification.py` | Email/phone verification.                             |
| `sessions.py`     | List/revoke user sessions.                            |
| `tokens.py`       | Token introspection/revocation for internal services. |
| `health.py`       | Health check.                                         |

## `models/`

| File                    | Responsibility                                      |
| ----------------------- | --------------------------------------------------- |
| `user_identity.py`      | Auth user identity, email, password hash, provider. |
| `session.py`            | Refresh token sessions.                             |
| `verification_token.py` | Email/password/phone verification tokens.           |
| `oauth_account.py`      | OAuth provider-linked accounts.                     |
| `login_attempt.py`      | Login attempt/risk tracking.                        |

## `schemas/`

| File                       | Responsibility                          |
| -------------------------- | --------------------------------------- |
| `auth_requests.py`         | Register/login/logout/refresh requests. |
| `auth_responses.py`        | Token/user login responses.             |
| `password_requests.py`     | Forgot/reset password requests.         |
| `verification_requests.py` | Verification request models.            |
| `session_responses.py`     | User session response models.           |
| `token_requests.py`        | Token introspection/revoke requests.    |
| `token_responses.py`       | Token introspection responses.          |
| `common.py`                | Common API response/error models.       |

## `repositories/`

| File                               | Responsibility                       |
| ---------------------------------- | ------------------------------------ |
| `user_identity_repository.py`      | CRUD for auth identity.              |
| `session_repository.py`            | Create/revoke/find refresh sessions. |
| `verification_token_repository.py` | Store/use verification tokens.       |
| `oauth_account_repository.py`      | OAuth account lookup/linking.        |
| `login_attempt_repository.py`      | Track failed login attempts.         |

## `services/`

| File                      | Responsibility                             |
| ------------------------- | ------------------------------------------ |
| `auth_service.py`         | Register/login/logout business logic.      |
| `token_service.py`        | Create/verify JWT, rotate refresh tokens.  |
| `password_service.py`     | Hash/check passwords, password reset flow. |
| `verification_service.py` | Email/phone verification flow.             |
| `oauth_service.py`        | OAuth login orchestration.                 |
| `session_service.py`      | Session listing/revocation.                |
| `risk_service.py`         | Login throttling/risk checks.              |

## `clients/`

| File                     | Responsibility                         |
| ------------------------ | -------------------------------------- |
| `user_client.py`         | Create/fetch user profile.             |
| `notification_client.py` | Send verification/password emails.     |
| `audit_client.py`        | Log auth events.                       |
| `google_oauth_client.py` | Google OAuth user info/token exchange. |

## `utils/`

| File            | Responsibility                     |
| --------------- | ---------------------------------- |
| `password.py`   | Hashing utilities.                 |
| `jwt.py`        | JWT encode/decode helpers.         |
| `tokens.py`     | Random secure token generation.    |
| `cookies.py`    | Refresh-token cookie helpers.      |
| `validators.py` | Email/password validation helpers. |

---

# 5. User Profile Service

## `api/v1/endpoints/`

| File                       | Responsibility                  |
| -------------------------- | ------------------------------- |
| `profiles.py`              | Get/update profile.             |
| `preferences.py`           | User learning preferences.      |
| `interests.py`             | User interests/categories.      |
| `saved_courses.py`         | Save/unsave courses.            |
| `followed_institutions.py` | Follow/unfollow institutions.   |
| `public_profiles.py`       | Public user/instructor profile. |
| `health.py`                | Health check.                   |

## `models/`

| File                      | Responsibility                   |
| ------------------------- | -------------------------------- |
| `user_profile.py`         | User profile table.              |
| `user_preference.py`      | Optional normalized preferences. |
| `saved_course.py`         | Saved courses.                   |
| `followed_institution.py` | Followed institutions.           |
| `user_interest.py`        | Interest mapping.                |

## `schemas/`

| File                        | Responsibility                        |
| --------------------------- | ------------------------------------- |
| `profile_requests.py`       | Create/update profile requests.       |
| `profile_responses.py`      | Profile response DTOs.                |
| `preference_requests.py`    | Preference update requests.           |
| `interest_requests.py`      | Interest update requests.             |
| `saved_course_responses.py` | Saved course response models.         |
| `follow_responses.py`       | Followed institution response models. |
| `common.py`                 | Shared response/pagination.           |

## `repositories/`

| File                                 | Responsibility                    |
| ------------------------------------ | --------------------------------- |
| `profile_repository.py`              | Profile CRUD.                     |
| `preference_repository.py`           | Preferences CRUD.                 |
| `saved_course_repository.py`         | Save/unsave course DB operations. |
| `followed_institution_repository.py` | Follow/unfollow DB operations.    |
| `interest_repository.py`             | Interest mapping DB operations.   |

## `services/`

| File                        | Responsibility                |
| --------------------------- | ----------------------------- |
| `profile_service.py`        | Profile business logic.       |
| `preference_service.py`     | Preference update/read logic. |
| `saved_course_service.py`   | Saved-course logic.           |
| `follow_service.py`         | Institution follow logic.     |
| `public_profile_service.py` | Public profile formatting.    |

## `clients/`

| File                    | Responsibility                           |
| ----------------------- | ---------------------------------------- |
| `auth_client.py`        | Validate auth identity if needed.        |
| `course_client.py`      | Fetch course metadata for saved courses. |
| `institution_client.py` | Fetch followed institution metadata.     |
| `asset_client.py`       | Avatar upload/reference validation.      |

## `utils/`

| File                    | Responsibility                        |
| ----------------------- | ------------------------------------- |
| `username.py`           | Username generation/validation.       |
| `profile_completion.py` | Profile completion score.             |
| `normalizers.py`        | Normalize language/country/interests. |

---

# 6. Institution Service

## `api/v1/endpoints/`

| File              | Responsibility                         |
| ----------------- | -------------------------------------- |
| `institutions.py` | Institution CRUD.                      |
| `public.py`       | Public institution profile by slug/id. |
| `branding.py`     | Logo, banner, colors, theme.           |
| `settings.py`     | Institution settings.                  |
| `verification.py` | Submit/check verification.             |
| `stats.py`        | Basic institution stats.               |
| `health.py`       | Health check.                          |

## `models/`

| File                          | Responsibility                       |
| ----------------------------- | ------------------------------------ |
| `institution.py`              | Main institution table.              |
| `institution_branding.py`     | Optional normalized branding config. |
| `institution_settings.py`     | Optional normalized settings.        |
| `institution_verification.py` | Verification requests/status.        |
| `institution_category.py`     | Optional category mapping.           |

## `schemas/`

| File                       | Responsibility                       |
| -------------------------- | ------------------------------------ |
| `institution_requests.py`  | Create/update institution requests.  |
| `institution_responses.py` | Institution response models.         |
| `branding_requests.py`     | Branding update request.             |
| `settings_requests.py`     | Settings update request.             |
| `verification_requests.py` | Verification submit/review requests. |
| `public_responses.py`      | Public institution DTOs.             |
| `stats_responses.py`       | Institution stats response.          |

## `repositories/`

| File                         | Responsibility              |
| ---------------------------- | --------------------------- |
| `institution_repository.py`  | Institution CRUD.           |
| `branding_repository.py`     | Branding DB operations.     |
| `settings_repository.py`     | Settings DB operations.     |
| `verification_repository.py` | Verification DB operations. |
| `category_repository.py`     | Category lookup/mapping.    |

## `services/`

| File                            | Responsibility                      |
| ------------------------------- | ----------------------------------- |
| `institution_service.py`        | Main institution business logic.    |
| `slug_service.py`               | Slug creation/availability.         |
| `branding_service.py`           | Branding rules.                     |
| `settings_service.py`           | Settings rules.                     |
| `verification_service.py`       | Verification workflow.              |
| `public_institution_service.py` | Public institution page data.       |
| `stats_service.py`              | Basic counts and stats aggregation. |

## `clients/`

| File               | Responsibility                          |
| ------------------ | --------------------------------------- |
| `rbac_client.py`   | Check institution permissions.          |
| `asset_client.py`  | Validate logo/banner assets.            |
| `course_client.py` | Fetch institution course counts.        |
| `audit_client.py`  | Log institution changes.                |
| `search_client.py` | Index institution after publish/update. |

## `utils/`

| File            | Responsibility                |
| --------------- | ----------------------------- |
| `slug.py`       | Slugify and sanitize.         |
| `branding.py`   | Validate color/theme objects. |
| `validators.py` | Institution field validation. |

---

# 7. RBAC Service

## `api/v1/endpoints/`

| File             | Responsibility                |
| ---------------- | ----------------------------- |
| `members.py`     | Institution member CRUD.      |
| `roles.py`       | Role CRUD.                    |
| `permissions.py` | List/check permissions.       |
| `invites.py`     | Invite/resend/accept/revoke.  |
| `checks.py`      | Single/bulk permission check. |
| `health.py`      | Health check.                 |

## `models/`

| File                    | Responsibility                 |
| ----------------------- | ------------------------------ |
| `institution_member.py` | Member mapping.                |
| `role.py`               | Role table.                    |
| `permission.py`         | Permission table.              |
| `role_permission.py`    | Role-permission mapping.       |
| `institution_invite.py` | Team invitation table.         |
| `member_activity.py`    | Optional member activity logs. |

## `schemas/`

| File                      | Responsibility                        |
| ------------------------- | ------------------------------------- |
| `member_requests.py`      | Invite/update/remove member requests. |
| `member_responses.py`     | Member response DTOs.                 |
| `role_requests.py`        | Create/update role requests.          |
| `role_responses.py`       | Role response DTOs.                   |
| `permission_requests.py`  | Permission check request DTOs.        |
| `permission_responses.py` | Permission check/list responses.      |
| `invite_requests.py`      | Invite accept/resend requests.        |
| `invite_responses.py`     | Invite response DTOs.                 |

## `repositories/`

| File                            | Responsibility                 |
| ------------------------------- | ------------------------------ |
| `member_repository.py`          | Member DB operations.          |
| `role_repository.py`            | Role DB operations.            |
| `permission_repository.py`      | Permission DB operations.      |
| `role_permission_repository.py` | Role-permission DB operations. |
| `invite_repository.py`          | Invite DB operations.          |

## `services/`

| File                    | Responsibility                            |
| ----------------------- | ----------------------------------------- |
| `member_service.py`     | Add/remove/update members.                |
| `role_service.py`       | Role management logic.                    |
| `permission_service.py` | Permission calculation/check logic.       |
| `invite_service.py`     | Invite workflow.                          |
| `owner_service.py`      | Owner/co-owner transfer/protection rules. |
| `rbac_seed_service.py`  | Seed system roles and permissions.        |

## `clients/`

| File                     | Responsibility            |
| ------------------------ | ------------------------- |
| `user_client.py`         | Resolve user by email/id. |
| `institution_client.py`  | Validate institution.     |
| `notification_client.py` | Send invites.             |
| `audit_client.py`        | Log role/member changes.  |

## `utils/`

| File                  | Responsibility                              |
| --------------------- | ------------------------------------------- |
| `permission_codes.py` | Permission constants.                       |
| `role_templates.py`   | Default roles: owner, instructor, marketer. |
| `invite_tokens.py`    | Secure invite token hashing.                |

---

# 8. Course Service

## `api/v1/endpoints/`

| File                | Responsibility                   |
| ------------------- | -------------------------------- |
| `courses.py`        | Course CRUD.                     |
| `public_courses.py` | Public course listing/detail.    |
| `pricing.py`        | Course pricing/access mode.      |
| `publishing.py`     | Publish/unpublish/archive.       |
| `seo.py`            | Course SEO metadata.             |
| `instructors.py`    | Assign/remove instructors.       |
| `outcomes.py`       | Learning outcomes/prerequisites. |
| `health.py`         | Health check.                    |

## `models/`

| File                   | Responsibility                  |
| ---------------------- | ------------------------------- |
| `course.py`            | Main course table.              |
| `course_instructor.py` | Course instructor mapping.      |
| `course_pricing.py`    | Optional pricing normalization. |
| `course_seo.py`        | Optional SEO normalization.     |
| `course_category.py`   | Optional categories/tags.       |

## `schemas/`

| File                     | Responsibility                  |
| ------------------------ | ------------------------------- |
| `course_requests.py`     | Create/update course requests.  |
| `course_responses.py`    | Course response DTOs.           |
| `pricing_requests.py`    | Pricing update requests.        |
| `publishing_requests.py` | Publish/archive requests.       |
| `seo_requests.py`        | SEO update requests.            |
| `instructor_requests.py` | Add/remove instructor requests. |
| `public_responses.py`    | Public course card/detail DTOs. |

## `repositories/`

| File                              | Responsibility                      |
| --------------------------------- | ----------------------------------- |
| `course_repository.py`            | Course CRUD.                        |
| `course_instructor_repository.py` | Instructor mapping DB operations.   |
| `course_pricing_repository.py`    | Pricing DB operations if separated. |
| `course_category_repository.py`   | Category/tag queries.               |

## `services/`

| File                       | Responsibility                     |
| -------------------------- | ---------------------------------- |
| `course_service.py`        | Course business logic.             |
| `pricing_service.py`       | Pricing/access rules.              |
| `publishing_service.py`    | Publish readiness checks.          |
| `seo_service.py`           | SEO validation/building.           |
| `instructor_service.py`    | Instructor assignment.             |
| `public_course_service.py` | Public course response formatting. |

## `clients/`

| File                    | Responsibility                  |
| ----------------------- | ------------------------------- |
| `institution_client.py` | Validate institution.           |
| `rbac_client.py`        | Check course write permissions. |
| `lesson_client.py`      | Fetch curriculum summary.       |
| `media_client.py`       | Validate promo video/thumbnail. |
| `search_client.py`      | Index courses.                  |
| `audit_client.py`       | Log course operations.          |
| `analytics_client.py`   | Track course views.             |

## `utils/`

| File                   | Responsibility                     |
| ---------------------- | ---------------------------------- |
| `slug.py`              | Course slug helpers.               |
| `pricing.py`           | Pricing validation.                |
| `publish_checks.py`    | Validate course before publishing. |
| `course_formatters.py` | Public card/detail formatting.     |

---

# 9. Lesson / Curriculum Service

## `api/v1/endpoints/`

| File                    | Responsibility                     |
| ----------------------- | ---------------------------------- |
| `curriculum.py`         | Full curriculum get/reorder.       |
| `modules.py`            | Module CRUD/reorder.               |
| `lessons.py`            | Lesson CRUD.                       |
| `lesson_access.py`      | Lesson free/paid/membership flags. |
| `lesson_publishing.py`  | Publish/unpublish lessons.         |
| `lesson_attachments.py` | Attach video/assets to lessons.    |
| `health.py`             | Health check.                      |

## `models/`

| File                   | Responsibility                     |
| ---------------------- | ---------------------------------- |
| `course_module.py`     | Course modules.                    |
| `lesson.py`            | Lessons.                           |
| `lesson_attachment.py` | Lesson asset attachments.          |
| `lesson_dependency.py` | Optional prerequisites/drip rules. |

## `schemas/`

| File                      | Responsibility                         |
| ------------------------- | -------------------------------------- |
| `module_requests.py`      | Create/update/reorder module requests. |
| `module_responses.py`     | Module responses.                      |
| `lesson_requests.py`      | Create/update lesson requests.         |
| `lesson_responses.py`     | Lesson responses.                      |
| `curriculum_requests.py`  | Curriculum reorder/update requests.    |
| `curriculum_responses.py` | Full curriculum responses.             |
| `access_requests.py`      | Lesson access update requests.         |

## `repositories/`

| File                              | Responsibility                          |
| --------------------------------- | --------------------------------------- |
| `module_repository.py`            | Module DB operations.                   |
| `lesson_repository.py`            | Lesson DB operations.                   |
| `curriculum_repository.py`        | Multi-module/lesson curriculum queries. |
| `lesson_attachment_repository.py` | Lesson attachment DB operations.        |

## `services/`

| File                        | Responsibility                 |
| --------------------------- | ------------------------------ |
| `module_service.py`         | Module business logic.         |
| `lesson_service.py`         | Lesson business logic.         |
| `curriculum_service.py`     | Curriculum loading/reordering. |
| `lesson_access_service.py`  | Lesson access rules.           |
| `lesson_publish_service.py` | Lesson publish checks.         |
| `attachment_service.py`     | Attach video/pdf/assets.       |

## `clients/`

| File                   | Responsibility                |
| ---------------------- | ----------------------------- |
| `course_client.py`     | Validate course.              |
| `rbac_client.py`       | Check curriculum permissions. |
| `media_client.py`      | Validate video IDs.           |
| `asset_client.py`      | Validate asset IDs.           |
| `enrollment_client.py` | Optional access verification. |
| `audit_client.py`      | Log curriculum changes.       |

## `utils/`

| File             | Responsibility                           |
| ---------------- | ---------------------------------------- |
| `ordering.py`    | Reorder modules/lessons safely.          |
| `lesson_type.py` | Validate allowed content by lesson type. |
| `duration.py`    | Duration helpers.                        |

---

# 10. Media Service

## `api/v1/endpoints/`

| File            | Responsibility                         |
| --------------- | -------------------------------------- |
| `videos.py`     | Video metadata CRUD.                   |
| `uploads.py`    | Upload init/complete.                  |
| `playback.py`   | Generate playback URL/token.           |
| `processing.py` | Processing status/process trigger.     |
| `thumbnails.py` | Thumbnail update/generate.             |
| `subtitles.py`  | Subtitle CRUD.                         |
| `chapters.py`   | Chapter CRUD.                          |
| `webhooks.py`   | Cloudflare/Mux/Bunny webhook handlers. |
| `health.py`     | Health check.                          |

## `models/`

| File                        | Responsibility                 |
| --------------------------- | ------------------------------ |
| `video.py`                  | Video metadata table.          |
| `video_chapter.py`          | Video chapters.                |
| `video_subtitle.py`         | Video subtitles.               |
| `video_processing_event.py` | Provider processing events.    |
| `video_access_log.py`       | Optional playback access logs. |

## `schemas/`

| File                    | Responsibility                    |
| ----------------------- | --------------------------------- |
| `video_requests.py`     | Video metadata update requests.   |
| `video_responses.py`    | Video response DTOs.              |
| `upload_requests.py`    | Upload init/complete requests.    |
| `upload_responses.py`   | Upload URL responses.             |
| `playback_requests.py`  | Playback request DTOs.            |
| `playback_responses.py` | Playback URL/token responses.     |
| `subtitle_requests.py`  | Subtitle request DTOs.            |
| `chapter_requests.py`   | Chapter request DTOs.             |
| `webhook_requests.py`   | Provider webhook payload schemas. |

## `repositories/`

| File                             | Responsibility                    |
| -------------------------------- | --------------------------------- |
| `video_repository.py`            | Video CRUD.                       |
| `subtitle_repository.py`         | Subtitle DB operations.           |
| `chapter_repository.py`          | Chapter DB operations.            |
| `processing_event_repository.py` | Processing webhook event storage. |
| `access_log_repository.py`       | Playback logs.                    |

## `services/`

| File                    | Responsibility                       |
| ----------------------- | ------------------------------------ |
| `video_service.py`      | Video business logic.                |
| `upload_service.py`     | Upload init/complete orchestration.  |
| `playback_service.py`   | Generate signed playback.            |
| `processing_service.py` | Processing status updates.           |
| `subtitle_service.py`   | Subtitle management.                 |
| `chapter_service.py`    | Chapter management.                  |
| `webhook_service.py`    | Validate and handle provider events. |

## `clients/`

| File                          | Responsibility                 |
| ----------------------------- | ------------------------------ |
| `cloudflare_stream_client.py` | Cloudflare Stream API calls.   |
| `storage_client.py`           | Optional object storage calls. |
| `rbac_client.py`              | Upload permission checks.      |
| `ai_client.py`                | Trigger transcription/summary. |
| `analytics_client.py`         | Track video events.            |

## `utils/`

| File                   | Responsibility                 |
| ---------------------- | ------------------------------ |
| `signing.py`           | Signed playback token helpers. |
| `duration.py`          | Normalize durations.           |
| `webhook_signature.py` | Verify provider webhooks.      |
| `mime.py`              | Validate video MIME types.     |

---

# 11. Asset Service

## `api/v1/endpoints/`

| File                    | Responsibility                |
| ----------------------- | ----------------------------- |
| `assets.py`             | Asset metadata CRUD.          |
| `uploads.py`            | Signed upload init/complete.  |
| `downloads.py`          | Signed download/preview URLs. |
| `institution_assets.py` | Institution-level assets.     |
| `course_resources.py`   | Course resource files.        |
| `lesson_attachments.py` | Lesson asset attachment APIs. |
| `health.py`             | Health check.                 |

## `models/`

| File                  | Responsibility          |
| --------------------- | ----------------------- |
| `asset.py`            | File metadata.          |
| `asset_usage.py`      | Where file is used.     |
| `asset_access_log.py` | Optional download logs. |

## `schemas/`

| File                    | Responsibility                        |
| ----------------------- | ------------------------------------- |
| `asset_requests.py`     | Asset create/update requests.         |
| `asset_responses.py`    | Asset response models.                |
| `upload_requests.py`    | Upload init/complete requests.        |
| `upload_responses.py`   | Signed upload response.               |
| `download_responses.py` | Signed download/preview URL response. |

## `repositories/`

| File                        | Responsibility               |
| --------------------------- | ---------------------------- |
| `asset_repository.py`       | Asset CRUD.                  |
| `asset_usage_repository.py` | Usage mapping DB operations. |
| `access_log_repository.py`  | Download/access logging.     |

## `services/`

| File                    | Responsibility             |
| ----------------------- | -------------------------- |
| `asset_service.py`      | Asset business logic.      |
| `upload_service.py`     | Upload flow.               |
| `download_service.py`   | Signed download flow.      |
| `usage_service.py`      | Track asset usage.         |
| `validation_service.py` | File size/type validation. |

## `clients/`

| File              | Responsibility              |
| ----------------- | --------------------------- |
| `r2_client.py`    | Cloudflare R2 API calls.    |
| `rbac_client.py`  | Asset permission checks.    |
| `audit_client.py` | Log file-sensitive actions. |

## `utils/`

| File              | Responsibility                 |
| ----------------- | ------------------------------ |
| `file_names.py`   | Safe file naming.              |
| `mime.py`         | MIME/type validation.          |
| `storage_keys.py` | Generate object storage paths. |
| `signing.py`      | Signed URL helpers.            |

---

# 12. Enrollment & Access Service

## `api/v1/endpoints/`

| File                 | Responsibility                    |
| -------------------- | --------------------------------- |
| `enrollments.py`     | Enroll/cancel/reactivate.         |
| `my_enrollments.py`  | Learner enrollment list.          |
| `course_students.py` | Institution course student list.  |
| `access_checks.py`   | Course/lesson/bulk access checks. |
| `manual_access.py`   | Manual grant/revoke access.       |
| `health.py`          | Health check.                     |

## `models/`

| File              | Responsibility                |
| ----------------- | ----------------------------- |
| `enrollment.py`   | Enrollment table.             |
| `access_grant.py` | Manual/special access grants. |
| `access_log.py`   | Optional access check logs.   |

## `schemas/`

| File                        | Responsibility                       |
| --------------------------- | ------------------------------------ |
| `enrollment_requests.py`    | Enroll/cancel/reactivate requests.   |
| `enrollment_responses.py`   | Enrollment DTOs.                     |
| `access_requests.py`        | Course/lesson access check requests. |
| `access_responses.py`       | Access check responses.              |
| `manual_access_requests.py` | Manual grant/revoke requests.        |

## `repositories/`

| File                         | Responsibility              |
| ---------------------------- | --------------------------- |
| `enrollment_repository.py`   | Enrollment CRUD.            |
| `access_grant_repository.py` | Manual grant DB operations. |
| `access_log_repository.py`   | Access event logging.       |

## `services/`

| File                       | Responsibility                          |
| -------------------------- | --------------------------------------- |
| `enrollment_service.py`    | Enrollment logic.                       |
| `access_service.py`        | Course/lesson access decision logic.    |
| `manual_access_service.py` | Manual grant/revoke logic.              |
| `student_service.py`       | Student listing for institution/course. |

## `clients/`

| File                     | Responsibility                       |
| ------------------------ | ------------------------------------ |
| `course_client.py`       | Fetch course access type/pricing.    |
| `lesson_client.py`       | Fetch lesson access type.            |
| `membership_client.py`   | Check active membership.             |
| `payment_client.py`      | Verify payment status.               |
| `rbac_client.py`         | Institution staff permission checks. |
| `notification_client.py` | Enrollment notifications.            |
| `analytics_client.py`    | Track enrollment events.             |

## `utils/`

| File                | Responsibility                        |
| ------------------- | ------------------------------------- |
| `access_reasons.py` | Standard access denial/allow reasons. |
| `expiry.py`         | Access expiry helpers.                |
| `dedupe.py`         | Prevent duplicate enrollments.        |

---

# 13. Membership Service

## `api/v1/endpoints/`

| File                   | Responsibility                    |
| ---------------------- | --------------------------------- |
| `plans.py`             | Membership plan CRUD.             |
| `benefits.py`          | Plan benefits CRUD.               |
| `subscriptions.py`     | Subscribe/cancel/resume.          |
| `membership_status.py` | Check active membership.          |
| `subscribers.py`       | Institution subscriber listing.   |
| `webhooks.py`          | Subscription status webhook sync. |
| `health.py`            | Health check.                     |

## `models/`

| File                    | Responsibility                     |
| ----------------------- | ---------------------------------- |
| `membership_plan.py`    | Plan table.                        |
| `membership_benefit.py` | Optional normalized plan benefits. |
| `subscription.py`       | User subscription table.           |
| `subscription_event.py` | Subscription lifecycle events.     |

## `schemas/`

| File                        | Responsibility                         |
| --------------------------- | -------------------------------------- |
| `plan_requests.py`          | Plan create/update requests.           |
| `plan_responses.py`         | Plan responses.                        |
| `benefit_requests.py`       | Benefit create/update requests.        |
| `subscription_requests.py`  | Subscribe/cancel/resume requests.      |
| `subscription_responses.py` | Subscription responses.                |
| `status_responses.py`       | Membership status response.            |
| `webhook_requests.py`       | Provider webhook/status sync requests. |

## `repositories/`

| File                               | Responsibility              |
| ---------------------------------- | --------------------------- |
| `plan_repository.py`               | Plan DB operations.         |
| `benefit_repository.py`            | Benefit DB operations.      |
| `subscription_repository.py`       | Subscription DB operations. |
| `subscription_event_repository.py` | Subscription event storage. |

## `services/`

| File                           | Responsibility                      |
| ------------------------------ | ----------------------------------- |
| `plan_service.py`              | Plan business logic.                |
| `benefit_service.py`           | Benefit logic.                      |
| `subscription_service.py`      | Subscription create/cancel/resume.  |
| `membership_status_service.py` | Active membership check.            |
| `subscriber_service.py`        | Subscriber listing.                 |
| `webhook_service.py`           | Apply provider subscription events. |

## `clients/`

| File                     | Responsibility                                |
| ------------------------ | --------------------------------------------- |
| `payment_client.py`      | Checkout/payment status.                      |
| `institution_client.py`  | Validate institution.                         |
| `enrollment_client.py`   | Grant course access if plan includes courses. |
| `notification_client.py` | Membership notifications.                     |
| `analytics_client.py`    | Track subscription events.                    |
| `audit_client.py`        | Log membership plan changes.                  |

## `utils/`

| File                  | Responsibility                  |
| --------------------- | ------------------------------- |
| `billing_interval.py` | Billing interval validation.    |
| `benefits.py`         | Benefit normalization.          |
| `periods.py`          | Calculate subscription periods. |

---

# 14. Payment Service

## `api/v1/endpoints/`

| File          | Responsibility                     |
| ------------- | ---------------------------------- |
| `checkout.py` | Create course/membership checkout. |
| `payments.py` | Payment fetch/list/verify.         |
| `refunds.py`  | Refund creation/status.            |
| `coupons.py`  | Coupon CRUD/validate.              |
| `payouts.py`  | Institution payout request/list.   |
| `revenue.py`  | Institution revenue summary.       |
| `webhooks.py` | Razorpay/Stripe webhooks.          |
| `health.py`   | Health check.                      |

## `models/`

| File                   | Responsibility            |
| ---------------------- | ------------------------- |
| `payment.py`           | Payment transaction.      |
| `refund.py`            | Refund table.             |
| `coupon.py`            | Coupon table.             |
| `coupon_redemption.py` | Coupon usage table.       |
| `payout.py`            | Institution payout table. |
| `payment_event.py`     | Provider event logs.      |
| `invoice.py`           | Invoice records.          |

## `schemas/`

| File                    | Responsibility                       |
| ----------------------- | ------------------------------------ |
| `checkout_requests.py`  | Checkout request DTOs.               |
| `checkout_responses.py` | Checkout provider payload responses. |
| `payment_requests.py`   | Verify/list requests.                |
| `payment_responses.py`  | Payment response DTOs.               |
| `refund_requests.py`    | Refund requests.                     |
| `refund_responses.py`   | Refund responses.                    |
| `coupon_requests.py`    | Coupon CRUD/validate requests.       |
| `coupon_responses.py`   | Coupon response DTOs.                |
| `payout_requests.py`    | Payout requests.                     |
| `payout_responses.py`   | Payout responses.                    |
| `webhook_requests.py`   | Webhook payload schemas.             |

## `repositories/`

| File                              | Responsibility              |
| --------------------------------- | --------------------------- |
| `payment_repository.py`           | Payment DB operations.      |
| `refund_repository.py`            | Refund DB operations.       |
| `coupon_repository.py`            | Coupon DB operations.       |
| `coupon_redemption_repository.py` | Coupon usage DB operations. |
| `payout_repository.py`            | Payout DB operations.       |
| `payment_event_repository.py`     | Webhook event storage.      |
| `invoice_repository.py`           | Invoice DB operations.      |

## `services/`

| File                  | Responsibility                     |
| --------------------- | ---------------------------------- |
| `checkout_service.py` | Create payment checkout/order.     |
| `payment_service.py`  | Payment verification/status logic. |
| `refund_service.py`   | Refund workflow.                   |
| `coupon_service.py`   | Coupon validation and redemption.  |
| `payout_service.py`   | Institution payout logic.          |
| `revenue_service.py`  | Revenue aggregation.               |
| `webhook_service.py`  | Verify/apply payment webhooks.     |
| `invoice_service.py`  | Invoice generation.                |

## `clients/`

| File                     | Responsibility                       |
| ------------------------ | ------------------------------------ |
| `razorpay_client.py`     | Razorpay API calls.                  |
| `stripe_client.py`       | Stripe API calls.                    |
| `course_client.py`       | Fetch course price/context.          |
| `membership_client.py`   | Activate subscription after payment. |
| `enrollment_client.py`   | Activate enrollment after payment.   |
| `notification_client.py` | Payment notifications.               |
| `audit_client.py`        | Audit payment actions.               |

## `utils/`

| File             | Responsibility                          |
| ---------------- | --------------------------------------- |
| `money.py`       | Currency/amount helpers.                |
| `signatures.py`  | Razorpay/Stripe signature verification. |
| `coupon.py`      | Coupon code generation.                 |
| `tax.py`         | Tax/invoice helpers.                    |
| `idempotency.py` | Prevent duplicate webhook processing.   |

---

# 15. Progress Service

## `api/v1/endpoints/`

| File                      | Responsibility                          |
| ------------------------- | --------------------------------------- |
| `lesson_progress.py`      | Watch progress/complete/uncomplete.     |
| `course_progress.py`      | Course progress summary.                |
| `continue_learning.py`    | Continue learning list.                 |
| `streaks.py`              | Learning streaks.                       |
| `institution_progress.py` | Institution learner progress dashboard. |
| `health.py`               | Health check.                           |

## `models/`

| File                 | Responsibility               |
| -------------------- | ---------------------------- |
| `lesson_progress.py` | Lesson watch/completion.     |
| `course_progress.py` | Course-level progress.       |
| `learning_streak.py` | Daily streak tracking.       |
| `progress_event.py`  | Optional progress event log. |

## `schemas/`

| File                             | Responsibility               |
| -------------------------------- | ---------------------------- |
| `lesson_progress_requests.py`    | Watch/complete requests.     |
| `lesson_progress_responses.py`   | Lesson progress responses.   |
| `course_progress_requests.py`    | Recalculate course progress. |
| `course_progress_responses.py`   | Course progress responses.   |
| `continue_learning_responses.py` | Continue learning DTOs.      |
| `streak_responses.py`            | Streak response DTOs.        |

## `repositories/`

| File                            | Responsibility                 |
| ------------------------------- | ------------------------------ |
| `lesson_progress_repository.py` | Lesson progress DB operations. |
| `course_progress_repository.py` | Course progress DB operations. |
| `streak_repository.py`          | Streak DB operations.          |
| `progress_event_repository.py`  | Progress event DB operations.  |

## `services/`

| File                              | Responsibility                             |
| --------------------------------- | ------------------------------------------ |
| `lesson_progress_service.py`      | Watch/complete lesson logic.               |
| `course_progress_service.py`      | Recalculate course completion.             |
| `continue_learning_service.py`    | Build continue learning data.              |
| `streak_service.py`               | Streak calculation.                        |
| `institution_progress_service.py` | Institution analytics-like progress views. |

## `clients/`

| File                    | Responsibility                     |
| ----------------------- | ---------------------------------- |
| `lesson_client.py`      | Fetch lesson/course structure.     |
| `course_client.py`      | Fetch course metadata.             |
| `enrollment_client.py`  | Verify access/enrollment.          |
| `certificate_client.py` | Trigger certificate on completion. |
| `analytics_client.py`   | Track progress events.             |

## `utils/`

| File                  | Responsibility                  |
| --------------------- | ------------------------------- |
| `percentage.py`       | Completion percentage helpers.  |
| `streaks.py`          | Streak date helpers.            |
| `watch_thresholds.py` | Decide when lesson is complete. |

---

# 16. Search & Discovery Service

## `api/v1/endpoints/`

| File              | Responsibility                    |
| ----------------- | --------------------------------- |
| `search.py`       | Unified search.                   |
| `courses.py`      | Course search.                    |
| `institutions.py` | Institution search.               |
| `instructors.py`  | Instructor search.                |
| `suggestions.py`  | Autocomplete suggestions.         |
| `discovery.py`    | Home/trending/category discovery. |
| `indexing.py`     | Index/reindex internal APIs.      |
| `health.py`       | Health check.                     |

## `models/`

| File                   | Responsibility                      |
| ---------------------- | ----------------------------------- |
| `search_document.py`   | DB mirror of searchable documents.  |
| `search_query_log.py`  | Search analytics query log.         |
| `discovery_section.py` | Optional manual discovery sections. |
| `featured_item.py`     | Featured courses/institutions.      |

## `schemas/`

| File                      | Responsibility                     |
| ------------------------- | ---------------------------------- |
| `search_requests.py`      | Search/filter/pagination requests. |
| `search_responses.py`     | Search result responses.           |
| `suggestion_responses.py` | Suggestion responses.              |
| `discovery_responses.py`  | Home/category/trending responses.  |
| `indexing_requests.py`    | Index/reindex requests.            |

## `repositories/`

| File                            | Responsibility                   |
| ------------------------------- | -------------------------------- |
| `search_document_repository.py` | Search document DB operations.   |
| `query_log_repository.py`       | Search query logging.            |
| `featured_repository.py`        | Featured item DB operations.     |
| `discovery_repository.py`       | Discovery section DB operations. |

## `services/`

| File                    | Responsibility                             |
| ----------------------- | ------------------------------------------ |
| `search_service.py`     | Search orchestration.                      |
| `indexing_service.py`   | Index course/institution into Meilisearch. |
| `suggestion_service.py` | Autocomplete logic.                        |
| `discovery_service.py`  | Home/discovery sections.                   |
| `ranking_service.py`    | Search ranking/scoring.                    |
| `trending_service.py`   | Trending calculation.                      |

## `clients/`

| File                    | Responsibility                        |
| ----------------------- | ------------------------------------- |
| `meilisearch_client.py` | Meilisearch API wrapper.              |
| `course_client.py`      | Fetch course source data.             |
| `institution_client.py` | Fetch institution source data.        |
| `user_client.py`        | Fetch instructor/profile source data. |
| `analytics_client.py`   | Track search/discovery events.        |

## `utils/`

| File            | Responsibility                   |
| --------------- | -------------------------------- |
| `normalizer.py` | Normalize search text.           |
| `filters.py`    | Convert filters to search query. |
| `ranking.py`    | Ranking helper calculations.     |

---

# 17. Landing Page Service

## `api/v1/endpoints/`

| File               | Responsibility                           |
| ------------------ | ---------------------------------------- |
| `landing_pages.py` | Landing page get/update.                 |
| `sections.py`      | Section CRUD/reorder.                    |
| `theme.py`         | Theme update.                            |
| `seo.py`           | SEO update.                              |
| `publishing.py`    | Publish/unpublish.                       |
| `public.py`        | Public landing page by institution slug. |
| `health.py`        | Health check.                            |

## `models/`

| File                 | Responsibility            |
| -------------------- | ------------------------- |
| `landing_page.py`    | Main landing page config. |
| `landing_section.py` | Page sections.            |
| `landing_theme.py`   | Optional theme table.     |
| `landing_version.py` | Optional version/history. |

## `schemas/`

| File                        | Responsibility                 |
| --------------------------- | ------------------------------ |
| `landing_page_requests.py`  | Landing page update requests.  |
| `landing_page_responses.py` | Landing page responses.        |
| `section_requests.py`       | Section create/update/reorder. |
| `section_responses.py`      | Section responses.             |
| `theme_requests.py`         | Theme update requests.         |
| `seo_requests.py`           | SEO update requests.           |
| `public_responses.py`       | Public landing page DTOs.      |

## `repositories/`

| File                         | Responsibility                     |
| ---------------------------- | ---------------------------------- |
| `landing_page_repository.py` | Landing page DB operations.        |
| `section_repository.py`      | Section DB operations.             |
| `theme_repository.py`        | Theme DB operations if normalized. |
| `version_repository.py`      | Page version DB operations.        |

## `services/`

| File                      | Responsibility               |
| ------------------------- | ---------------------------- |
| `landing_page_service.py` | Landing page business logic. |
| `section_service.py`      | Section CRUD/reorder logic.  |
| `theme_service.py`        | Theme validation.            |
| `seo_service.py`          | SEO validation.              |
| `publishing_service.py`   | Publish/unpublish workflow.  |
| `public_page_service.py`  | Public page formatting.      |

## `clients/`

| File                    | Responsibility          |
| ----------------------- | ----------------------- |
| `institution_client.py` | Validate institution.   |
| `course_client.py`      | Fetch featured courses. |
| `asset_client.py`       | Validate images/assets. |
| `rbac_client.py`        | Permission checks.      |
| `search_client.py`      | Reindex public page.    |

## `utils/`

| File                 | Responsibility         |
| -------------------- | ---------------------- |
| `section_types.py`   | Allowed section types. |
| `theme_validator.py` | Validate colors/theme. |
| `seo.py`             | SEO metadata helpers.  |

---

# 18. Doubt / Q&A Service

## `api/v1/endpoints/`

| File                   | Responsibility                      |
| ---------------------- | ----------------------------------- |
| `doubts.py`            | Doubt CRUD.                         |
| `lesson_doubts.py`     | Doubts for a lesson.                |
| `answers.py`           | Doubt answer CRUD.                  |
| `resolution.py`        | Resolve/reopen doubts.              |
| `assignment.py`        | Assign doubt to instructor/team.    |
| `votes.py`             | Upvote/helpful.                     |
| `ai_drafts.py`         | Request AI draft answer.            |
| `institution_queue.py` | Institution pending/resolved queue. |
| `health.py`            | Health check.                       |

## `models/`

| File                    | Responsibility       |
| ----------------------- | -------------------- |
| `doubt.py`              | Doubt table.         |
| `doubt_answer.py`       | Answers table.       |
| `doubt_vote.py`         | Upvotes/helpfulness. |
| `doubt_assignment.py`   | Assignment to staff. |
| `doubt_status_event.py` | Status history.      |

## `schemas/`

| File                   | Responsibility                       |
| ---------------------- | ------------------------------------ |
| `doubt_requests.py`    | Create/update/assign doubt requests. |
| `doubt_responses.py`   | Doubt response DTOs.                 |
| `answer_requests.py`   | Answer create/update requests.       |
| `answer_responses.py`  | Answer response DTOs.                |
| `queue_responses.py`   | Institution queue DTOs.              |
| `ai_draft_requests.py` | AI draft request DTOs.               |

## `repositories/`

| File                         | Responsibility                |
| ---------------------------- | ----------------------------- |
| `doubt_repository.py`        | Doubt DB operations.          |
| `answer_repository.py`       | Answer DB operations.         |
| `vote_repository.py`         | Vote DB operations.           |
| `assignment_repository.py`   | Assignment DB operations.     |
| `status_event_repository.py` | Status history DB operations. |

## `services/`

| File                    | Responsibility                 |
| ----------------------- | ------------------------------ |
| `doubt_service.py`      | Doubt business logic.          |
| `answer_service.py`     | Answer logic.                  |
| `resolution_service.py` | Resolve/reopen workflow.       |
| `assignment_service.py` | Staff assignment workflow.     |
| `vote_service.py`       | Vote/helpful logic.            |
| `queue_service.py`      | Institution queue filters.     |
| `ai_draft_service.py`   | AI answer draft orchestration. |

## `clients/`

| File                     | Responsibility                       |
| ------------------------ | ------------------------------------ |
| `course_client.py`       | Validate course.                     |
| `lesson_client.py`       | Validate lesson.                     |
| `enrollment_client.py`   | Verify learner has access.           |
| `rbac_client.py`         | Instructor/doubt-solver permissions. |
| `ai_client.py`           | Generate answer draft.               |
| `notification_client.py` | Notify student/instructor.           |
| `analytics_client.py`    | Track doubt events.                  |

## `utils/`

| File               | Responsibility                |
| ------------------ | ----------------------------- |
| `status.py`        | Doubt status transitions.     |
| `text_cleaning.py` | Clean doubt text.             |
| `priority.py`      | Priority calculation helpers. |

---

# 19. Community Service

## `api/v1/endpoints/`

| File               | Responsibility              |
| ------------------ | --------------------------- |
| `spaces.py`        | Community space CRUD.       |
| `posts.py`         | Post CRUD.                  |
| `comments.py`      | Comment CRUD.               |
| `likes.py`         | Like/unlike posts.          |
| `announcements.py` | Institution announcements.  |
| `moderation.py`    | Hide/delete/report content. |
| `health.py`        | Health check.               |

## `models/`

| File                   | Responsibility    |
| ---------------------- | ----------------- |
| `community_space.py`   | Community spaces. |
| `community_post.py`    | Posts.            |
| `community_comment.py` | Comments.         |
| `community_like.py`    | Likes.            |
| `announcement.py`      | Announcements.    |
| `community_report.py`  | Reported content. |

## `schemas/`

| File                        | Responsibility                |
| --------------------------- | ----------------------------- |
| `space_requests.py`         | Space create/update requests. |
| `space_responses.py`        | Space responses.              |
| `post_requests.py`          | Post create/update requests.  |
| `post_responses.py`         | Post responses.               |
| `comment_requests.py`       | Comment requests.             |
| `comment_responses.py`      | Comment responses.            |
| `announcement_requests.py`  | Announcement requests.        |
| `announcement_responses.py` | Announcement responses.       |
| `moderation_requests.py`    | Report/hide/delete requests.  |

## `repositories/`

| File                         | Responsibility              |
| ---------------------------- | --------------------------- |
| `space_repository.py`        | Space DB operations.        |
| `post_repository.py`         | Post DB operations.         |
| `comment_repository.py`      | Comment DB operations.      |
| `like_repository.py`         | Like DB operations.         |
| `announcement_repository.py` | Announcement DB operations. |
| `report_repository.py`       | Report DB operations.       |

## `services/`

| File                      | Responsibility              |
| ------------------------- | --------------------------- |
| `space_service.py`        | Community space logic.      |
| `post_service.py`         | Post logic.                 |
| `comment_service.py`      | Comment logic.              |
| `like_service.py`         | Like/unlike logic.          |
| `announcement_service.py` | Announcement logic.         |
| `moderation_service.py`   | Moderation/report workflow. |

## `clients/`

| File                     | Responsibility                    |
| ------------------------ | --------------------------------- |
| `institution_client.py`  | Validate institution.             |
| `course_client.py`       | Validate course-linked spaces.    |
| `enrollment_client.py`   | Verify learner access if private. |
| `rbac_client.py`         | Staff moderation permissions.     |
| `notification_client.py` | Notify announcements/replies.     |
| `analytics_client.py`    | Track community activity.         |

## `utils/`

| File            | Responsibility                         |
| --------------- | -------------------------------------- |
| `visibility.py` | Public/private/course-only visibility. |
| `moderation.py` | Basic banned word/report helpers.      |
| `threading.py`  | Comment nesting helpers.               |

---

# 20. Quiz / Assessment Service

## `api/v1/endpoints/`

| File               | Responsibility              |
| ------------------ | --------------------------- |
| `quizzes.py`       | Quiz CRUD.                  |
| `questions.py`     | Question CRUD.              |
| `publishing.py`    | Publish/unpublish quiz.     |
| `attempts.py`      | Start/submit quiz attempts. |
| `results.py`       | Results and score details.  |
| `analytics.py`     | Quiz analytics.             |
| `question_bank.py` | Reusable question bank.     |
| `health.py`        | Health check.               |

## `models/`

| File                    | Responsibility               |
| ----------------------- | ---------------------------- |
| `quiz.py`               | Quiz table.                  |
| `question.py`           | Questions.                   |
| `question_option.py`    | Optional normalized options. |
| `quiz_attempt.py`       | Attempt metadata.            |
| `quiz_answer.py`        | Submitted answers.           |
| `question_bank_item.py` | Reusable question bank.      |

## `schemas/`

| File                     | Responsibility                   |
| ------------------------ | -------------------------------- |
| `quiz_requests.py`       | Quiz create/update requests.     |
| `quiz_responses.py`      | Quiz response DTOs.              |
| `question_requests.py`   | Question create/update requests. |
| `question_responses.py`  | Question response DTOs.          |
| `attempt_requests.py`    | Start/submit attempt requests.   |
| `attempt_responses.py`   | Attempt responses.               |
| `result_responses.py`    | Result/score responses.          |
| `analytics_responses.py` | Quiz analytics DTOs.             |

## `repositories/`

| File                          | Responsibility                  |
| ----------------------------- | ------------------------------- |
| `quiz_repository.py`          | Quiz DB operations.             |
| `question_repository.py`      | Question DB operations.         |
| `attempt_repository.py`       | Attempt DB operations.          |
| `answer_repository.py`        | Submitted answer DB operations. |
| `question_bank_repository.py` | Question bank DB operations.    |

## `services/`

| File                       | Responsibility              |
| -------------------------- | --------------------------- |
| `quiz_service.py`          | Quiz business logic.        |
| `question_service.py`      | Question management.        |
| `attempt_service.py`       | Attempt start/submit.       |
| `scoring_service.py`       | Auto-score answers.         |
| `result_service.py`        | Result formatting.          |
| `analytics_service.py`     | Quiz performance analytics. |
| `question_bank_service.py` | Question bank logic.        |

## `clients/`

| File                   | Responsibility                |
| ---------------------- | ----------------------------- |
| `course_client.py`     | Validate course.              |
| `lesson_client.py`     | Validate quiz lesson.         |
| `enrollment_client.py` | Check learner access.         |
| `rbac_client.py`       | Instructor permission checks. |
| `ai_client.py`         | AI-generate quiz/questions.   |
| `analytics_client.py`  | Track quiz events.            |

## `utils/`

| File                | Responsibility                   |
| ------------------- | -------------------------------- |
| `scoring.py`        | Scoring helpers.                 |
| `question_types.py` | MCQ/descriptive/type validation. |
| `timing.py`         | Time-limit helpers.              |
| `shuffle.py`        | Option/question shuffling.       |

---

# 21. Assignment Service

## `api/v1/endpoints/`

| File               | Responsibility                    |
| ------------------ | --------------------------------- |
| `assignments.py`   | Assignment CRUD.                  |
| `publishing.py`    | Publish/unpublish assignment.     |
| `submissions.py`   | Submit/list submissions.          |
| `reviews.py`       | Instructor review/marks/feedback. |
| `review_queue.py`  | Institution review queue.         |
| `resubmissions.py` | Request/handle resubmission.      |
| `health.py`        | Health check.                     |

## `models/`

| File                       | Responsibility              |
| -------------------------- | --------------------------- |
| `assignment.py`            | Assignment table.           |
| `assignment_submission.py` | Submission table.           |
| `assignment_review.py`     | Review/feedback history.    |
| `assignment_attachment.py` | Assignment files/resources. |

## `schemas/`

| File                      | Responsibility                     |
| ------------------------- | ---------------------------------- |
| `assignment_requests.py`  | Assignment create/update requests. |
| `assignment_responses.py` | Assignment responses.              |
| `submission_requests.py`  | Submit assignment requests.        |
| `submission_responses.py` | Submission responses.              |
| `review_requests.py`      | Review/marks requests.             |
| `review_responses.py`     | Review response DTOs.              |
| `queue_responses.py`      | Review queue responses.            |

## `repositories/`

| File                       | Responsibility            |
| -------------------------- | ------------------------- |
| `assignment_repository.py` | Assignment DB operations. |
| `submission_repository.py` | Submission DB operations. |
| `review_repository.py`     | Review DB operations.     |
| `attachment_repository.py` | Attachment DB operations. |

## `services/`

| File                      | Responsibility             |
| ------------------------- | -------------------------- |
| `assignment_service.py`   | Assignment business logic. |
| `submission_service.py`   | Submission workflow.       |
| `review_service.py`       | Review/feedback workflow.  |
| `resubmission_service.py` | Resubmission handling.     |
| `queue_service.py`        | Instructor review queue.   |
| `attachment_service.py`   | Assignment file handling.  |

## `clients/`

| File                     | Responsibility                 |
| ------------------------ | ------------------------------ |
| `course_client.py`       | Validate course.               |
| `lesson_client.py`       | Validate assignment lesson.    |
| `enrollment_client.py`   | Check learner access.          |
| `asset_client.py`        | Validate uploaded files.       |
| `rbac_client.py`         | Instructor review permissions. |
| `notification_client.py` | Notify submission/review.      |
| `analytics_client.py`    | Track assignment events.       |

## `utils/`

| File           | Responsibility                 |
| -------------- | ------------------------------ |
| `deadlines.py` | Due date helpers.              |
| `grading.py`   | Marks/grade validation.        |
| `status.py`    | Submission status transitions. |

---

# 22. Certificate Service

## `api/v1/endpoints/`

| File              | Responsibility                       |
| ----------------- | ------------------------------------ |
| `templates.py`    | Certificate template CRUD.           |
| `settings.py`     | Course certificate settings.         |
| `certificates.py` | Generate/list/download certificates. |
| `verification.py` | Public certificate verification.     |
| `health.py`       | Health check.                        |

## `models/`

| File                            | Responsibility                 |
| ------------------------------- | ------------------------------ |
| `certificate_template.py`       | Template config.               |
| `course_certificate_setting.py` | Eligibility rules per course.  |
| `certificate.py`                | Issued certificate records.    |
| `certificate_event.py`          | Certificate generation events. |

## `schemas/`

| File                        | Responsibility                   |
| --------------------------- | -------------------------------- |
| `template_requests.py`      | Template create/update requests. |
| `template_responses.py`     | Template responses.              |
| `setting_requests.py`       | Certificate setting requests.    |
| `setting_responses.py`      | Certificate setting responses.   |
| `certificate_requests.py`   | Generate certificate request.    |
| `certificate_responses.py`  | Certificate DTOs.                |
| `verification_responses.py` | Public verification DTOs.        |

## `repositories/`

| File                        | Responsibility                   |
| --------------------------- | -------------------------------- |
| `template_repository.py`    | Template DB operations.          |
| `setting_repository.py`     | Settings DB operations.          |
| `certificate_repository.py` | Certificate DB operations.       |
| `event_repository.py`       | Certificate event DB operations. |

## `services/`

| File                      | Responsibility                       |
| ------------------------- | ------------------------------------ |
| `template_service.py`     | Template logic.                      |
| `setting_service.py`      | Eligibility setting logic.           |
| `certificate_service.py`  | Generate/list/download certificates. |
| `eligibility_service.py`  | Check completion/quiz criteria.      |
| `verification_service.py` | Public verification logic.           |
| `render_service.py`       | Render certificate PDF/image.        |

## `clients/`

| File                     | Responsibility               |
| ------------------------ | ---------------------------- |
| `progress_client.py`     | Check course completion.     |
| `course_client.py`       | Fetch course details.        |
| `institution_client.py`  | Fetch institution branding.  |
| `user_client.py`         | Fetch learner profile.       |
| `asset_client.py`        | Store generated certificate. |
| `notification_client.py` | Notify certificate issued.   |

## `utils/`

| File                   | Responsibility                          |
| ---------------------- | --------------------------------------- |
| `verification_code.py` | Generate certificate verification code. |
| `rendering.py`         | PDF/image rendering helpers.            |
| `template_vars.py`     | Template variable replacement.          |

---

# 23. Review Service

## `api/v1/endpoints/`

| File                     | Responsibility                     |
| ------------------------ | ---------------------------------- |
| `course_reviews.py`      | Course review CRUD.                |
| `institution_reviews.py` | Institution review CRUD.           |
| `ratings.py`             | Rating summaries.                  |
| `helpful_votes.py`       | Helpful vote APIs.                 |
| `reports.py`             | Report review.                     |
| `moderation.py`          | Admin approve/reject/hide reviews. |
| `health.py`              | Health check.                      |

## `models/`

| File                     | Responsibility                    |
| ------------------------ | --------------------------------- |
| `review.py`              | Review table.                     |
| `review_helpful_vote.py` | Helpful votes.                    |
| `review_report.py`       | Review reports.                   |
| `rating_summary.py`      | Optional cached rating summaries. |

## `schemas/`

| File                     | Responsibility                 |
| ------------------------ | ------------------------------ |
| `review_requests.py`     | Create/update review requests. |
| `review_responses.py`    | Review responses.              |
| `rating_responses.py`    | Rating summary responses.      |
| `report_requests.py`     | Report review requests.        |
| `moderation_requests.py` | Approve/reject/hide requests.  |

## `repositories/`

| File                           | Responsibility                |
| ------------------------------ | ----------------------------- |
| `review_repository.py`         | Review DB operations.         |
| `helpful_vote_repository.py`   | Vote DB operations.           |
| `report_repository.py`         | Report DB operations.         |
| `rating_summary_repository.py` | Cached summary DB operations. |

## `services/`

| File                      | Responsibility                |
| ------------------------- | ----------------------------- |
| `review_service.py`       | Review creation/update rules. |
| `rating_service.py`       | Calculate rating summaries.   |
| `helpful_vote_service.py` | Helpful vote logic.           |
| `report_service.py`       | Review reporting logic.       |
| `moderation_service.py`   | Review moderation workflow.   |

## `clients/`

| File                    | Responsibility                            |
| ----------------------- | ----------------------------------------- |
| `course_client.py`      | Validate course.                          |
| `institution_client.py` | Validate institution.                     |
| `enrollment_client.py`  | Ensure only enrolled users review course. |
| `user_client.py`        | Fetch public reviewer profile.            |
| `analytics_client.py`   | Track review events.                      |

## `utils/`

| File            | Responsibility                 |
| --------------- | ------------------------------ |
| `rating.py`     | Rating validation/aggregation. |
| `moderation.py` | Basic moderation helpers.      |

---

# 24. Notification Service

## `api/v1/endpoints/`

| File               | Responsibility                      |
| ------------------ | ----------------------------------- |
| `notifications.py` | User notification list/read/delete. |
| `send.py`          | Send single/bulk notification.      |
| `templates.py`     | Notification template CRUD.         |
| `preferences.py`   | Notification preferences.           |
| `webhooks.py`      | Provider webhooks.                  |
| `health.py`        | Health check.                       |

## `models/`

| File                         | Responsibility                    |
| ---------------------------- | --------------------------------- |
| `notification.py`            | Notification table.               |
| `notification_template.py`   | Templates.                        |
| `notification_preference.py` | User channel preferences.         |
| `delivery_log.py`            | Email/SMS/WhatsApp delivery logs. |

## `schemas/`

| File                        | Responsibility                   |
| --------------------------- | -------------------------------- |
| `notification_requests.py`  | Send/read/delete requests.       |
| `notification_responses.py` | Notification response DTOs.      |
| `template_requests.py`      | Template create/update requests. |
| `template_responses.py`     | Template responses.              |
| `preference_requests.py`    | Preference update requests.      |
| `preference_responses.py`   | Preference responses.            |
| `webhook_requests.py`       | Provider webhook DTOs.           |

## `repositories/`

| File                         | Responsibility              |
| ---------------------------- | --------------------------- |
| `notification_repository.py` | Notification DB operations. |
| `template_repository.py`     | Template DB operations.     |
| `preference_repository.py`   | Preference DB operations.   |
| `delivery_log_repository.py` | Delivery log DB operations. |

## `services/`

| File                      | Responsibility                      |
| ------------------------- | ----------------------------------- |
| `notification_service.py` | Create/list/read notifications.     |
| `delivery_service.py`     | Send through channel providers.     |
| `template_service.py`     | Template rendering.                 |
| `preference_service.py`   | Respect user preferences.           |
| `bulk_service.py`         | Bulk notification dispatch.         |
| `webhook_service.py`      | Provider delivery webhook handling. |

## `clients/`

| File                 | Responsibility              |
| -------------------- | --------------------------- |
| `resend_client.py`   | Email provider.             |
| `ses_client.py`      | Alternative email provider. |
| `msg91_client.py`    | SMS provider.               |
| `whatsapp_client.py` | WhatsApp provider.          |
| `user_client.py`     | Fetch user contact details. |

## `utils/`

| File                   | Responsibility                   |
| ---------------------- | -------------------------------- |
| `template_renderer.py` | Replace template variables.      |
| `channels.py`          | Channel validation.              |
| `dedupe.py`            | Prevent duplicate notifications. |

---

# 25. Analytics Service

## `api/v1/endpoints/`

| File                       | Responsibility                     |
| -------------------------- | ---------------------------------- |
| `events.py`                | Track single/batch events.         |
| `institution_analytics.py` | Institution dashboard metrics.     |
| `course_analytics.py`      | Course metrics/dropoff/completion. |
| `platform_analytics.py`    | Platform owner metrics.            |
| `funnel.py`                | Conversion funnel metrics.         |
| `exports.py`               | Export analytics CSV/JSON.         |
| `health.py`                | Health check.                      |

## `models/`

| File                    | Responsibility                |
| ----------------------- | ----------------------------- |
| `analytics_event.py`    | Raw event table.              |
| `daily_metric.py`       | Aggregated daily metrics.     |
| `course_metric.py`      | Course-level aggregates.      |
| `institution_metric.py` | Institution-level aggregates. |
| `funnel_event.py`       | Funnel-specific events.       |

## `schemas/`

| File                       | Responsibility              |
| -------------------------- | --------------------------- |
| `event_requests.py`        | Track event requests.       |
| `event_responses.py`       | Event responses.            |
| `institution_responses.py` | Institution analytics DTOs. |
| `course_responses.py`      | Course analytics DTOs.      |
| `platform_responses.py`    | Platform analytics DTOs.    |
| `funnel_responses.py`      | Funnel response DTOs.       |
| `date_range_requests.py`   | Date range/filter requests. |

## `repositories/`

| File                               | Responsibility              |
| ---------------------------------- | --------------------------- |
| `event_repository.py`              | Raw event DB operations.    |
| `daily_metric_repository.py`       | Daily metric DB operations. |
| `course_metric_repository.py`      | Course metric queries.      |
| `institution_metric_repository.py` | Institution metric queries. |
| `funnel_repository.py`             | Funnel query operations.    |

## `services/`

| File                               | Responsibility           |
| ---------------------------------- | ------------------------ |
| `event_service.py`                 | Track events.            |
| `aggregation_service.py`           | Aggregate metrics.       |
| `institution_analytics_service.py` | Institution metrics.     |
| `course_analytics_service.py`      | Course metrics.          |
| `platform_analytics_service.py`    | Platform metrics.        |
| `funnel_service.py`                | Conversion funnel logic. |
| `export_service.py`                | Export analytics.        |

## `clients/`

| File                    | Responsibility              |
| ----------------------- | --------------------------- |
| `course_client.py`      | Fetch course metadata.      |
| `institution_client.py` | Fetch institution metadata. |
| `payment_client.py`     | Revenue/payment metrics.    |
| `progress_client.py`    | Completion/watch metrics.   |

## `utils/`

| File             | Responsibility              |
| ---------------- | --------------------------- |
| `date_ranges.py` | Date range helpers.         |
| `metrics.py`     | Metric calculation helpers. |
| `funnels.py`     | Funnel step helpers.        |

---

# 26. AI Copilot Service

## `api/v1/endpoints/`

| File                       | Responsibility                         |
| -------------------------- | -------------------------------------- |
| `course_generation.py`     | Course outline/lesson plan generation. |
| `video_ai.py`              | Video summary/chapters/notes/quiz.     |
| `quiz_generation.py`       | AI quiz generation.                    |
| `assignment_generation.py` | AI assignment generation.              |
| `doubt_ai.py`              | Doubt answer drafts.                   |
| `marketing_ai.py`          | Landing/email/social/ad copy.          |
| `analytics_ai.py`          | AI insights from analytics.            |
| `jobs.py`                  | AI job status/list.                    |
| `usage.py`                 | Institution AI usage.                  |
| `health.py`                | Health check.                          |

## `models/`

| File                 | Responsibility               |
| -------------------- | ---------------------------- |
| `ai_job.py`          | AI job table.                |
| `ai_usage.py`        | Token/credit usage.          |
| `prompt_template.py` | Reusable prompt templates.   |
| `ai_artifact.py`     | Generated outputs/artifacts. |
| `rag_document.py`    | RAG document references.     |

## `schemas/`

| File                             | Responsibility                      |
| -------------------------------- | ----------------------------------- |
| `course_generation_requests.py`  | Course/lesson generation requests.  |
| `course_generation_responses.py` | Course/lesson generation responses. |
| `video_ai_requests.py`           | Video AI requests.                  |
| `video_ai_responses.py`          | Video AI responses.                 |
| `quiz_generation_requests.py`    | AI quiz requests.                   |
| `doubt_ai_requests.py`           | Doubt draft requests.               |
| `marketing_ai_requests.py`       | Marketing copy requests.            |
| `analytics_ai_requests.py`       | AI analytics request DTOs.          |
| `job_responses.py`               | AI job response DTOs.               |
| `usage_responses.py`             | AI usage DTOs.                      |

## `repositories/`

| File                            | Responsibility                       |
| ------------------------------- | ------------------------------------ |
| `ai_job_repository.py`          | AI job DB operations.                |
| `ai_usage_repository.py`        | Usage tracking DB operations.        |
| `prompt_template_repository.py` | Prompt template DB operations.       |
| `ai_artifact_repository.py`     | Generated artifact storage metadata. |
| `rag_document_repository.py`    | RAG document DB operations.          |

## `services/`

| File                               | Responsibility                         |
| ---------------------------------- | -------------------------------------- |
| `course_generation_service.py`     | Generate course outlines/lesson plans. |
| `video_ai_service.py`              | Summary/chapters/notes from videos.    |
| `quiz_generation_service.py`       | Generate quiz/questions.               |
| `assignment_generation_service.py` | Generate assignments.                  |
| `doubt_ai_service.py`              | Generate doubt answer drafts.          |
| `marketing_ai_service.py`          | Generate marketing copy.               |
| `analytics_ai_service.py`          | Generate insights/actions.             |
| `job_service.py`                   | Job lifecycle.                         |
| `usage_service.py`                 | Track token/credit usage.              |
| `rag_service.py`                   | RAG retrieval/generation.              |

## `clients/`

| File                   | Responsibility                   |
| ---------------------- | -------------------------------- |
| `llm_client.py`        | Generic LLM abstraction.         |
| `openrouter_client.py` | OpenRouter API calls.            |
| `openai_client.py`     | OpenAI fallback.                 |
| `embedding_client.py`  | Embedding provider calls.        |
| `media_client.py`      | Fetch video/transcript metadata. |
| `course_client.py`     | Fetch course context.            |
| `doubt_client.py`      | Fetch doubt context.             |
| `analytics_client.py`  | Fetch analytics context.         |
| `asset_client.py`      | Fetch PDFs/notes.                |

## `utils/`

| File               | Responsibility            |
| ------------------ | ------------------------- |
| `prompts.py`       | Prompt building helpers.  |
| `json_repair.py`   | Repair/parse LLM JSON.    |
| `token_counter.py` | Token estimation.         |
| `chunking.py`      | Text chunking for RAG.    |
| `guardrails.py`    | Validate AI output shape. |

---

# 27. Marketing Service

## `api/v1/endpoints/`

| File                    | Responsibility                  |
| ----------------------- | ------------------------------- |
| `campaigns.py`          | Campaign CRUD.                  |
| `campaign_actions.py`   | Launch/pause/resume.            |
| `lead_forms.py`         | Lead form CRUD.                 |
| `leads.py`              | Lead list/export.               |
| `referrals.py`          | Referral program/link tracking. |
| `utm.py`                | UTM tracking.                   |
| `campaign_analytics.py` | Campaign analytics.             |
| `health.py`             | Health check.                   |

## `models/`

| File                  | Responsibility            |
| --------------------- | ------------------------- |
| `campaign.py`         | Campaign table.           |
| `lead_form.py`        | Lead form config.         |
| `lead.py`             | Captured leads.           |
| `referral_program.py` | Referral program.         |
| `referral_event.py`   | Referral tracking events. |
| `utm_event.py`        | UTM tracking events.      |

## `schemas/`

| File                     | Responsibility                          |
| ------------------------ | --------------------------------------- |
| `campaign_requests.py`   | Campaign create/update/action requests. |
| `campaign_responses.py`  | Campaign responses.                     |
| `lead_form_requests.py`  | Lead form requests.                     |
| `lead_form_responses.py` | Lead form responses.                    |
| `lead_requests.py`       | Lead submit/update requests.            |
| `lead_responses.py`      | Lead responses.                         |
| `referral_requests.py`   | Referral program requests.              |
| `referral_responses.py`  | Referral responses.                     |
| `analytics_responses.py` | Campaign analytics DTOs.                |

## `repositories/`

| File                      | Responsibility           |
| ------------------------- | ------------------------ |
| `campaign_repository.py`  | Campaign DB operations.  |
| `lead_form_repository.py` | Lead form DB operations. |
| `lead_repository.py`      | Lead DB operations.      |
| `referral_repository.py`  | Referral DB operations.  |
| `utm_repository.py`       | UTM DB operations.       |

## `services/`

| File                            | Responsibility                |
| ------------------------------- | ----------------------------- |
| `campaign_service.py`           | Campaign business logic.      |
| `campaign_action_service.py`    | Launch/pause/resume workflow. |
| `lead_form_service.py`          | Lead form logic.              |
| `lead_service.py`               | Lead capture/list/export.     |
| `referral_service.py`           | Referral tracking/rewards.    |
| `utm_service.py`                | UTM tracking.                 |
| `campaign_analytics_service.py` | Campaign performance metrics. |

## `clients/`

| File                     | Responsibility           |
| ------------------------ | ------------------------ |
| `institution_client.py`  | Validate institution.    |
| `course_client.py`       | Link campaign to course. |
| `notification_client.py` | Send campaign messages.  |
| `ai_client.py`           | Generate campaign copy.  |
| `analytics_client.py`    | Track campaign events.   |
| `payment_client.py`      | Coupon/revenue data.     |

## `utils/`

| File                 | Responsibility               |
| -------------------- | ---------------------------- |
| `utm.py`             | UTM builder/parser.          |
| `referral_codes.py`  | Referral code generation.    |
| `lead_validation.py` | Validate captured lead data. |

---

# 28. Admin Service

## `api/v1/endpoints/`

| File              | Responsibility                       |
| ----------------- | ------------------------------------ |
| `dashboard.py`    | Admin dashboard.                     |
| `users.py`        | Manage platform users.               |
| `institutions.py` | Approve/reject/suspend institutions. |
| `courses.py`      | Feature/unfeature/moderate courses.  |
| `reports.py`      | Report queue.                        |
| `settings.py`     | Platform settings.                   |
| `moderation.py`   | Content moderation actions.          |
| `health.py`       | Health check.                        |

## `models/`

| File                  | Responsibility             |
| --------------------- | -------------------------- |
| `admin_action.py`     | Admin action log.          |
| `platform_setting.py` | Platform setting records.  |
| `content_report.py`   | Reported content.          |
| `moderation_case.py`  | Moderation case lifecycle. |

## `schemas/`

| File                        | Responsibility                    |
| --------------------------- | --------------------------------- |
| `dashboard_responses.py`    | Admin dashboard DTOs.             |
| `user_requests.py`          | Suspend/unsuspend user requests.  |
| `user_responses.py`         | Admin user DTOs.                  |
| `institution_requests.py`   | Approve/reject/suspend requests.  |
| `institution_responses.py`  | Admin institution DTOs.           |
| `course_requests.py`        | Feature/moderate course requests. |
| `report_requests.py`        | Resolve report requests.          |
| `setting_requests.py`       | Platform setting update requests. |
| `admin_action_responses.py` | Admin action DTOs.                |

## `repositories/`

| File                             | Responsibility                   |
| -------------------------------- | -------------------------------- |
| `admin_action_repository.py`     | Admin action DB operations.      |
| `platform_setting_repository.py` | Platform settings DB operations. |
| `content_report_repository.py`   | Report DB operations.            |
| `moderation_case_repository.py`  | Moderation case DB operations.   |

## `services/`

| File                           | Responsibility                   |
| ------------------------------ | -------------------------------- |
| `dashboard_service.py`         | Admin dashboard aggregation.     |
| `user_admin_service.py`        | User admin operations.           |
| `institution_admin_service.py` | Institution approval/suspension. |
| `course_admin_service.py`      | Course featuring/moderation.     |
| `report_service.py`            | Report queue workflow.           |
| `platform_setting_service.py`  | Platform settings logic.         |
| `moderation_service.py`        | Moderation case workflow.        |

## `clients/`

| File                    | Responsibility             |
| ----------------------- | -------------------------- |
| `auth_client.py`        | User auth/admin actions.   |
| `user_client.py`        | User profile admin data.   |
| `institution_client.py` | Institution admin actions. |
| `course_client.py`      | Course admin actions.      |
| `review_client.py`      | Review moderation.         |
| `analytics_client.py`   | Platform metrics.          |
| `audit_client.py`       | Audit admin actions.       |

## `utils/`

| File                   | Responsibility                    |
| ---------------------- | --------------------------------- |
| `admin_permissions.py` | Platform admin permission checks. |
| `moderation.py`        | Moderation helpers.               |
| `settings.py`          | Platform setting validation.      |

---

# 29. Audit Service

## `api/v1/endpoints/`

| File                   | Responsibility            |
| ---------------------- | ------------------------- |
| `events.py`            | Create/list audit events. |
| `institution_audit.py` | Institution audit trail.  |
| `user_audit.py`        | User audit trail.         |
| `admin_audit.py`       | Admin audit trail.        |
| `exports.py`           | Export audit logs.        |
| `health.py`            | Health check.             |

## `models/`

| File              | Responsibility      |
| ----------------- | ------------------- |
| `audit_event.py`  | Audit event table.  |
| `audit_export.py` | Export job records. |

## `schemas/`

| File                  | Responsibility                      |
| --------------------- | ----------------------------------- |
| `audit_requests.py`   | Create/search audit event requests. |
| `audit_responses.py`  | Audit event responses.              |
| `export_requests.py`  | Audit export requests.              |
| `export_responses.py` | Audit export responses.             |

## `repositories/`

| File                         | Responsibility             |
| ---------------------------- | -------------------------- |
| `audit_event_repository.py`  | Audit event DB operations. |
| `audit_export_repository.py` | Export job DB operations.  |

## `services/`

| File                      | Responsibility              |
| ------------------------- | --------------------------- |
| `audit_service.py`        | Create/search audit events. |
| `audit_query_service.py`  | Filter/query audit trails.  |
| `audit_export_service.py` | Export logs.                |
| `retention_service.py`    | Retention cleanup policy.   |

## `clients/`

| File                     | Responsibility              |
| ------------------------ | --------------------------- |
| `asset_client.py`        | Store exported audit files. |
| `notification_client.py` | Notify export completion.   |

## `utils/`

| File             | Responsibility                   |
| ---------------- | -------------------------------- |
| `redaction.py`   | Remove sensitive data from logs. |
| `event_names.py` | Standard audit action names.     |
| `filters.py`     | Audit query filter helpers.      |

---

# 30. Recommended Exact Service Build Order

Use this order to avoid dependency confusion:

```text
01. api_gateway
02. auth_service
03. user_service
04. institution_service
05. rbac_service
06. asset_service
07. media_service
08. course_service
09. lesson_service
10. enrollment_service
11. membership_service
12. payment_service
13. progress_service
14. search_service
15. notification_service
16. analytics_service
17. landing_page_service
18. doubt_service
19. quiz_service
20. assignment_service
21. certificate_service
22. community_service
23. review_service
24. marketing_service
25. ai_service
26. admin_service
27. audit_service
```

---

# 31. Golden Rule for Your Coding Agent

Give your agent this instruction:

```text
Create each service with the same architecture:
api/v1/endpoints only handles HTTP.
services contains business logic.
repositories contains database queries.
clients contains all inter-service and third-party API calls.
models contains SQLAlchemy models.
schemas contains Pydantic request/response models.
utils contains pure helpers only.

Do not mix responsibilities.
Do not call databases from endpoints.
Do not call other services directly from repositories.
Do not put business logic inside schemas or models.
Every write action must pass auth context and RBAC checks where applicable.
Every important action must emit audit and analytics events.
```

This gives you a clean, scalable **LearnioX V1 microservice codebase map**.
