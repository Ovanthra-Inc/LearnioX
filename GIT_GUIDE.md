# 🚀 LearnioX Team Git Collaboration Guide & Cheat Sheet

A beginner-friendly, step-by-step guide for team collaboration on Git & GitHub.

---

## 📌 Table of Contents
1. [The 3 Golden Rules](#-the-3-golden-rules)
2. [Mental Model: How Git Actually Works](#-mental-model-how-git-actually-works)
3. [Daily Collaboration Workflow (Step-by-Step)](#-daily-collaboration-workflow)
4. [Branching Guide](#-branching-guide)
5. [`git fetch` vs `git pull` vs `upstream` Explained](#-git-fetch-vs-git-pull-vs-upstream-explained)
6. [Saving Work Temporarily (`git stash`)](#-saving-work-temporarily-git-stash)
7. [How to Resolve Merge Conflicts](#-how-to-resolve-merge-conflicts)
8. [Beginner Traps & How to Fix Them](#-beginner-traps--how-to-fix-them)
9. [Quick Command Cheat Sheet](#-quick-command-cheat-sheet)

---

## 🛡️ The 3 Golden Rules

1. **NEVER commit on `main` directly.** Always create a feature branch (`feature/auth-ui`, `fix/login-bug`).
2. **NEVER commit `.env` or API Keys.** Keep secrets in `.env` (which is in `.gitignore`) and only commit generic placeholders in `.env.example`.
3. **Always pull the latest `main` before creating a new branch.** This prevents merge conflicts before they even start.

---

## 🧠 Mental Model: How Git Actually Works

```
Working Directory          Staging Area (Index)          Local Repo (.git)          Remote Repo (GitHub)
  (Your Files)             (Ready to package)             (Committed)                 (Team Sync)
       │                           │                           │                           │
       ├─────── git add . ────────►│                           │                           │
       │                           ├──── git commit -m "..." ─►│                           │
       │                           │                           ├─────── git push ─────────►│
       │◄──────────────────────── git pull ────────────────────────────────────────────────┤
       │                                                       │◄────── git fetch ─────────┤
```

---

## 🔄 Daily Collaboration Workflow

Follow this exact routine every time you work with your teammate:

### Step 1: Start of Day — Sync your local machine
Before writing any code, switch to `main` and get the latest updates from your teammate:
```bash
git checkout main
git pull origin main
```

### Step 2: Create a Feature Branch
Create a new branch off the updated `main`:
```bash
# Good naming conventions: feature/<name>, fix/<name>, docs/<name>
git checkout -b feature/course-player
```

### Step 3: Write Code & Check Status
Make your code changes, then inspect what files were touched:
```bash
git status
```

### Step 4: Stage and Commit Changes
```bash
# Stage specific files (recommended)
git add apps/client-service/src/components/Player.tsx

# Or stage all modified files
git add .

# Commit with a clear, concise message
git commit -m "feat(client): add video player component"
```

### Step 5: Push Your Branch to GitHub
The first time you push a new branch, set the upstream (`-u`):
```bash
git push -u origin feature/course-player
```
*(On subsequent pushes to the same branch, you only need to type `git push`).*

### Step 6: Open a Pull Request (PR) on GitHub
1. Go to [GitHub Repository](https://github.com/Ovanthra-Inc/LearnioX).
2. Click **"Compare & pull request"**.
3. Add a short description of what you did.
4. Request your teammate to review and merge into `main`.

---

## 🌿 Branching Guide

### 1. Create a new branch from `main`
```bash
git checkout main
git pull origin main
git checkout -b feature/new-feature
```

### 2. Copy/Create a new branch from a Teammate's Branch
If your teammate is working on `feature/auth` and you need to build on top of their work:
```bash
# 1. Fetch all latest branches from GitHub
git fetch origin

# 2. Switch to your teammate's branch
git checkout feature/auth
git pull origin feature/auth

# 3. Create your new branch branching off their work
git checkout -b feature/auth-dashboard
```

### 3. Switch between existing branches
```bash
git checkout feature/course-player
```

### 4. Delete a branch after it's merged
```bash
# Delete local branch
git branch -d feature/course-player

# Delete remote branch on GitHub
git push origin --delete feature/course-player
```

---

## ❓ `git fetch` vs `git pull` vs `upstream` Explained

| Command | What It Does | When To Use It |
| :--- | :--- | :--- |
| `git fetch origin` | **Downloads** all new commits, branches, and tags from GitHub into your local `.git` hidden database **WITHOUT modifying** your files. | Use when you want to see what teammates pushed without touching your current code. |
| `git pull origin main` | Performs `git fetch` + immediately **merges** the incoming changes into your current active branch. | Use when you want to update your current branch with latest remote code. |
| `git push -u origin <branch>` | Pushes your local branch to GitHub and **links** (sets upstream tracking) between your local branch and `origin/<branch>`. | Use **only once** on the very first push of a new branch. |

---

## 📦 Saving Work Temporarily (`git stash`)

### Scenario:
You are in the middle of coding on `feature/checkout`, your code is messy and not ready to commit, but your teammate urgently asks you to review or switch to `main` to fix a bug.

```bash
# 1. Save all uncommitted changes into a temporary stash
git stash

# 2. Now your working directory is clean! Switch branches safely
git checkout main
git pull origin main

# 3. When you're ready to resume your previous work:
git checkout feature/checkout

# 4. Restore your saved uncommitted changes
git stash pop
```

---

## ⚔️ How to Resolve Merge Conflicts

A merge conflict happens when **both you and your teammate edited the exact same line in the same file** and Git doesn't know which version is correct.

### Step 1: Update your branch with latest `main`
```bash
git checkout feature/my-feature
git fetch origin
git merge origin/main
```

### Step 2: Look for conflict markers
Git will mark conflicting files. Open the file in VS Code / Antigravity IDE:

```text
<<<<<<< HEAD (Your local changes)
const API_URL = "http://localhost:8080/api/v1";
=======
const API_URL = "http://localhost/api/v1";
>>>>>>> origin/main (Teammate's changes from main)
```

### Step 3: Pick the correct code
Delete the `<<<<<<<`, `=======`, and `>>>>>>>` lines and keep the correct code:
```typescript
const API_URL = "http://localhost/api/v1";
```

### Step 4: Stage, Commit, and Push
```bash
git add .
git commit -m "fix: resolve merge conflict with main"
git push
```

---

## ⚠️ Beginner Traps & How to Fix Them

### Trap 1: "I accidentally made changes on `main` instead of a branch!"
**Fix:** Move your uncommitted work to a new branch without losing anything:
```bash
git checkout -b feature/my-new-feature
git add .
git commit -m "feat: my changes on correct branch"
```

---

### Trap 2: "I committed something by mistake and want to undo the commit!"
**Fix:** Undo the commit but **keep your written code safe in your files**:
```bash
git reset --soft HEAD~1
```

---

### Trap 3: "I made a mess in a file and want to discard all my changes back to last commit!"
**Fix:** Discard changes to a single file:
```bash
git restore path/to/file.tsx

# Or discard all local modifications in entire project:
git restore .
```

---

### Trap 4: "GitHub blocked my push because of secrets!"
**Fix:** 
1. Remove the secret from `.env.example` (put blank placeholder).
2. Amend your last commit:
```bash
git add .env.example
git commit --amend --no-edit
git push
```

---

### Trap 5: "Git says: 'error: Your local changes to the following files would be overwritten by checkout'"
**Fix:** Git is protecting you from losing uncommitted work. Either commit it or stash it:
```bash
git stash
git checkout other-branch
```

---

## 📋 Quick Command Cheat Sheet

| Task | Command |
| :--- | :--- |
| **Check current branch & modified files** | `git status` |
| **View branch list** | `git branch -a` |
| **Pull latest changes on current branch** | `git pull` |
| **Create & switch to new branch** | `git checkout -b <branch-name>` |
| **Switch to existing branch** | `git checkout <branch-name>` |
| **Stage all changes** | `git add .` |
| **Commit staged changes** | `git commit -m "type(scope): message"` |
| **First push of new branch** | `git push -u origin <branch-name>` |
| **Subsequent pushes** | `git push` |
| **Fetch remote updates without merging** | `git fetch origin` |
| **Save messy work temporarily** | `git stash` |
| **Restore saved work** | `git stash pop` |
| **Undo last commit (keep code)** | `git reset --soft HEAD~1` |
| **Discard modifications to file** | `git restore <file>` |
| **View commit history** | `git log --oneline -n 10` |

---