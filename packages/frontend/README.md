# Classroom Management App — Frontend

React + TypeScript + Vite. Teacher dashboard + student portal.

## Setup

```bash
pnpm install
pnpm dev
```

## Structure

- `src/components/` — Reusable UI (Button, Card, Modal, Table, etc.)
- `src/pages/teacher/` — Teacher routes (Dashboard, ClassDetail, SubmissionReview)
- `src/pages/student/` — Student routes (Dashboard, ClassDetail, AssignmentView, Grades)
- `src/api/` — API client with JWT auth
- `src/contexts/` — AuthContext for login state

## Role routing

After login, teachers land on `/teacher/dashboard`, students on `/student/dashboard`.
Auth guards prevent cross-role access.
