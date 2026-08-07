PERMISSIONS_CATALOG = [
    # Institution
    {"code": "institution.view", "name": "View Institution", "category": "Institution", "description": "View institution details"},
    {"code": "institution.update", "name": "Update Institution", "category": "Institution", "description": "Update institution branding & details"},
    {"code": "institution.delete", "name": "Delete Institution", "category": "Institution", "description": "Soft delete institution"},
    {"code": "institution.settings", "name": "Manage Settings", "category": "Institution", "description": "Update institution settings"},

    # Members
    {"code": "member.invite", "name": "Invite Members", "category": "Members", "description": "Invite team members"},
    {"code": "member.update", "name": "Update Members", "category": "Members", "description": "Update member status & roles"},
    {"code": "member.remove", "name": "Remove Members", "category": "Members", "description": "Remove team members"},
    {"code": "member.view", "name": "View Members", "category": "Members", "description": "List team members"},

    # Courses
    {"code": "course.create", "name": "Create Course", "category": "Courses", "description": "Create new course"},
    {"code": "course.update", "name": "Update Course", "category": "Courses", "description": "Edit course details"},
    {"code": "course.publish", "name": "Publish Course", "category": "Courses", "description": "Publish course"},
    {"code": "course.delete", "name": "Delete Course", "category": "Courses", "description": "Delete course"},
    {"code": "course.archive", "name": "Archive Course", "category": "Courses", "description": "Archive course"},

    # Modules
    {"code": "module.create", "name": "Create Module", "category": "Modules", "description": "Create course module"},
    {"code": "module.update", "name": "Update Module", "category": "Modules", "description": "Update course module"},
    {"code": "module.delete", "name": "Delete Module", "category": "Modules", "description": "Delete course module"},

    # Lessons
    {"code": "lesson.create", "name": "Create Lesson", "category": "Lessons", "description": "Create lesson"},
    {"code": "lesson.update", "name": "Update Lesson", "category": "Lessons", "description": "Update lesson"},
    {"code": "lesson.delete", "name": "Delete Lesson", "category": "Lessons", "description": "Delete lesson"},
    {"code": "lesson.publish", "name": "Publish Lesson", "category": "Lessons", "description": "Publish lesson"},

    # Storage
    {"code": "storage.upload", "name": "Upload File", "category": "Storage", "description": "Upload files to storage"},
    {"code": "storage.delete", "name": "Delete File", "category": "Storage", "description": "Delete files from storage"},
    {"code": "storage.rename", "name": "Rename File", "category": "Storage", "description": "Rename storage files"},

    # Students
    {"code": "student.view", "name": "View Students", "category": "Students", "description": "View student list"},
    {"code": "student.progress", "name": "Track Progress", "category": "Students", "description": "View student progress"},
    {"code": "student.enrollment", "name": "Manage Enrollment", "category": "Students", "description": "Enroll or unenroll students"},

    # Analytics
    {"code": "analytics.view", "name": "View Analytics", "category": "Analytics", "description": "View platform analytics"},
    {"code": "analytics.export", "name": "Export Analytics", "category": "Analytics", "description": "Export analytics data"},

    # Payments
    {"code": "payment.view", "name": "View Payments", "category": "Payments", "description": "View transaction history"},
    {"code": "payment.manage", "name": "Manage Payments", "category": "Payments", "description": "Manage payouts & pricing"},

    # Certificates
    {"code": "certificate.generate", "name": "Generate Certificate", "category": "Certificates", "description": "Issue certificates"},
    {"code": "certificate.download", "name": "Download Certificate", "category": "Certificates", "description": "Download certificate PDFs"},

    # Reviews
    {"code": "review.delete", "name": "Delete Review", "category": "Reviews", "description": "Moderate reviews"},
    {"code": "review.reply", "name": "Reply Review", "category": "Reviews", "description": "Reply to reviews"},

    # AI
    {"code": "ai.generate", "name": "AI Generation", "category": "AI", "description": "Generate content with AI"},
    {"code": "ai.summary", "name": "AI Summaries", "category": "AI", "description": "Generate AI summaries"},
    {"code": "ai.quiz", "name": "AI Quizzes", "category": "AI", "description": "Generate AI quizzes"},
]

DEFAULT_SYSTEM_ROLES = {
    "Owner": {
        "description": "Full access to all institution features and settings",
        "permission_codes": [p["code"] for p in PERMISSIONS_CATALOG],
    },
    "Admin": {
        "description": "Administrative access to institution resources",
        "permission_codes": [
            p["code"]
            for p in PERMISSIONS_CATALOG
            if p["code"] != "institution.delete"
        ],
    },
    "Instructor": {
        "description": "Create and manage courses, lessons, and modules",
        "permission_codes": [
            "course.create",
            "course.update",
            "course.publish",
            "module.create",
            "module.update",
            "lesson.create",
            "lesson.update",
            "lesson.publish",
            "storage.upload",
            "student.view",
            "student.progress",
            "review.reply",
            "ai.generate",
            "ai.summary",
            "ai.quiz",
        ],
    },
    "Content Manager": {
        "description": "Manage course materials and storage assets",
        "permission_codes": [
            "course.create",
            "course.update",
            "module.create",
            "module.update",
            "lesson.create",
            "lesson.update",
            "storage.upload",
            "storage.rename",
            "ai.generate",
        ],
    },
    "Support": {
        "description": "Student support and inquiry assistance",
        "permission_codes": [
            "student.view",
            "student.progress",
            "review.reply",
            "certificate.download",
        ],
    },
    "Finance": {
        "description": "Financial and transaction management",
        "permission_codes": ["payment.view", "payment.manage", "analytics.view"],
    },
    "Marketing": {
        "description": "Marketing and analytics view access",
        "permission_codes": [
            "analytics.view",
            "analytics.export",
            "course.update",
            "review.reply",
        ],
    },
}
