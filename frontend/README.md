# Frontend

Production-style dashboard UI served by Nginx (static build).

Recommended stack: Next.js + Tailwind CSS.

## Includes (Current / Planned)

- Auth: register/login
- Profile + eligibility check
- Admin dashboard:
  - Create mock tests
  - Add questions
  - Publish tests
- Student dashboard:
  - Choose exam
  - List mock tests
  - Attempt tests
  - View results, rank, progress
- Content views:
  - Notes, syllabus, PYQs (via content-service)

## Dev Notes

- Build frontend as a static bundle and serve via Nginx in production.
- During development, run Next.js dev server and proxy API calls to `http://localhost:8080`.
- Keep API base URL configurable via env (e.g., `VITE_API_URL` or `NEXT_PUBLIC_API_URL`).
