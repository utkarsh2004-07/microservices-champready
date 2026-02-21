# ChampReady Microservices Platform

Production-oriented starter for a student exam preparation platform where admins create/publish mock tests and students attempt only exam-specific tests.

## Architecture

- `services/auth-service`: authentication, JWT issuance, role handling
- `services/user-service`: student profile + selected exam
- `services/mocktest-service`: mock test creation/publishing/submission
- `services/result-service`: results retrieval and ranking
- `api-gateway`: single entrypoint, token validation, routing to services
- `frontend`: placeholder for Next.js/React UI

## Core Features Included

- Syllabus/notices-ready data model extension points
- Eligibility-ready user profile fields
- Mock tests (admin create/publish + student attempt)
- Notes/content-ready service integration points
- Exam date/notification-ready hooks

## Quick Start

1. Copy envs:
   ```bash
   cp .env.example .env
   ```
2. Run:
   ```bash
   docker compose up --build
   ```
3. API Gateway available at `http://localhost:8080`

## API Summary

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### User
- `GET /users/me`
- `PUT /users/update-exam`

### Mock Tests
- `POST /admin/mock-tests`
- `POST /admin/mock-tests/:id/publish`
- `GET /mock-tests?exam=JEE`
- `GET /mock-tests/:id`
- `POST /mock-tests/:id/submit`

### Results
- `GET /results/me`
- `GET /results/:mockTestId/rank`

## Production Hardening Next Steps

- Add message queue (RabbitMQ/Kafka) for async notifications
- Add rate limiting + WAF policies at gateway
- Add CI pipeline, OpenTelemetry, SLO dashboards
- Add Redis caching for hot mock tests and rank lists
- Add Kubernetes manifests/Helm
