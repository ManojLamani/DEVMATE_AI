# DevMate AI

A full-stack GitHub repository analyzer SaaS that uses machine learning to provide insights on issue difficulty, repository clustering, contribution success prediction, and personalized developer recommendations.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Material UI, Zustand, React Query |
| Backend | Node.js, Express, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| ML Service | FastAPI, Python 3.11, scikit-learn, XGBoost |
| Auth | JWT + Google OAuth 2.0 |
| DevOps | Docker, Docker Compose |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Python](https://python.org/) 3.11+
- [PostgreSQL](https://www.postgresql.org/) 15+ (or use Docker)
- [Docker](https://www.docker.com/) + Docker Compose (optional but recommended)

---

## Option 1 — Run with Docker (Recommended)

The easiest way to run the entire project.

**1. Clone the repository**
```bash
git clone https://github.com/ManojLamani/DEVMATE_AI.git
cd DEVMATE_AI
```

**2. Create a root `.env` file**
```bash
cp backend/.env.example .env
```

Edit `.env` with your values:
```env
POSTGRES_USER=devmate
POSTGRES_PASSWORD=devmate_secret
POSTGRES_DB=devmate

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_TOKEN=your_github_personal_access_token

VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**3. Start all services**
```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| ML Service | http://localhost:8000 |

**4. Run database migrations (first time only)**
```bash
docker compose exec backend npx prisma migrate deploy
```

---

## Option 2 — Run Manually (Without Docker)

### Step 1 — PostgreSQL

Create a database named `devmate_db` and note your credentials.

---

### Step 2 — Backend

```bash
cd backend
npm install
```

Create `.env` in the `backend/` folder:
```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/devmate_db"
JWT_SECRET="your_jwt_secret_key_here"
JWT_EXPIRES_IN="7d"
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_TOKEN=your_github_personal_access_token
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
ML_SERVICE_URL="http://localhost:8000"
```

Run migrations and start:
```bash
npm run db:generate
npm run db:migrate
npm run dev
```

Backend runs at **http://localhost:5000**

---

### Step 3 — ML Service

```bash
cd ml-service
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

Create `.env` in the `ml-service/` folder:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Start the service:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

ML Service runs at **http://localhost:8000**

---

### Step 4 — Frontend

```bash
cd frontend
npm install
```

Create `.env` in the `frontend/` folder:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

Start:
```bash
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## Getting API Keys

| Key | Where to get |
|---|---|
| `GITHUB_TOKEN` | [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens) — needs `repo` and `read:user` scopes |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client ID |
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com/) — required only for the AI repository explainer feature |

---

## Project Structure

```
DEVMATE_AI/
├── frontend/           # React + Vite frontend
│   └── src/
│       ├── pages/      # Route-level page components
│       ├── components/ # Shared UI components
│       ├── services/   # API service layer
│       └── store/      # Zustand state management
├── backend/            # Express + Prisma API
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       └── utils/
│   └── prisma/
│       └── schema.prisma
├── ml-service/         # FastAPI ML service
│   └── app/
│       ├── models/     # ML model classes
│       ├── schemas/    # Pydantic request schemas
│       ├── training/   # Model training scripts
│       └── utils/
│   └── saved_models/   # Pre-trained model files (.pkl)
└── docker-compose.yml
```

---

## Deployment (Free)

Deploy the full stack for free using **Vercel** (frontend) + **Render** (backend + ML) + **Supabase** (database).

---

### Step 1 — Database on Supabase (free)

1. Create a free account at [supabase.com](https://supabase.com)
2. Click **New Project**, set a name and password
3. Go to **Settings → Database → Connection string → URI**
4. Copy the `DATABASE_URL` — you'll need it in Step 2

---

### Step 2 — Backend + ML Service on Render (free)

1. Create a free account at [render.com](https://render.com)
2. Click **New → Blueprint** and connect your GitHub repo (`ManojLamani/DEVMATE_AI`)
3. Render will detect the `render.yaml` and create both services automatically
4. Fill in the environment variables for each service in the Render dashboard:

**devmate-backend:**
| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase connection string from Step 1 |
| `JWT_SECRET` | Any long random string |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GITHUB_TOKEN` | Your GitHub personal access token |
| `FRONTEND_URL` | `https://devmateai.com` (or Vercel URL for now) |
| `ML_SERVICE_URL` | `https://devmate-ml-service.onrender.com` |

**devmate-ml-service:**
| Variable | Value |
|---|---|
| `ANTHROPIC_API_KEY` | From Anthropic Console (optional) |

5. Click **Deploy** — Render will build and start both services
6. Note the backend URL (e.g. `https://devmate-backend.onrender.com`)

---

### Step 3 — Frontend on Vercel (free)

1. Create a free account at [vercel.com](https://vercel.com)
2. Click **Add New → Project** and import `ManojLamani/DEVMATE_AI`
3. Set **Root Directory** to `frontend`
4. Add environment variables:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://devmate-backend.onrender.com/api` |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth client ID |

5. Click **Deploy**
6. Vercel gives you a free URL like `devmate-ai.vercel.app`

---

### Step 4 — Custom Domain (optional, ~$10/year)

To use a domain like `devmateai.com`:

1. Buy the domain at [namecheap.com](https://namecheap.com) or [cloudflare.com/registrar](https://cloudflare.com/registrar) (~$10/year)
2. In Vercel: **Project → Settings → Domains → Add Domain** → enter `devmateai.com`
3. Vercel will show you DNS records — add them in your domain registrar's DNS settings
4. Update `FRONTEND_URL` in Render's backend env vars to `https://devmateai.com`
5. Add `https://devmateai.com` as an authorized origin in your Google OAuth credentials

> **Note:** Free Render services spin down after 15 minutes of inactivity and take ~30 seconds to wake up on the first request. Upgrade to Render's paid plan ($7/month) to keep services always-on.

---

## Features

- **Authentication** — Email/password and Google OAuth sign-in
- **Repository Analysis** — Fetch and store GitHub repo data (languages, contributors, issues, PRs, branches)
- **Issue Difficulty Prediction** — ML model classifies issues as Easy / Medium / Hard
- **Repository Clustering** — Groups repos by type (frontend, backend, data science, etc.)
- **Contribution Success Prediction** — Estimates likelihood of a PR being merged
- **AI Repository Explainer** — Claude-powered natural language explanation of a repository
- **Developer Recommendations** — Personalized repo and issue suggestions based on your profile
- **Analytics Dashboard** — Charts for commit activity, language breakdown, and PR trends
