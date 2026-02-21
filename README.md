# ChampReady Microservices Platform

Production-oriented platform for student exam preparation where admins create/publish mock tests and students access exam-specific learning + analysis dashboards.

## Architecture

- `services/auth-service`: authentication, JWT, roles, premium flag
- `services/user-service`: profile, selected exam, eligibility engine
- `services/mocktest-service`: admin mock management + student submissions
- `services/result-service`: scores, ranking, progress analysis
- `services/content-service`: notes/syllabus/PYQ/YouTube/notifications content buckets
- `api-gateway`: single secured entrypoint and route proxy
- `frontend`: working dashboard UI (admin + student journey)

## Feature Flow (from your diagram)

1. User authentication
2. User profile stores age/stream/subjects/category
3. Eligibility engine returns eligible and non-eligible exam explanations
4. Student selects exam and enters exam dashboard
5. Dashboard modules:
   - Notes, PYQ, syllabus with access control
   - Mock tests and result analytics
   - AI-ready layer placeholders: roadmap/timetable/doubt/progress
6. Progress tracker classifies strengths + weak areas from result data

## Core APIs

### Auth Service
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### User Service
- `GET /users/me`
- `PUT /users/profile`
- `POST /users/eligibility/check`
- `PUT /users/update-exam`

### Mock Test Service
- `POST /admin/mock-tests`
- `POST /admin/mock-tests/:id/publish`
- `GET /mock-tests?exam=JEE`
- `GET /mock-tests/:id`
- `POST /mock-tests/:id/submit`

### Result Service
- `GET /results/me`
- `GET /results/progress/overview`
- `GET /results/:mockTestId/rank`

### Content Service
- `POST /admin/content`
- `GET /content?kind=notes`

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

- API Gateway: `http://localhost:8080`
- Frontend: `http://localhost:5173`

## Production Next Steps

- Move internal service auth to signed service-to-service tokens
- Add Redis caching for content and ranking endpoints
- Add async notification service via RabbitMQ/Kafka
- Add audit logs and observability (OpenTelemetry)
- Add Kubernetes manifests/Helm + CI/CD
