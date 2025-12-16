**Purpose**: Help AI coding agents quickly become productive by explaining architecture, workflows, developer commands, and patterns specific to this repository.

**Big Picture**:
- **Monorepo via Git Submodules**: Root repo links independent submodules: `Beancount-Trans-Backend`, `Beancount-Trans-Frontend`, `Beancount-Trans-Docs`, and `Beancount-Trans-Assets`.
- **Services**: Frontend (Vue 3 + TypeScript) → Backend (Django REST, Celery) → Postgres/Redis/MinIO for persistence; Docker Compose orchestrates these via `docker-compose.yaml`.

**Where to Start (Important files)**:
- **Project rules**: consult `.cursor/rules/` for repository-specific guidelines and policy files.

**Where to Start (Important files)**:
- Backend entry: `Beancount-Trans-Backend/manage.py` and `project/` (Django apps in `project/apps/`).
- Backend key code: `translate/` folder contains parser/transform implementations (e.g., `AliPay.py`, `WeChat.py`, `view.py`) — modify here for parsing features.
- Frontend entry: `Beancount-Trans-Frontend/src/` and top-level `package.json` scripts.
- Docker Compose orchestrator: `docker-compose.yaml` (root) - local dev/test environment.
- Dev commands: see submodule `README.md` files as single-source-of-truth for that submodule.

**Developer Workflows & Commands**:
- Quick local dev (backend + frontend):
  - Backend: `cd Beancount-Trans-Backend && python -m pip install -r requirements.txt && python manage.py migrate && python manage.py init_official_templates && python manage.py runserver`
  - Frontend: `cd Beancount-Trans-Frontend && npm install && npm run dev` (set `VITE_API_BASE_URL` to `http://localhost:8000/api` in `.env.development`).
  - Full stack with Docker Compose: `docker compose up` from repo root.
- Tests: Backend tests via `pytest` (configured by `pyproject.toml`): `cd Beancount-Trans-Backend && pytest`; Frontend tests via `npm test` in `Beancount-Trans-Frontend` when present.

**Common Conventions & Patterns**:
- **Django apps under `project/apps/`**: Add new features by creating an app under `project/apps/`; follow existing structure for migrations, management commands, views, and serializers.
- **Translate parsers**: Implement new parsers under `translate/views/` as classes or functions matching the project’s patterns (look at `AliPay.py`, `WeChat.py` as examples); add tests in `translate/tests.py`.
- **Management Commands**: Useful utilities (e.g., `init_official_templates`) live under `project/apps/<app>/management/commands/`.
- **Front-end Types/Contracts**: Frontend uses TypeScript definitions in `src/types/`. Update them if API changes; synchronize with backend OpenAPI specs (drf-spectacular generates OpenAPI).
- **API changes**: If changing backend API, update the OpenAPI doc, adjust front-end types and update any test mocks.

**CI/CD & Semantic Release**:
- Commits follow Conventional Commit format; Semantic Release triggers automatic tagging and releases when commits follow `feat`, `fix`, `chore`, etc.
- Each submodule has its own `Jenkinsfile` for building Docker images and running tests. Update the relevant `Jenkinsfile` when CI steps change.

**Integration Points**:
- Celery (worker/beat) for asynchronous parsing and long-running jobs; configuration entries are in backend scripts (`bin/`), Docker entrypoints in `docker-compose.yaml`.
- Object storage: MinIO used for uploaded assets - check `docker-compose.yaml` and `Beancount-Trans-Assets/`.
- DB and message queue: Postgres and Redis used by backend.

**Safety & Secrets**:
- Do not hardcode secrets into code; use environment variables (see `docker-compose.yaml` for examples). When writing tests or sample data, use the `fixtures/` or `Beancount-Trans-Assets/`.

**When You Make an API Change**:
1. Update backend view/serializer code in `project/apps/**` and `translate/` as needed.
2. Update or re-generate OpenAPI docs (drf-spectacular) and adjust frontend types in `Beancount-Trans-Frontend/src/types/`.
3. Add/update tests: `Beancount-Trans-Backend/translate/tests.py` and frontend component/integration tests.
4. Run tests locally (`pytest`, `npm test`) and run `docker compose up` integration if needed.

**Examples**:
- Adding a new parser: copy `translate/views/AliPay.py`, rename, adapt parsing logic, add tests in `translate/tests.py`, and wire the parser in `translate/view.py`.
- Updating the UI: Add Vite route + component under `Beancount-Trans-Frontend/src/router/` and `src/views/`, update API calls in `src/api/` and `src/types/`.

**Agent-Specific Guidance**:
- Prefer touching only one submodule at a time; when a change crosses submodule boundaries, update both backend and frontend types along with tests. 
- If running integration tasks, use `docker compose up` and `docker compose down` to keep environment clean.
- For code additions that modify public REST endpoints, update API specs and include a short example request/response in the test.
- For refactors, ensure all tests pass locally and CI `Jenkinsfile` scripts reflect changes if build steps changed.

**Where to Ask**: When unclear, use `README.md` and `docs/` in each submodule; open a PR with a detailed description of the change intent and run artifacts to aid reviewers.

**Questions for Maintainers (to surface when necessary)**:
- Preferred deployment image tags and build arguments in Dockerfiles when upgrading base images.
- Upgrade policy for third-party packages (e.g., Django version, Element Plus, BERT models).

---
If anything is unclear or you'd like more examples for specific tasks (adding a parser, adding an API, or adding a frontend view), ask and I'll expand this guidance with code snippets.
