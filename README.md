# Zece la Info

Full-stack platform for learning computer science and preparing for Romanian university entrance exams and the Baccalaureate.

**Author:** [Paul Ioan Someșan](https://github.com/SomesanPaulIoan) · **Website:** [zecelainfo.ro](https://zecelainfo.ro)

## Features

- Problem catalog, code editor and asynchronous submission evaluation.
- Interactive coding playground with multi-file projects and terminal support.
- Multiple-choice practice and exam simulations.
- Baccalaureate subject workflows, submissions and assisted grading.
- Courses, tutoring, homework and teacher/admin workspaces.
- Account authentication, email verification and Google sign-in integration.
- Payment, invoicing and marketing integrations configured through environment variables.

## Architecture

| Component | Technology | Responsibility |
| --- | --- | --- |
| `frontend/` | Next.js 16, React 19, TypeScript, Tailwind CSS | Student, teacher and admin interfaces |
| `backend/` | Express 5, TypeScript, PostgreSQL | Authentication, application API and integrations |
| `judge/` | Node.js, BullMQ, Redis, isolate | Background code execution and evaluation |
| `database/` | PostgreSQL SQL migrations | Schema and development seeds |
| `deploy/` | Docker Compose, Nginx | Deployment configuration and documentation |

The API queues code submissions through Redis/BullMQ; a separate judge worker executes them and persists results in PostgreSQL. The playground also uses WebSockets for interactive execution.

## Local development

Prerequisites: Node.js 22 or newer, npm, Docker Engine/Desktop and Docker Compose.

```bash
npm ci
npm ci --prefix backend
npm ci --prefix frontend
cp .env.example .env
cp backend/.env.example backend/.env
cp judge/.env.example judge/.env
cp frontend/.env.example frontend/.env.local
npm run dev:start
```

Frontend: <http://localhost:3000> · API health: <http://localhost:4000/health>

`dev:start` starts PostgreSQL, Redis and the judge with Docker Compose, then runs the backend and frontend locally. SQL files in `database/` initialize a fresh PostgreSQL volume. Existing volumes require applying new migrations separately. Judge dependencies are installed by its Docker build.

The checked-in database password and `secret_local` are disposable development defaults. Use independent, strong credentials for deployment. Keep the same `JUDGE_SECRET` in the API and worker configurations. Optional integrations require your own provider credentials; leave them unset when not in use.

The repository includes application source and development seed scripts. Production database exports, student submissions, invoices, uploaded files and educational PDF/image libraries are excluded. A fresh checkout therefore does not contain production accounts or the complete learning catalog. Some pages require importing your own content and configuring the relevant services.

## Validation

```bash
npm run typecheck --prefix backend
cd frontend
npx tsc --noEmit
```

## Deployment

See [the VPS guide](deploy/README-VPS.md). Production configuration belongs in local environment files or a secret manager. Publishing this repository does not deploy changes to the live website.

## Publication and privacy

Real `.env` files, database dumps, private keys, runtime storage and local Git histories are excluded. The public configuration templates contain only empty fields and development defaults. No production credentials are required to read or review this project.

No redistribution license has been granted by this repository. Third-party packages and assets remain subject to their respective terms.
