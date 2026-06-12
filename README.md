<p align="center">
  <img src="noa.png" alt="NOA logo" width="auto" />
</p>

# NOA Telemetry POC

A proof-of-concept telemetry platform composed of a Django backend, a Next.js frontend, and Terraform infrastructure definitions. The repository is currently structured for local development and incremental feature work on the `dev` branch, with `main` reserved for production-ready releases.

## What this repo contains

- `backend/` — Django + DRF API, Celery-style task flow, telemetry models, serializers, and ingestion endpoints.
- `frontend/` — Next.js app for the dashboard and telemetry UI.
- `terraform/` — Infrastructure-as-code definitions for queue and deployment support.
- `docker-compose.yml` — Local infrastructure plus the Django backend and Next.js frontend services.

## Current architecture

- Backend: Python, Django, Django REST Framework, Celery, Redis, PostgreSQL-style persistence.
- Frontend: Next.js 16, React 19, TypeScript, Tailwind-style styling.
- Infrastructure: Docker Compose for local services and Terraform for cloud resource definitions.

## Quick start

1. Start the full stack
   - `docker compose up --build`
   - This brings up PostgreSQL, Redis, LocalStack, the Django API on `http://localhost:8000`, and the Next.js UI on `http://localhost:3000`.

2. Backend (if you want to run it outside Docker)
   - Create and activate a Python virtual environment in `backend/`.
   - Install dependencies: `pip install -r requirements.txt`
   - Apply migrations: `python manage.py migrate`
   - Start the API: `python manage.py runserver`

3. Frontend (if you want to run it outside Docker)
   - In `frontend/`, install dependencies: `npm install`
   - Start the UI: `npm run dev`

5. Useful container commands
   - `docker compose logs -f backend`
   - `docker compose exec backend python manage.py migrate`
   - `docker compose down`

6. Optional simulation
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
- Harden deployment and infrastructure automation via orchestration.
