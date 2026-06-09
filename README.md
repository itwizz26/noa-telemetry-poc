<p align="center">
  <img src="noa.png" alt="NOA logo" width="auto" />
</p>

# NOA Telemetry POC

A proof-of-concept telemetry platform composed of a Django backend, a Next.js frontend, and Terraform infrastructure definitions. The repository is currently structured for local development and incremental feature work on the `dev` branch, with `main` reserved for production-ready releases.

## What this repo contains

- `backend/` — Django + DRF API, Celery-style task flow, telemetry models, serializers, and ingestion endpoints.
- `frontend/` — Next.js app for the dashboard and telemetry UI.
- `terraform/` — Infrastructure-as-code definitions for queue and deployment support.
- `docker-compose.yml` — Local services for PostgreSQL, Redis, and LocalStack.

## Current architecture

- Backend: Python, Django, Django REST Framework, Celery, Redis, PostgreSQL-style persistence.
- Frontend: Next.js 16, React 19, TypeScript, Tailwind-style styling.
- Infrastructure: Docker Compose for local services and Terraform for cloud resource definitions.

## Quick start

1. Start local infrastructure
   - `docker-compose up`

2. Backend
   - Create and activate a Python virtual environment in `backend/`.
   - Install dependencies: `pip install -r requirements.txt`
   - Apply migrations: `python manage.py migrate`
   - Start the API: `python manage.py runserver`

3. Frontend
   - In `frontend/`, install dependencies: `npm install`
   - Start the UI: `npm run dev`

4. Optional simulation
   - Run `python simulate_grid.py` from `backend/` to send sample telemetry into the ingestion endpoint.

## Repo conventions

- `main` is the production branch.
- `dev` is the active development branch.
- Create feature branches from `dev`, then merge them back into `dev` before promoting to `main`.
- Keep config and secrets out of version control; use local environment files and ignore rules.

## Notes

- The root `.gitignore` covers repo-wide noise.
- Service-specific ignore files exist in `backend/` and `terraform/` for environment and infrastructure artifacts.
- The frontend also has its own ignore rules in `frontend/.gitignore`.

## Next steps

- Add tests for backend and frontend flows.
- Wire real queue and database integration.
- Extend the dashboard and telemetry analytics views.
- Harden deployment and infrastructure automation.
